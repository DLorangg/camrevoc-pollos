// ─── Precios ─────────────────────────────────────────────────────────────────

/** Precio unitario por pollo en pesos argentinos (ARS). Fácil de cambiar. */
export const PRECIO_POLLO = 40000;

// ─── Motivo de transferencia sugerido ─────────────────────────────────────────

export const MOTIVO_TRANSFERENCIA = "POLLADACRV";

// ─── Datos bancarios para transferencia ──────────────────────────────────────

export const DATOS_BANCARIOS = {
  banco: "Santander",
  titular: "ISSFJ DON BOSCO NEUQUEN",
  cuit: "30610171601",
  cbu: "0720124620000002236168",
  alias: "GRUPOSDBNQN",
  motivo: MOTIVO_TRANSFERENCIA,
} as const;

// ─── Etapas (select cerrado) ──────────────────────────────────────────────────

export const ETAPAS = [
  "1ra Etapa",
  "2da Etapa",
  "3ra Etapa",
  "4ta Etapa",
  "5ta Etapa",
  "6ta Etapa",
  "7ma Etapa",
  "Animadores",
] as const;

export type Etapa = (typeof ETAPAS)[number];

// ─── Fecha Límite de Venta de Pollos ─────────────────────────────────────────

/**
 * Fecha y hora límite para la venta de pollos en zona horaria America/Argentina/Buenos_Aires (UTC-3).
 * Martes 27 de octubre de 2026 a las 23:59:59.
 */
export const FECHA_CIERRE_VENTA_POLLOS_ISO = "2026-10-27T23:59:59-03:00";

/**
 * Devuelve `true` si la fecha/hora actual superó el plazo límite de la venta de pollos.
 */
export function isVentaPollosCerrada(now: Date = new Date()): boolean {
  return now.getTime() > new Date(FECHA_CIERRE_VENTA_POLLOS_ISO).getTime();
}
