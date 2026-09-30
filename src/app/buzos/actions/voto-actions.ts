"use server";

import { revalidatePath } from "next/cache";
import { createBuzosClient } from "@/lib/supabase/buzos";
import {
  BUZOS_CONFIG,
  isVotacionAbierta,
  getFrenteById,
  getAtrasById,
  getColorById,
} from "@/config/buzos";

export interface VotoBuzosData {
  id?: string;
  dni: string;
  frente: string;
  atras: string | null;
  crv_manga: boolean;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface ObtenerVotoResponse {
  ok: boolean;
  cerrada?: boolean;
  existe?: boolean;
  voto?: VotoBuzosData;
  error?: string;
}

export interface RegistrarVotoResponse {
  ok: boolean;
  voto?: VotoBuzosData;
  error?: string;
}

/**
 * Consulta el estado general de apertura de la votación.
 */
export async function consultarEstadoVotacion() {
  const abierta = isVotacionAbierta();
  return {
    abierta,
    fechaCierreTexto: BUZOS_CONFIG.fechaCierreTexto,
    fechaCierreISO: BUZOS_CONFIG.fechaCierreISO,
  };
}

/**
 * Busca un voto previo por DNI para permitir su modificación mientras la votación esté abierta.
 */
export async function obtenerVotoPorDni(dniRaw: string): Promise<ObtenerVotoResponse> {
  const abierta = isVotacionAbierta();
  if (!abierta) {
    return {
      ok: false,
      cerrada: true,
      error: "La votación de Buzos 2027 ha cerrado. No se reciben nuevas consultas ni modificaciones.",
    };
  }

  const dni = dniRaw.replace(/\D/g, "").trim();
  if (!dni || dni.length < 7 || dni.length > 9) {
    return {
      ok: false,
      error: "El DNI ingresado no es válido. Debe contener entre 7 y 9 números.",
    };
  }

  try {
    const supabase = createBuzosClient();
    const { data, error } = await supabase
      .from("buzos_votos")
      .select("id, dni, frente, atras, crv_manga, color, created_at, updated_at")
      .eq("dni", dni)
      .maybeSingle();

    if (error) {
      console.error("[obtenerVotoPorDni] Error en Supabase:", error);
      return {
        ok: false,
        error: "Ocurrió un error al consultar tu voto. Por favor reintentá en unos instantes.",
      };
    }

    if (!data) {
      return { ok: true, existe: false };
    }

    return {
      ok: true,
      existe: true,
      voto: {
        id: data.id,
        dni: data.dni,
        frente: data.frente,
        atras: data.atras,
        crv_manga: Boolean(data.crv_manga),
        color: data.color,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (err: unknown) {
    console.error("[obtenerVotoPorDni] Excepción inesperada:", err);
    return {
      ok: false,
      error: "No pudimos conectar con el servidor de votación.",
    };
  }
}

/**
 * Registra o actualiza el voto de un animador/coordinador.
 * Un único voto activo por DNI (upsert con constraint UNIQUE).
 */
export async function registrarVoto(payload: {
  dni: string;
  frente: string;
  atras: string | null;
  crv_manga: boolean;
  color: string;
}): Promise<RegistrarVotoResponse> {
  // 1. Validación estricta de fecha/hora de cierre en servidor
  const abierta = isVotacionAbierta();
  if (!abierta) {
    return {
      ok: false,
      error:
        "La votación de Buzos 2027 ha cerrado definitivamente. No es posible registrar ni modificar votos.",
    };
  }

  // 2. Validación de DNI
  const dni = payload.dni.replace(/\D/g, "").trim();
  if (!dni || dni.length < 7 || dni.length > 9) {
    return {
      ok: false,
      error: "El DNI ingresado no es válido. Debe contener entre 7 y 9 números.",
    };
  }

  // 3. Validación de Frente
  const opcionFrente = getFrenteById(payload.frente);
  if (!opcionFrente) {
    return {
      ok: false,
      error: "El diseño de frente seleccionado no es válido.",
    };
  }

  // 4. Validación de Atrás (según si el frente tiene frase o no)
  let atrasFinal: string | null = null;
  if (opcionFrente.tieneFrase) {
    // Si el frente ya tiene frase, la espalda no corresponde
    atrasFinal = null;
  } else {
    // Si el frente no tiene frase, la espalda es obligatoria
    if (!payload.atras) {
      return {
        ok: false,
        error: "Debés seleccionar un diseño para la espalda del buzo.",
      };
    }
    const opcionAtras = getAtrasById(payload.atras);
    if (!opcionAtras) {
      return {
        ok: false,
        error: "El diseño de espalda seleccionado no es válido.",
      };
    }
    atrasFinal = opcionAtras.id;
  }

  // 5. Validación de Color
  const opcionColor = getColorById(payload.color);
  if (!opcionColor) {
    return {
      ok: false,
      error: "El color seleccionado no es válido.",
    };
  }

  // 6. Validación de CRV Manga
  const crvMangaFinal = Boolean(payload.crv_manga);

  try {
    const supabase = createBuzosClient();

    const { data, error } = await supabase
      .from("buzos_votos")
      .upsert(
        {
          dni,
          frente: opcionFrente.id,
          atras: atrasFinal,
          crv_manga: crvMangaFinal,
          color: opcionColor.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "dni" }
      )
      .select("id, dni, frente, atras, crv_manga, color, created_at, updated_at")
      .single();

    if (error) {
      console.error("[registrarVoto] Error al guardar voto en Supabase:", error);
      return {
        ok: false,
        error:
          "Ocurrió un error al registrar tu voto en la base de datos. Verificá que la tabla esté creada.",
      };
    }

    revalidatePath("/buzos");
    revalidatePath("/buzos/admin");

    return {
      ok: true,
      voto: {
        id: data.id,
        dni: data.dni,
        frente: data.frente,
        atras: data.atras,
        crv_manga: Boolean(data.crv_manga),
        color: data.color,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (err: unknown) {
    console.error("[registrarVoto] Excepción al registrar voto:", err);
    return {
      ok: false,
      error: "Ocurrió un error inesperado al procesar tu voto.",
    };
  }
}
