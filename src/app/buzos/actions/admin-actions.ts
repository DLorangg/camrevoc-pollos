"use server";

import { cookies } from "next/headers";
import { createBuzosClient } from "@/lib/supabase/buzos";
import {
  OPCIONES_FRENTE,
  OPCIONES_ATRAS,
  OPCIONES_COLOR,
  getFrenteById,
  getAtrasById,
  getColorById,
} from "@/config/buzos";

const BUZOS_ADMIN_COOKIE = "buzos_admin_session";

export interface ItemResultado {
  id: string;
  nombre: string;
  archivo?: string;
  hex?: string;
  votos: number;
  porcentaje: number;
}

export interface ResultadosBuzosAdmin {
  totalVotantes: number;
  frente: ItemResultado[];
  atras: ItemResultado[];
  atrasNoCorresponde: number;
  crvManga: {
    si: number;
    siPorcentaje: number;
    no: number;
    noPorcentaje: number;
  };
  color: ItemResultado[];
  votosRecientes: Array<{
    id: string;
    dni: string;
    frenteNombre: string;
    atrasNombre: string;
    crvManga: boolean;
    colorNombre: string;
    colorHex?: string;
    updatedAt: string;
  }>;
}

// ─── Login / Logout ──────────────────────────────────────────────────────────

export async function loginBuzosAdmin(password: string): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.BUZOS_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!expected) {
    return {
      ok: false,
      error: "Contraseña de administración no configurada en las variables de entorno.",
    };
  }

  if (password.trim() !== expected.trim()) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  const jar = await cookies();
  jar.set(BUZOS_ADMIN_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return { ok: true };
}

export async function logoutBuzosAdmin(): Promise<void> {
  const jar = await cookies();
  jar.set(BUZOS_ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  jar.delete(BUZOS_ADMIN_COOKIE);
}

export async function verificarBuzosAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(BUZOS_ADMIN_COOKIE)?.value === "authenticated";
}

// ─── Obtener Resultados ──────────────────────────────────────────────────────

export async function obtenerResultadosAdmin(): Promise<{
  ok: boolean;
  resultados?: ResultadosBuzosAdmin;
  error?: string;
}> {
  const isAuth = await verificarBuzosAdminSession();
  if (!isAuth) {
    return { ok: false, error: "No autorizado. Iniciá sesión como administrador." };
  }

  try {
    const supabase = createBuzosClient();
    const { data: votos, error } = await supabase
      .from("buzos_votos")
      .select("id, dni, frente, atras, crv_manga, color, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[obtenerResultadosAdmin] Error consultando buzos_votos:", error);
      return { ok: false, error: "Error al consultar la tabla buzos_votos en la base de datos." };
    }

    const rows = votos || [];
    const total = rows.length;

    // 1. Frente
    const frenteConteo: Record<string, number> = {};
    OPCIONES_FRENTE.forEach((f) => (frenteConteo[f.id] = 0));
    rows.forEach((r) => {
      if (r.frente && frenteConteo[r.frente] !== undefined) {
        frenteConteo[r.frente]++;
      }
    });

    const frenteResultados: ItemResultado[] = OPCIONES_FRENTE.map((f) => {
      const cant = frenteConteo[f.id] || 0;
      return {
        id: f.id,
        nombre: f.nombre,
        archivo: f.archivo,
        votos: cant,
        porcentaje: total > 0 ? Math.round((cant / total) * 100) : 0,
      };
    }).sort((a, b) => b.votos - a.votos);

    // 2. Atrás
    const atrasConteo: Record<string, number> = {};
    OPCIONES_ATRAS.forEach((a) => (atrasConteo[a.id] = 0));
    let atrasNoCorresponde = 0;

    rows.forEach((r) => {
      if (!r.atras) {
        atrasNoCorresponde++;
      } else if (atrasConteo[r.atras] !== undefined) {
        atrasConteo[r.atras]++;
      }
    });

    // Total de votos que sí eligieron espalda (aquellos con frente sin frase)
    const totalConEspalda = total - atrasNoCorresponde;

    const atrasResultados: ItemResultado[] = OPCIONES_ATRAS.map((a) => {
      const cant = atrasConteo[a.id] || 0;
      return {
        id: a.id,
        nombre: a.nombre,
        archivo: a.archivo,
        votos: cant,
        porcentaje: totalConEspalda > 0 ? Math.round((cant / totalConEspalda) * 100) : 0,
      };
    }).sort((a, b) => b.votos - a.votos);

    // 3. CRV Manga
    let crvSi = 0;
    let crvNo = 0;
    rows.forEach((r) => {
      if (Boolean(r.crv_manga)) {
        crvSi++;
      } else {
        crvNo++;
      }
    });

    // 4. Color
    const colorConteo: Record<string, number> = {};
    OPCIONES_COLOR.forEach((c) => (colorConteo[c.id] = 0));
    rows.forEach((r) => {
      if (r.color && colorConteo[r.color] !== undefined) {
        colorConteo[r.color]++;
      }
    });

    const colorResultados: ItemResultado[] = OPCIONES_COLOR.map((c) => {
      const cant = colorConteo[c.id] || 0;
      return {
        id: c.id,
        nombre: c.nombre,
        archivo: c.archivo,
        hex: c.hex,
        votos: cant,
        porcentaje: total > 0 ? Math.round((cant / total) * 100) : 0,
      };
    }).sort((a, b) => b.votos - a.votos);

    // 5. Votos individuales con nombres legibles
    const votosRecientes = rows.map((r) => {
      const f = getFrenteById(r.frente);
      const a = r.atras ? getAtrasById(r.atras) : null;
      const c = getColorById(r.color);

      return {
        id: r.id,
        dni: r.dni,
        frenteNombre: f ? f.nombre : r.frente,
        atrasNombre: a ? a.nombre : "No corresponde (frente con frase)",
        crvManga: Boolean(r.crv_manga),
        colorNombre: c ? c.nombre : r.color,
        colorHex: c?.hex,
        updatedAt: r.updated_at,
      };
    });

    return {
      ok: true,
      resultados: {
        totalVotantes: total,
        frente: frenteResultados,
        atras: atrasResultados,
        atrasNoCorresponde,
        crvManga: {
          si: crvSi,
          siPorcentaje: total > 0 ? Math.round((crvSi / total) * 100) : 0,
          no: crvNo,
          noPorcentaje: total > 0 ? Math.round((crvNo / total) * 100) : 0,
        },
        color: colorResultados,
        votosRecientes,
      },
    };
  } catch (err: unknown) {
    console.error("[obtenerResultadosAdmin] Error inesperado:", err);
    return { ok: false, error: "Ocurrió un error inesperado al procesar los resultados." };
  }
}
