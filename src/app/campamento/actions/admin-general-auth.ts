"use server";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const CAMPA_ADMIN_GENERAL_COOKIE = "campa_admin_general_session";

/**
 * Obtiene la contraseña de administración general.
 * Requiere estrictamente la variable CAMPAMENTO_ADMIN_GENERAL_PASSWORD.
 * No utiliza fallbacks inseguros.
 */
function getExpectedPassword(): string | null {
  const p = process.env.CAMPAMENTO_ADMIN_GENERAL_PASSWORD;
  return p && p.trim().length > 0 ? p.trim() : null;
}

/**
 * Token de sesión derivado de la contraseña con HMAC-SHA256.
 * Si cambia la variable de entorno, las sesiones existentes quedan invalidadas inmediatamente.
 */
function buildSessionToken(password: string): string {
  return createHmac("sha256", password)
    .update("campa-admin-general-session-v1")
    .digest("hex");
}

/**
 * Compara dos cadenas de forma segura frente a ataques de temporización.
 * Hashea ambas cadenas a SHA-256 (32 bytes fijos) para garantizar idéntica
 * longitud antes de llamar a timingSafeEqual, evitando cualquier filtración
 * de longitud por ramas de tiempo y previniendo excepciones por longitud dispar.
 */
function safeHashEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// ─── Login / Logout / Verificación de Sesión ─────────────────────────────────

export async function loginAdminGeneral(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const expected = getExpectedPassword();
  if (!expected) {
    return {
      ok: false,
      error:
        "Contraseña de administración general no configurada en el servidor (variable CAMPAMENTO_ADMIN_GENERAL_PASSWORD).",
    };
  }

  if (typeof password !== "string" || !safeHashEqual(password.trim(), expected)) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  const jar = await cookies();
  jar.set(CAMPA_ADMIN_GENERAL_COOKIE, buildSessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 horas
  });

  return { ok: true };
}

export async function logoutAdminGeneral(): Promise<void> {
  const jar = await cookies();
  jar.set(CAMPA_ADMIN_GENERAL_COOKIE, "", { path: "/", maxAge: 0 });
  jar.delete(CAMPA_ADMIN_GENERAL_COOKIE);
}

export async function verificarAdminGeneralSession(): Promise<boolean> {
  const expected = getExpectedPassword();
  if (!expected) return false;
  const jar = await cookies();
  const value = jar.get(CAMPA_ADMIN_GENERAL_COOKIE)?.value;
  if (!value) return false;
  return safeHashEqual(value, buildSessionToken(expected));
}
