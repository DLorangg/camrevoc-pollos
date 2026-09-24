"use server";

import { cookies } from "next/headers";
import { getPinForEtapa, normalizarEtapa } from "@/config/campamento-coordinadores";

const CAMPA_SESSION_COOKIE = "campa_etapa_session";

export interface CampaSession {
  etapa: string; // ej: "1" o "1ra"
  etapaNum: string; // "1" a "7"
  coordinador: string;
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

  const expectedPin = getPinForEtapa(etapaNum);
  if (pin.trim() !== expectedPin) {
    return { ok: false, error: "PIN incorrecto para la etapa seleccionada." };
  }

  const sessionData: CampaSession = {
    etapa: `${etapaNum}ra`,
    etapaNum,
    coordinador: nombreCoord,
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
      return parsed;
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
