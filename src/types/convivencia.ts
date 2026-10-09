/** Tipos del módulo Convivencia Familiar 2026. */

/** Integrante tal como llega validado/normalizado desde el formulario. */
export interface IntegranteConvivenciaInput {
  nombre: string;
  apellido: string;
  /** Solo dígitos, 7 a 9. */
  dni: string;
  edad: number;
  /** Etapa CAMREVOC. Obligatoria para el titular; opcional para los demás. */
  etapa: string | null;
  /** `null` para el titular; obligatorio para los demás. */
  parentesco: string | null;
  observacionesSalud: string | null;
  /** Solo aplica a menores de edad; `null` para adultos. */
  menorAcompanado: boolean | null;
  contactoEmergencia: {
    nombre: string;
    vinculo: string;
    telefono: string;
  } | null;
}

export interface InscripcionConvivenciaInput {
  /** Clave de idempotencia generada por el navegador para evitar duplicados por reintentos. */
  envioId: string;
  hayCeliaco: boolean;
  /** El primer elemento es siempre el titular vinculado a CAMREVOC. */
  integrantes: IntegranteConvivenciaInput[];
}

/** Fila de `convivencia_integrantes`. */
export interface IntegranteConvivenciaRow {
  id: string;
  inscripcion_id: string;
  orden: number;
  es_titular: boolean;
  nombre: string;
  apellido: string;
  dni: string;
  edad: number;
  etapa: string | null;
  parentesco: string | null;
  observaciones_salud: string | null;
  menor_acompanado: boolean | null;
  emergencia_nombre: string | null;
  emergencia_vinculo: string | null;
  emergencia_telefono: string | null;
}

/** Fila de `convivencia_inscripciones` con sus integrantes. */
export interface InscripcionConvivenciaRow {
  id: string;
  created_at: string;
  hay_celiaco: boolean;
  convivencia_integrantes: IntegranteConvivenciaRow[];
}
