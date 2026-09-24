"use server";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "admin_session";
const OPERATOR_COOKIE = "admin_operator";

export type Operator = string;

// ─── Login / Logout ──────────────────────────────────────────────────────────

export async function loginAdmin(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, error: "Contraseña maestra no configurada en el servidor." };
  }
  if (password !== expected) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  jar.set(OPERATOR_COOKIE, "", { path: "/", maxAge: 0 });
  jar.delete(ADMIN_SESSION_COOKIE);
  jar.delete(OPERATOR_COOKIE);
}

// ─── Operator Management ─────────────────────────────────────────────────────

export async function setOperator(
  operator: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = operator.trim();
  if (!trimmed || trimmed.length < 2) {
    return { ok: false, error: "El nombre debe tener al menos 2 caracteres." };
  }
  if (trimmed.length > 50) {
    return { ok: false, error: "El nombre no puede superar los 50 caracteres." };
  }

  const jar = await cookies();
  jar.set(OPERATOR_COOKIE, trimmed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return { ok: true };
}

export async function clearOperator(): Promise<{ ok: boolean }> {
  const jar = await cookies();
  jar.set(OPERATOR_COOKIE, "", { path: "/", maxAge: 0 });
  jar.delete(OPERATOR_COOKIE);
  return { ok: true };
}

export async function getOperator(): Promise<string | null> {
  const jar = await cookies();
  const val = jar.get(OPERATOR_COOKIE)?.value?.trim();
  if (val && val.length > 0) {
    return val;
  }
  return null;
}
