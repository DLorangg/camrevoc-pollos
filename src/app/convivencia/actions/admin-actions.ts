"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import { createConvivenciaClient } from "@/lib/supabase/convivencia";
import type { InscripcionConvivenciaRow } from "@/types/convivencia";

const CONVIVENCIA_ADMIN_COOKIE = "convivencia_admin_session";

/** Contraseña de administración: propia del módulo o, en su defecto, la maestra existente. */
function getExpectedPassword(): string | null {
  const p = process.env.CONVIVENCIA_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  return p ? p.trim() : null;
}

/**
 * Token de sesión derivado de la contraseña (HMAC-SHA256). A diferencia de un valor fijo,
 * no puede falsificarse sin conocer la contraseña, y cambiarla invalida las sesiones activas.
 */
function buildSessionToken(password: string): string {
  return createHmac("sha256", password).update("convivencia-admin-session-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ─── Login / Logout ──────────────────────────────────────────────────────────

export async function loginConvivenciaAdmin(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const expected = getExpectedPassword();
  if (!expected) {
    return {
      ok: false,
      error: "Contraseña de administración no configurada en el servidor.",
    };
  }

  if (typeof password !== "string" || !safeEqual(password.trim(), expected)) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  const jar = await cookies();
  jar.set(CONVIVENCIA_ADMIN_COOKIE, buildSessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return { ok: true };
}

export async function logoutConvivenciaAdmin(): Promise<void> {
  const jar = await cookies();
  jar.set(CONVIVENCIA_ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  jar.delete(CONVIVENCIA_ADMIN_COOKIE);
}

export async function verificarConvivenciaAdminSession(): Promise<boolean> {
  const expected = getExpectedPassword();
  if (!expected) return false;
  const jar = await cookies();
  const value = jar.get(CONVIVENCIA_ADMIN_COOKIE)?.value;
  if (!value) return false;
  return safeEqual(value, buildSessionToken(expected));
}

// ─── Consulta de inscripciones (disponible también después del cierre) ───────

export async function obtenerInscripcionesConvivencia(): Promise<{
  ok: boolean;
  inscripciones?: InscripcionConvivenciaRow[];
  error?: string;
}> {
  const isAuth = await verificarConvivenciaAdminSession();
  if (!isAuth) {
    return { ok: false, error: "No autorizado. Iniciá sesión como administrador." };
  }

  try {
    const supabase = createConvivenciaClient();
    const { data, error } = await supabase
      .from("convivencia_inscripciones")
      .select("*, convivencia_integrantes(*)")
      .order("created_at", { ascending: false })
      .order("orden", { referencedTable: "convivencia_integrantes", ascending: true });

    if (error) {
      console.error("[obtenerInscripcionesConvivencia] Error de consulta:", {
        code: error.code,
        message: error.message,
      });
      return {
        ok: false,
        error:
          "No se pudieron consultar las inscripciones. Verificá que la migración de Convivencia Familiar esté ejecutada en Supabase.",
      };
    }

    return { ok: true, inscripciones: (data ?? []) as InscripcionConvivenciaRow[] };
  } catch (err) {
    console.error(
      "[obtenerInscripcionesConvivencia] Error inesperado:",
      err instanceof Error ? err.message : "desconocido"
    );
    return { ok: false, error: "Ocurrió un error inesperado al consultar las inscripciones." };
  }
}

// ─── Exportación a Excel (.xlsx) ─────────────────────────────────────────────

export interface ExportarInscriptosResult {
  ok: boolean;
  base64?: string;
  filename?: string;
  total?: number;
  error?: string;
}

export async function exportarInscriptosConvivencia(): Promise<ExportarInscriptosResult> {
  const isAuth = await verificarConvivenciaAdminSession();
  if (!isAuth) {
    return { ok: false, error: "No autorizado. Iniciá sesión como administrador." };
  }

  try {
    const supabase = createConvivenciaClient();
    // Se seleccionan estrictamente nombre, apellido y DNI; sin datos de salud ni contactos de emergencia.
    const { data, error } = await supabase
      .from("convivencia_integrantes")
      .select("nombre, apellido, dni");

    if (error) {
      console.error("[exportarInscriptosConvivencia] Error de consulta:", {
        code: error.code,
        message: error.message,
      });
      return {
        ok: false,
        error:
          "No se pudieron consultar los integrantes. Verificá que la migración de Convivencia Familiar esté ejecutada en Supabase.",
      };
    }

    const integrantes = (data ?? []) as Array<{ nombre: string; apellido: string; dni: string }>;

    if (integrantes.length === 0) {
      return {
        ok: true,
        total: 0,
      };
    }

    // Ordenar alfabéticamente por apellido y luego por nombre
    integrantes.sort((a, b) => {
      const compApellido = a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" });
      if (compApellido !== 0) return compApellido;
      return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
    });

    const rows = [
      ["Nombre", "Apellido", "DNI"],
      ...integrantes.map((i) => [i.nombre.trim(), i.apellido.trim(), String(i.dni).trim()]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Configurar celdas de DNI explícitamente como texto ('s') y formato '@' para preservar ceros iniciales
    for (let r = 1; r <= integrantes.length; r++) {
      const cellRef = XLSX.utils.encode_cell({ c: 2, r });
      if (ws[cellRef]) {
        ws[cellRef].t = "s";
        ws[cellRef].z = "@";
      }
    }

    ws["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 16 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inscriptos");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const base64 = Buffer.from(buf).toString("base64");

    return {
      ok: true,
      total: integrantes.length,
      base64,
      filename: "convivencia-familiar-2026-inscriptos.xlsx",
    };
  } catch (err) {
    console.error(
      "[exportarInscriptosConvivencia] Error inesperado:",
      err instanceof Error ? err.message : "desconocido"
    );
    return {
      ok: false,
      error: "Ocurrió un error inesperado al generar el archivo Excel de inscriptos.",
    };
  }
}

