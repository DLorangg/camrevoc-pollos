"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  COORDINADORES_POR_ETAPA,
  getPinForEtapa,
  normalizarEtapa,
} from "@/config/campamento-coordinadores";
import { createCampamentoClient } from "@/lib/supabase/campamento";

const CAMPA_SESSION_COOKIE = "campa_etapa_session";
const CAMPA_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 horas
const CAMPA_SESSION_VERSION = "v1";
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

export interface CampaSession {
  etapa: string; // ej: "1ra"
  etapaNum: string; // "1" a "7"
  coordinador: string;
  esDefaultPin: boolean;
}

interface CampaSessionTokenPayload extends CampaSession {
  iat: number;
  exp: number;
}

/**
 * Obtiene el secreto exclusivo de servidor para firmar y verificar la cookie `campa_etapa_session`.
 * Exige exclusivamente `CAMPAMENTO_SESSION_SECRET` con al menos 32 caracteres.
 * IMPORTANTE: Debe configurarse `CAMPAMENTO_SESSION_SECRET` en el entorno de servidor de Vercel
 * antes de desplegar esta versión. No utiliza secretos públicos (`NEXT_PUBLIC_*`), ni claves
 * de Supabase, ni valores predeterminados o fallbacks.
 */
function getCampaSessionSecret(): string | null {
  const dedicatedSecret = process.env.CAMPAMENTO_SESSION_SECRET?.trim();
  if (dedicatedSecret && dedicatedSecret.length >= 32) {
    return dedicatedSecret;
  }

  return null;
}

/**
 * Compara dos cadenas en tiempo constante mediante HMAC-SHA256.
 */
function safeCompareStrings(a: string, b: string): boolean {
  const digestA = createHmac("sha256", "campa-constant-time-compare").update(a, "utf8").digest();
  const digestB = createHmac("sha256", "campa-constant-time-compare").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}

