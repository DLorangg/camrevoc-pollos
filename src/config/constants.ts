// ─── Precios ─────────────────────────────────────────────────────────────────

/** Precio unitario por pollo en pesos argentinos (ARS). Fácil de cambiar. */
export const PRECIO_POLLO = 8_000;

// ─── Datos bancarios para transferencia ──────────────────────────────────────

export const DATOS_BANCARIOS = {
  banco: "Santander",
  titular: "ISSFJ DON BOSCO NEUQUEN",
  cuit: "30610171601",
  cbu: "0720124620000002236168",
  alias: "GRUPOSDBNQN",
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
  "Guía",
] as const;

export type Etapa = (typeof ETAPAS)[number];
