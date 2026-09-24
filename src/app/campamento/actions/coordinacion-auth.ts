"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getPinForEtapa, normalizarEtapa } from "@/config/campamento-coordinadores";
import { createCampamentoClient } from "@/lib/supabase/campamento";

const CAMPA_SESSION_COOKIE = "campa_etapa_session";

export interface CampaSession {
  etapa: string; // ej: "1ra"
  etapaNum: string; // "1" a "7"
  coordinador: string;
  esDefaultPin: boolean;
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
  const etapaNum = normalizarEtapa(etapaInput);
  if (!etapaNum) {
    return { ok: false, error: "Etapa inválida. Seleccioná una etapa de 1ra a 7ma." };
  }

  const nombreCoord = coordinador.trim();
  if (!nombreCoord || nombreCoord.length < 2) {
    return { ok: false, error: "Ingresá o seleccioná el nombre del coordinador/a." };
  }

  // Consultar PIN en base de datos o inicializar
  const pinRecord = await getOrInitPinRecord(etapaNum);

  if (pin.trim() !== pinRecord.pin) {
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
    etapa: `${etapaNum}ra`,
    etapaNum,
    coordinador: nombreCoord,
    esDefaultPin: pinRecord.es_default,
  };

  const jar = await cookies();
  jar.set(CAMPA_SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 horas
  });

  return { ok: true, etapaNum };
}

export async function getCampaSession(): Promise<CampaSession | null> {
  const jar = await cookies();
  const raw = jar.get(CAMPA_SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CampaSession;
    if (parsed.etapaNum && parsed.coordinador) {
      return {
        ...parsed,
        esDefaultPin: Boolean(parsed.esDefaultPin),
      };
    }
    return null;
  } catch {
    return null;
  }
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

  const etapaNum = session.etapaNum;
  const pinAct = pinActual.trim();
  const pinNuevo = nuevoPin.trim();
  const pinConf = confirmarPin.trim();

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
  if (pinNuevo === defaultPin) {
    return { ok: false, error: "El nuevo PIN no puede ser idéntico al PIN por defecto." };
  }

  // Obtener el registro actual para validar identidad
  const pinRecord = await getOrInitPinRecord(etapaNum);
  if (pinAct !== pinRecord.pin) {
    return { ok: false, error: "El PIN actual ingresado es incorrecto." };
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

  // Actualizar cookie de sesión reflejando esDefaultPin: false
  const updatedSession: CampaSession = {
    ...session,
    esDefaultPin: false,
  };

  const jar = await cookies();
  jar.set(CAMPA_SESSION_COOKIE, JSON.stringify(updatedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  revalidatePath(`/campamento/etapa/${etapaNum}`);

  return { ok: true };
}