function computeSessionSignature(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${CAMPA_SESSION_COOKIE}.${CAMPA_SESSION_VERSION}.${payloadB64}`, "utf8")
    .digest("base64url");
}

function validarEtapaEstricta(etapaInput: unknown): string | null {
  if (typeof etapaInput !== "string") return null;
  const trimmed = etapaInput.trim();
  const match = trimmed.match(/^([1-7])(?:(?:ra|da|ta|ma)(?:\s+etapa)?)?$/i);
  if (!match) return null;
  const etapaNum = match[1];
  return COORDINADORES_POR_ETAPA[etapaNum] ? etapaNum : null;
}

function signCampaSessionCookieValue(
  session: CampaSession,
  nowMs: number = Date.now(),
): string | null {
  const secret = getCampaSessionSecret();
  if (!secret) {
    return null;
  }

  const etapaNum = validarEtapaEstricta(session.etapaNum);
  const coordinador = typeof session.coordinador === "string" ? session.coordinador.trim() : "";
  if (!etapaNum || coordinador.length < 2 || coordinador.length > 120) {
    return null;
  }

  const payload: CampaSessionTokenPayload = {
    etapa: COORDINADORES_POR_ETAPA[etapaNum]?.etapaKey || `${etapaNum}ra`,
    etapaNum,
    coordinador,
    esDefaultPin: Boolean(session.esDefaultPin),
    iat: nowMs,
    exp: nowMs + CAMPA_SESSION_MAX_AGE_SECONDS * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signatureB64 = computeSessionSignature(payloadB64, secret);
  return `${payloadB64}.${signatureB64}`;
}

function verifyCampaSessionCookieValue(
  rawCookieValue: string,
  nowMs: number = Date.now(),
): CampaSession | null {
  if (
    typeof rawCookieValue !== "string" ||
    rawCookieValue.length === 0 ||
    rawCookieValue.length > 4096
  ) {
    return null;
  }

  const secret = getCampaSessionSecret();
  if (!secret) {
    return null;
  }

  const parts = rawCookieValue.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signatureB64] = parts;
  if (
    !payloadB64 ||
    !signatureB64 ||
    !BASE64URL_REGEX.test(payloadB64) ||
    !BASE64URL_REGEX.test(signatureB64)
  ) {
    return null;
  }

  const expectedSignatureB64 = computeSessionSignature(payloadB64, secret);
  const providedSigBuf = Buffer.from(signatureB64, "utf8");
  const expectedSigBuf = Buffer.from(expectedSignatureB64, "utf8");

  if (
    providedSigBuf.length !== expectedSigBuf.length ||
    !timingSafeEqual(providedSigBuf, expectedSigBuf)
  ) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(jsonStr);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (
      typeof record.etapa !== "string" ||
      typeof record.etapaNum !== "string" ||
      typeof record.coordinador !== "string" ||
      typeof record.esDefaultPin !== "boolean" ||
      typeof record.iat !== "number" ||
      typeof record.exp !== "number"
    ) {
      return null;
    }

    if (
      !Number.isFinite(record.iat) ||
      !Number.isFinite(record.exp) ||
      record.iat <= 0 ||
      record.exp <= record.iat
    ) {
      return null;
    }

    // Rechazar cookies vencidas, con vigencia superior al máximo permitido o con iat futuro
    if (
      nowMs >= record.exp ||
      record.iat > nowMs + 60_000 ||
      record.exp - record.iat > CAMPA_SESSION_MAX_AGE_SECONDS * 1000
    ) {
      return null;
    }

    if (!/^[1-7]$/.test(record.etapaNum) || !COORDINADORES_POR_ETAPA[record.etapaNum]) {
      return null;
    }

    const etapaDeLabel = validarEtapaEstricta(record.etapa);
    if (!etapaDeLabel || etapaDeLabel !== record.etapaNum) {
      return null;
    }

    const coordinadorLimpio = record.coordinador.trim();
    if (coordinadorLimpio.length < 2 || coordinadorLimpio.length > 120) {
      return null;
    }

    return {
      etapa: record.etapa.trim(),
      etapaNum: record.etapaNum,
      coordinador: coordinadorLimpio,
      esDefaultPin: record.esDefaultPin,
    };
  } catch {
    return null;
  }
}

/**
 * Consulta o inicializa el PIN en la tabla `etapas_pines` de Supabase.
 * Si no existe registro, inserta el default (`crv2027-e[etapa]`) y retorna dicho registro.
 */
async function getOrInitPinRecord(etapaNum: string): Promise<{ pin: string; es_default: boolean }> {
  const supabase = createCampamentoClient();
  const defaultPin = getPinForEtapa(etapaNum);

  try {
    const { data, error } = await supabase
      .from("etapas_pines")
      .select("pin, es_default")
      .eq("etapa", etapaNum)
      .maybeSingle();

    if (error) {
      console.warn("[getOrInitPinRecord] Error consultando etapas_pines:", error);
      return { pin: defaultPin, es_default: true };
    }

    if (data) {
      return {
        pin: data.pin,
        es_default: data.es_default ?? false,
      };
    }

    // No existe: insertar el default en la base de datos
    const { data: inserted, error: insertError } = await supabase
      .from("etapas_pines")
      .insert({
        etapa: etapaNum,
        pin: defaultPin,
        es_default: true,
      })
      .select("pin, es_default")
      .single();

    if (insertError || !inserted) {
      console.warn("[getOrInitPinRecord] Error insertando pin default:", insertError);
      return { pin: defaultPin, es_default: true };
    }

    return {
      pin: inserted.pin,
      es_default: inserted.es_default,
    };
  } catch (err) {
    console.warn("[getOrInitPinRecord] Excepción:", err);
    return { pin: defaultPin, es_default: true };
  }
}

/**
 * Obtiene los coordinadores ya registrados para una etapa desde Supabase.
 */
export async function obtenerCoordinadoresEtapa(etapa: number | string): Promise<string[]> {
  const etapaNum = normalizarEtapa(String(etapa));
  if (!etapaNum) return [];

  const supabase = createCampamentoClient();
  try {
    const { data, error } = await supabase
      .from("coordinadores_etapa")
      .select("nombre")
      .eq("etapa", etapaNum)
      .order("nombre", { ascending: true });

    if (error) {
      console.warn("[obtenerCoordinadoresEtapa] Error al consultar coordinadores:", error);
      return [];
    }

    return (data || []).map((row) => row.nombre);
  } catch (err) {
    console.warn("[obtenerCoordinadoresEtapa] Excepción al consultar coordinadores:", err);
    return [];
  }
}

export async function loginCoordinador(
  etapaInput: string,
  coordinador: string,
  pin: string,
): Promise<{ ok: boolean; error?: string; etapaNum?: string }> {
  const etapaNum = validarEtapaEstricta(etapaInput);
  if (!etapaNum) {
    return { ok: false, error: "Etapa inválida. Seleccioná una etapa de 1ra a 7ma." };
  }

  const nombreCoord = typeof coordinador === "string" ? coordinador.trim() : "";
  if (!nombreCoord || nombreCoord.length < 2 || nombreCoord.length > 120) {
    return { ok: false, error: "Ingresá o seleccioná el nombre del coordinador/a." };
  }

  const secret = getCampaSessionSecret();
  if (!secret) {
    console.error("[loginCoordinador] Secreto de sesión no configurado en variables de entorno.");
    return {
      ok: false,
      error: "Error de configuración de seguridad en el servidor.",
    };
  }

  // Consultar PIN en base de datos o inicializar
  const pinRecord = await getOrInitPinRecord(etapaNum);
  const pinIngresado = typeof pin === "string" ? pin.trim() : "";

  if (!pinIngresado || !safeCompareStrings(pinIngresado, pinRecord.pin)) {
    return { ok: false, error: "PIN incorrecto para la etapa seleccionada." };
  }

  // Auto-registro en tabla coordinadores_etapa (ON CONFLICT DO NOTHING)
  try {
    const supabase = createCampamentoClient();
    const { error: insertCoordError } = await supabase
      .from("coordinadores_etapa")
      .upsert(
        {
          etapa: etapaNum,
          nombre: nombreCoord,
        },
        { onConflict: "etapa,nombre", ignoreDuplicates: true }
      );

    if (insertCoordError) {
      console.warn("[loginCoordinador] Advertencia al registrar coordinador:", insertCoordError);
    }
  } catch (coordErr) {
    console.warn("[loginCoordinador] Excepción al auto-registrar coordinador:", coordErr);
  }

  const sessionData: CampaSession = {
    etapa: COORDINADORES_POR_ETAPA[etapaNum]?.etapaKey || `${etapaNum}ra`,
    etapaNum,
    coordinador: nombreCoord,
    esDefaultPin: pinRecord.es_default,
  };

  const signedToken = signCampaSessionCookieValue(sessionData);
  if (!signedToken) {
    return {
      ok: false,
      error: "No se pudo establecer una sesión segura. Verificá la configuración del servidor.",
    };
  }

  const jar = await cookies();
  jar.set(CAMPA_SESSION_COOKIE, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CAMPA_SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true, etapaNum };
}

export async function getCampaSession(): Promise<CampaSession | null> {
  const jar = await cookies();
  const raw = jar.get(CAMPA_SESSION_COOKIE)?.value;
  if (!raw) return null;

  return verifyCampaSessionCookieValue(raw);
}

export async function logoutCoordinador(): Promise<void> {
  const jar = await cookies();
  jar.set(CAMPA_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  jar.delete(CAMPA_SESSION_COOKIE);
}

/**
 * Server Action para actualizar el PIN de la etapa.
 * Verifica la sesión, coteja el PIN actual, actualiza la tabla etapas_pines y la cookie de sesión.
 */
export async function actualizarPinEtapa(
  pinActual: string,
  nuevoPin: string,
  confirmarPin: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getCampaSession();
  if (!session) {
    return { ok: false, error: "Sesión no válida o expirada. Por favor iniciá sesión nuevamente." };
  }

  const etapaNum = validarEtapaEstricta(session.etapaNum);
  if (!etapaNum) {
    return { ok: false, error: "Sesión no válida o expirada. Por favor iniciá sesión nuevamente." };
  }

  const pinAct = typeof pinActual === "string" ? pinActual.trim() : "";
  const pinNuevo = typeof nuevoPin === "string" ? nuevoPin.trim() : "";
  const pinConf = typeof confirmarPin === "string" ? confirmarPin.trim() : "";

  if (!pinAct) {
    return { ok: false, error: "Debés ingresar el PIN actual." };
  }

  if (pinNuevo.length < 6) {
    return { ok: false, error: "El nuevo PIN debe tener al menos 6 caracteres." };
  }

  if (pinNuevo !== pinConf) {
    return { ok: false, error: "Los campos del nuevo PIN no coinciden." };
  }

  const defaultPin = getPinForEtapa(etapaNum);
  if (safeCompareStrings(pinNuevo, defaultPin)) {
    return { ok: false, error: "El nuevo PIN no puede ser idéntico al PIN por defecto." };
  }

  // Obtener el registro actual para validar identidad
  const pinRecord = await getOrInitPinRecord(etapaNum);
  if (!safeCompareStrings(pinAct, pinRecord.pin)) {
    return { ok: false, error: "El PIN actual ingresado es incorrecto." };
  }

  const updatedSession: CampaSession = {
    ...session,
    etapa: COORDINADORES_POR_ETAPA[etapaNum]?.etapaKey || session.etapa,
    etapaNum,
    esDefaultPin: false,
  };

  const signedToken = signCampaSessionCookieValue(updatedSession);
  if (!signedToken) {
    return {
      ok: false,
      error: "Error de configuración de seguridad en el servidor.",
    };
  }

  const supabase = createCampamentoClient();

  // Actualizar en la tabla etapas_pines
  const { error: updateError } = await supabase
    .from("etapas_pines")
    .upsert({
      etapa: etapaNum,
      pin: pinNuevo,
      es_default: false,
      updated_at: new Date().toISOString(),
    });

  if (updateError) {
    console.error("[actualizarPinEtapa] Error actualizando PIN:", updateError);
    return { ok: false, error: "Error al guardar el nuevo PIN. Intentá nuevamente." };
  }

  // Actualizar cookie de sesión firmada reflejando esDefaultPin: false
  const jar = await cookies();
  jar.set(CAMPA_SESSION_COOKIE, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CAMPA_SESSION_MAX_AGE_SECONDS,
  });

  revalidatePath(`/campamento/etapa/${etapaNum}`);

  return { ok: true };
}

