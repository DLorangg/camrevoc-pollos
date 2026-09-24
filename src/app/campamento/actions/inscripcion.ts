"use server";

import { createCampamentoClient } from "@/lib/supabase/campamento";
import type { EtapaCampamento, RolCampamento, RegimenAlimentario } from "@/config/campamento";
import { getDestinoPorEtapa } from "@/config/campamento";

// ─── Input / Output types ────────────────────────────────────────────────────

export interface InscripcionInput {
  apellido: string;
  nombre: string;
  dni: string;
  etapa: EtapaCampamento;
  rol: RolCampamento;
  dificultad_pago: boolean;
  regimen_alimentario: RegimenAlimentario;
  detalle_alimentario: string;
  quiere_aportar: boolean;
  contacto_donacion: string;
}

export interface InscripcionResult {
  ok: true;
  data: {
    apellido: string;
    nombre: string;
    dni: string;
    etapa: string;
    rol: string;
    destino: string;
    tarifa: number;
    fechas: string;
  };
}

export interface InscripcionError {
  ok: false;
  error: string;
}

// ─── Server Action ───────────────────────────────────────────────────────────

export async function inscribirParticipante(
  input: InscripcionInput,
): Promise<InscripcionResult | InscripcionError> {
  // Validaciones básicas server-side
  const apellido = input.apellido.trim();
  const nombre = input.nombre.trim();
  const dni = input.dni.replace(/\D/g, "").trim();

  if (!apellido || !nombre || !dni) {
    return { ok: false, error: "Apellido, nombre y DNI son obligatorios." };
  }

  if (dni.length < 7 || dni.length > 9) {
    return { ok: false, error: "El DNI debe tener entre 7 y 9 dígitos." };
  }

  // Obtener destino
  let destino;
  try {
    destino = getDestinoPorEtapa(input.etapa);
  } catch {
    return { ok: false, error: "Etapa no válida." };
  }

  const supabase = createCampamentoClient();

  // Verificar DNI duplicado
  const { data: existente, error: checkError } = await supabase
    .from("inscriptos")
    .select("id")
    .eq("dni", dni)
    .maybeSingle();

  if (checkError) {
    console.error("[inscribirParticipante] Error al verificar DNI:", checkError);
    return {
      ok: false,
      error: "Ocurrió un error al verificar el DNI. Intentá nuevamente.",
    };
  }

  if (existente) {
    return { ok: false, error: "Este DNI ya se encuentra inscripto." };
  }

  // Insertar inscripción
  const { error: insertError } = await supabase.from("inscriptos").insert({
    apellido,
    nombre,
    dni,
    etapa: `${input.etapa} Etapa`,
    rol: input.rol,
    destino: destino.nombre,
    tarifa: destino.tarifa,
    dificultad_pago: input.dificultad_pago,
    regimen_alimentario: input.regimen_alimentario,
    detalle_alimentario: input.detalle_alimentario.trim() || null,
    quiere_aportar: input.quiere_aportar,
    contacto_donacion: input.contacto_donacion.trim() || null,
  });

  if (insertError) {
    console.error("[inscribirParticipante] Error al insertar:", insertError);

    // Caso especial: constraint unique en la BD (respaldo)
    if (insertError.code === "23505") {
      return { ok: false, error: "Este DNI ya se encuentra inscripto." };
    }

    return {
      ok: false,
      error: "No se pudo completar la inscripción. Intentá nuevamente.",
    };
  }

  return {
    ok: true,
    data: {
      apellido,
      nombre,
      dni,
      etapa: `${input.etapa} Etapa`,
      rol: input.rol,
      destino: destino.nombre,
      tarifa: destino.tarifa,
      fechas: destino.fechas,
    },
  };
}
