"use server";

import { createConvivenciaClient } from "@/lib/supabase/convivencia";
import {
  CONVIVENCIA_MENSAJE_CERRADA,
  calcularPrecioConvivencia,
  isInscripcionConvivenciaAbierta,
} from "@/config/convivencia";
import { validarInscripcionConvivencia } from "@/lib/convivencia/validation";

export interface CrearInscripcionConvivenciaResult {
  ok: boolean;
  /** `true` si el rechazo se debe al cierre de inscripciones. */
  cerrada?: boolean;
  errors?: string[];
  inscripcionId?: string;
  cantidadIntegrantes?: number;
  /** Total a abonar en efectivo, calculado en el servidor. */
  precioTotal?: number;
}

const ERROR_GENERICO =
  "No pudimos registrar la inscripción por un problema técnico. Tus datos NO fueron guardados: por favor intentá nuevamente en unos minutos.";

/**
 * Registra una inscripción familiar a la Convivencia Familiar 2026.
 *
 * - Valida el plazo con el reloj del servidor (no el del navegador).
 * - Revalida TODOS los datos en el servidor (el cliente no es de confianza).
 * - Persiste cabecera + integrantes de forma atómica e idempotente por `envioId`
 *   mediante la función SQL `convivencia_registrar_inscripcion`.
 * - Solo informa éxito si la base de datos confirmó la operación.
 */
export async function createInscripcionConvivencia(
  input: unknown
): Promise<CrearInscripcionConvivenciaResult> {
  if (!isInscripcionConvivenciaAbierta()) {
    return { ok: false, cerrada: true, errors: [CONVIVENCIA_MENSAJE_CERRADA] };
  }

  const validacion = validarInscripcionConvivencia(input);
  if (!validacion.ok) {
    return { ok: false, errors: validacion.errors };
  }
  const { envioId, integrantes } = validacion.data;

  const payload = integrantes.map((i) => ({
    nombre: i.nombre,
    apellido: i.apellido,
    dni: i.dni,
    edad: i.edad,
    etapa: i.etapa,
    parentesco: i.parentesco,
    observaciones_salud: i.observacionesSalud,
    es_celiaco: i.esCeliaco,
    menor_acompanado: i.menorAcompanado,
    emergencia_nombre: i.contactoEmergencia?.nombre ?? null,
    emergencia_vinculo: i.contactoEmergencia?.vinculo ?? null,
    emergencia_telefono: i.contactoEmergencia?.telefono ?? null,
  }));

  try {
    const supabase = createConvivenciaClient();
    const { data, error } = await supabase.rpc("convivencia_registrar_inscripcion", {
      p_envio_id: envioId,
      p_integrantes: payload,
    });

    if (error || !data) {
      // No registrar datos personales: solo código y mensaje técnico del error.
      console.error("[createInscripcionConvivencia] Error de persistencia:", {
        code: error?.code,
        message: error?.message,
      });
      return { ok: false, errors: [ERROR_GENERICO] };
    }

    const res = data as {
      inscripcion_id?: string;
      cantidad_integrantes?: number;
    };
    if (!res.inscripcion_id || typeof res.cantidad_integrantes !== "number") {
      console.error("[createInscripcionConvivencia] Respuesta inesperada de la base de datos.");
      return { ok: false, errors: [ERROR_GENERICO] };
    }

    return {
      ok: true,
      inscripcionId: res.inscripcion_id,
      cantidadIntegrantes: res.cantidad_integrantes,
      // Calculado siempre en el servidor a partir de lo realmente registrado.
      precioTotal: calcularPrecioConvivencia(res.cantidad_integrantes),
    };
  } catch (err) {
    console.error(
      "[createInscripcionConvivencia] Error inesperado:",
      err instanceof Error ? err.message : "desconocido"
    );
    return { ok: false, errors: [ERROR_GENERICO] };
  }
}
