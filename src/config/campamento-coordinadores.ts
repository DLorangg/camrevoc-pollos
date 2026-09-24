// ─── Configuración de Seguridad y PINs por Etapa ───────────────────────────

export interface CoordinadorConfig {
  etapaNum: number;
  nombreEtapa: string; // ej: "1ra Etapa"
  etapaKey: string;    // ej: "1ra"
  destino: "Junín" | "Regina";
  tarifa: number;
  coordinadoresSugeridos: string[];
  pinDefault: string;
}

export const COORDINADORES_POR_ETAPA: Record<string, CoordinadorConfig> = {
  "1": {
    etapaNum: 1,
    nombreEtapa: "1ra Etapa",
    etapaKey: "1ra",
    destino: "Junín",
    tarifa: 550_000,
    coordinadoresSugeridos: ["Sofi G.", "Lucas M.", "Jere P."],
    pinDefault: "crv2027-e1",
  },
  "2": {
    etapaNum: 2,
    nombreEtapa: "2da Etapa",
    etapaKey: "2da",
    destino: "Junín",
    tarifa: 550_000,
    coordinadoresSugeridos: ["Matias R.", "Valen B.", "Agus F."],
    pinDefault: "crv2027-e2",
  },
  "3": {
    etapaNum: 3,
    nombreEtapa: "3ra Etapa",
    etapaKey: "3ra",
    destino: "Junín",
    tarifa: 550_000,
    coordinadoresSugeridos: ["Cami S.", "Nico D.", "Lucia T."],
    pinDefault: "crv2027-e3",
  },
  "4": {
    etapaNum: 4,
    nombreEtapa: "4ta Etapa",
    etapaKey: "4ta",
    destino: "Regina",
    tarifa: 200_000,
    coordinadoresSugeridos: ["Facu L.", "Flor M.", "Joaquin C."],
    pinDefault: "crv2027-e4",
  },
  "5": {
    etapaNum: 5,
    nombreEtapa: "5ta Etapa",
    etapaKey: "5ta",
    destino: "Regina",
    tarifa: 200_000,
    coordinadoresSugeridos: ["Santi V.", "Mica P.", "Gonza R."],
    pinDefault: "crv2027-e5",
  },
  "6": {
    etapaNum: 6,
    nombreEtapa: "6ta Etapa",
    etapaKey: "6ta",
    destino: "Junín",
    tarifa: 550_000,
    coordinadoresSugeridos: ["Tomas A.", "Juli B.", "Martu G."],
    pinDefault: "crv2027-e6",
  },
  "7": {
    etapaNum: 7,
    nombreEtapa: "7ma Etapa",
    etapaKey: "7ma",
    destino: "Junín",
    tarifa: 550_000,
    coordinadoresSugeridos: ["Dami L.", "Pau O.", "Bauti M."],
    pinDefault: "crv2027-e7",
  },
};

/**
 * Obtiene el PIN válido para una etapa dada, verificando si está en process.env
 * (ej. PIN_ETAPA_1) o usando el valor predeterminado (ej. "crv2027-e1").
 */
export function getPinForEtapa(etapaNumOrKey: string | number): string {
  const numStr = String(etapaNumOrKey).replace(/\D/g, "");
  const envKey = `PIN_ETAPA_${numStr}`;
  const envValue = process.env[envKey]?.trim();
  if (envValue) {
    return envValue;
  }
  const config = COORDINADORES_POR_ETAPA[numStr];
  return config ? config.pinDefault : `crv2027-e${numStr}`;
}

/**
 * Normaliza un identificador de etapa (ej: "1", "1ra", "1ra Etapa") al número string ("1" a "7").
 */
export function normalizarEtapa(etapa: string): string | null {
  const match = etapa.match(/[1-7]/);
  return match ? match[0] : null;
}
