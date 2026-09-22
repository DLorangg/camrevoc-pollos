"use server";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "admin_session";
const OPERATOR_COOKIE = "admin_operator";
const VALID_OPERATORS = ["Damián", "Pepo", "Facu", "Otro"] as const;
export type Operator = (typeof VALID_OPERATORS)[number];

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
  jar.delete(ADMIN_SESSION_COOKIE);
  jar.delete(OPERATOR_COOKIE);
}

export async function setOperator(
  operator: Operator,
): Promise<{ ok: boolean }> {
  if (!VALID_OPERATORS.includes(operator)) {
    return { ok: false };
  }
  const jar = await cookies();
  jar.set(OPERATOR_COOKIE, operator, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return { ok: true };
}

export async function getOperator(): Promise<Operator | null> {
  const jar = await cookies();
  const val = jar.get(OPERATOR_COOKIE)?.value;
  if (val && VALID_OPERATORS.includes(val as Operator)) {
    return val as Operator;
  }
  return null;
}
