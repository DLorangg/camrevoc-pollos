/**
 * Configuración oficial de la Convivencia Familiar CAMREVOC 2026.
 *
 * Es la única fuente de verdad para los datos de la actividad y el cierre de
 * inscripciones. No contiene datos bancarios: la web NO gestiona pagos.
 */

export const CONVIVENCIA_CONFIG = {
  nombre: "Convivencia Familiar CAMREVOC 2026",
  /** Fecha de la actividad (texto legible). */
  fechaTexto: "Sábado 17 de octubre de 2026",
  horarioTexto: "de 10:00 a 18:00 hs",
  lugarNombre: "Planta de Campamentos N.º 1",
  lugarDireccion: "Intendente Linares 1980, Neuquén",
  /** Tarifa escalonada: $5.000 por integrante hasta 2; desde 3 integrantes, total fijo. */
  precioPorIntegrante: 5000,
  /** Cantidad de integrantes desde la cual se cobra el total fijo. */
  integrantesParaTotalFijo: 3,
  /** Total fijo para familias de 3 o más integrantes. */
  precioTotalFijo: 15000,
  /** Modalidad de pago informativa (no se registra pago en la web). */
  pagoTexto: "Pago obligatorio en efectivo el día de la actividad.",
  /**
   * Cierre de inscripciones en America/Argentina/Buenos_Aires (UTC-3, sin horario de verano).
   * Viernes 16 de octubre de 2026 a las 23:59. Modificar aquí para cambiar el plazo.
   */
  fechaCierreISO: "2026-10-16T23:59:59-03:00",
  fechaCierreTexto: "viernes 16 de octubre de 2026 a las 23:59 hs",
} as const;

/** Elementos a llevar. No agregar ítems que no estén definidos expresamente. */
export const CONVIVENCIA_QUE_LLEVAR = [
  "Desayuno y almuerzo a la canasta.",
  "Agua saborizada.",
  "Ropa cómoda y zapatillas.",
  "Gorra y repelente.",
  "Manta o lona para sentarse.",
  "Materiales para escribir y pintar.",
] as const;

/**
 * Autorización para menores que asisten sin un adulto de su familia.
 * PENDIENTE: el documento todavía no fue definido. Cuando esté disponible,
 * completar `url` (enlace o archivo en /public) y poner `disponible: true`;
 * la UI mostrará automáticamente el enlace de descarga.
 */
export const CONVIVENCIA_AUTORIZACION_MENORES: {
  disponible: boolean;
  url: string | null;
} = {
  disponible: false,
  url: null,
};

/** Etapas válidas para integrantes vinculados a CAMREVOC. */
export const CONVIVENCIA_ETAPAS = [
  "1ra Etapa",
  "2da Etapa",
  "3ra Etapa",
  "4ta Etapa",
  "5ta Etapa",
  "6ta Etapa",
  "7ma Etapa",
  "Animador/a",
] as const;

export type ConvivenciaEtapa = (typeof CONVIVENCIA_ETAPAS)[number];

/** Edad (exclusiva) a partir de la cual una persona se considera adulta. */
export const CONVIVENCIA_EDAD_MAYORIA = 18;

/**
 * Calcula el costo total de la inscripción según la cantidad de integrantes.
 * 1 → $5.000 · 2 → $10.000 · 3 o más → $15.000 (total fijo).
 * Es la ÚNICA fórmula: el servidor la usa y nunca confía en un total del navegador.
 */
export function calcularPrecioConvivencia(cantidadIntegrantes: number): number {
  if (!Number.isInteger(cantidadIntegrantes) || cantidadIntegrantes < 1) return 0;
  return cantidadIntegrantes >= CONVIVENCIA_CONFIG.integrantesParaTotalFijo
    ? CONVIVENCIA_CONFIG.precioTotalFijo
    : cantidadIntegrantes * CONVIVENCIA_CONFIG.precioPorIntegrante;
}

/** Texto de la tarifa vigente (para mostrar antes de conocer la cantidad de integrantes). */
export const CONVIVENCIA_TARIFA_TEXTO =
  "1 integrante: $5.000 · 2 integrantes: $10.000 · 3 o más integrantes: $15.000 en total.";

/**
 * Devuelve `true` si las inscripciones siguen abiertas.
 * Debe evaluarse siempre en el servidor (reloj del servidor, no del navegador).
 */
export function isInscripcionConvivenciaAbierta(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(CONVIVENCIA_CONFIG.fechaCierreISO).getTime();
}

export const CONVIVENCIA_MENSAJE_CERRADA =
  "Las inscripciones a la Convivencia Familiar finalizaron.";
