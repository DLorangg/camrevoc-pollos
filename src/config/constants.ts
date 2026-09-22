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

// ─── Etapas sugeridas ─────────────────────────────────────────────────────────

export const ETAPAS_SUGERIDAS = [
  "Huellas",
  "Caminantes",
  "Exploradores",
  "Guías y Scouts",
  "Clan Rover",
  "Comunidad Educativa",
  "Otra",
] as const;

export type EtapaSugerida = (typeof ETAPAS_SUGERIDAS)[number];
