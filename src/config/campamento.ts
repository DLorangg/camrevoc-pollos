// ─── Campamento: Destinos y Tarifas (Enero 2027) ─────────────────────────────

export type EtapaCampamento =
  | "1ra"
  | "2da"
  | "3ra"
  | "4ta"
  | "5ta"
  | "6ta"
  | "7ma";

export type RolCampamento = "CRVQUISTA" | "ANIMADOR" | "COORDINADOR";

export type RegimenAlimentario =
  | "Omnívoro"
  | "Vegetariano"
  | "Celíaco"
  | "Vegano"
  | "Otros";

export interface DestinoCampamento {
  nombre: string;
  tarifa: number;
  fechas: string;
  etapas: EtapaCampamento[];
}

export const DESTINOS: DestinoCampamento[] = [
  {
    nombre: "Junín",
    tarifa: 550_000,
    fechas: "20 al 24 de Enero 2027",
    etapas: ["1ra", "2da", "3ra", "6ta", "7ma"],
  },
  {
    nombre: "Regina",
    tarifa: 200_000,
    fechas: "27 al 31 de Enero 2027",
    etapas: ["4ta", "5ta"],
  },
];

export const ETAPAS_CAMPAMENTO: EtapaCampamento[] = [
  "1ra",
  "2da",
  "3ra",
  "4ta",
  "5ta",
  "6ta",
  "7ma",
];

export const ROLES_CAMPAMENTO: RolCampamento[] = [
  "CRVQUISTA",
  "ANIMADOR",
  "COORDINADOR",
];

export const REGIMENES_ALIMENTARIOS: RegimenAlimentario[] = [
  "Omnívoro",
  "Vegetariano",
  "Celíaco",
  "Vegano",
  "Otros",
];

/**
 * Dado una etapa, retorna el destino correspondiente (Junín o Regina).
 */
export function getDestinoPorEtapa(
  etapa: EtapaCampamento,
): DestinoCampamento {
  const destino = DESTINOS.find((d) => d.etapas.includes(etapa));
  if (!destino) {
    throw new Error(`Etapa no válida: ${etapa}`);
  }
  return destino;
}

/**
 * Formatea un precio en pesos argentinos.
 */
export function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}
