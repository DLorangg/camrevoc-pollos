/**
 * Configuración oficial y Catálogo de Diseños para Buzos 2027 (CAMREVOC)
 */

export interface OpcionFrente {
  id: string;
  nombre: string;
  descripcion?: string;
  archivo: string;
  tieneFrase: boolean;
}

export interface OpcionAtras {
  id: string;
  nombre: string;
  descripcion?: string;
  archivo: string;
}

export interface OpcionColor {
  id: string;
  nombre: string;
  hex: string;
  archivo: string;
}

// ─── Control de Cierre de Votación ──────────────────────────────────────────
export const BUZOS_CONFIG = {
  // Fecha y hora de cierre oficial en Argentina (UTC-3: America/Argentina/Buenos_Aires)
  // Formato ISO 8601 con offset -03:00. Modificar aquí para cambiar la fecha de cierre.
  fechaCierreISO: "2026-10-06T23:59:59-03:00",
  // Texto legible para informar a la comunidad
  fechaCierreTexto: "Martes 6 de Octubre a las 23:59 hs",
  // Flag manual de emergencia para coordinadores si desean cerrar antes
  forzarCierreManual: false,
};

/**
 * Determina si la votación se encuentra abierta.
 */
export function isVotacionAbierta(): boolean {
  if (BUZOS_CONFIG.forzarCierreManual) return false;
  const fechaCierre = new Date(BUZOS_CONFIG.fechaCierreISO).getTime();
  const ahora = Date.now();
  return ahora < fechaCierre;
}

// ─── Catálogo de Diseños de Frente ──────────────────────────────────────────
export const OPCIONES_FRENTE: OpcionFrente[] = [
  // A) Diseños SIN Frase (Habilitan la elección de un diseño para la espalda)
  {
    id: "DONBOSCO_MANGA",
    nombre: "Don Bosco en Manga",
    descripcion: "Logo CAMREVOC en el pecho y Don Bosco estampado en la manga.",
    archivo: "DONBOSCO MANGA.png",
    tieneFrase: false,
  },
  {
    id: "CRV_MANGA",
    nombre: "CRV en Manga",
    descripcion: "Logo CAMREVOC en el pecho y siglas CRV estampadas en la manga.",
    archivo: "CRV MANGA.png",
    tieneFrase: false,
  },
  // B) Diseños CON Frase (Ya incluyen frase al frente; la espalda queda como NO CORRESPONDE)
  {
    id: "FRASE_1",
    nombre: "Frase 1",
    descripcion: "«Las calles se vuelven patios y ahí quiero estar»",
    archivo: "FRASE 1.png",
    tieneFrase: true,
  },
  {
    id: "FRASE_3",
    nombre: "Frase 3",
    descripcion: "Diseño tipográfico con frase en el frente",
    archivo: "FRASE 3.png",
    tieneFrase: true,
  },
  {
    id: "FRASE_4",
    nombre: "Frase 4",
    descripcion: "Diseño con frase en el frente",
    archivo: "FRASE 4.png",
    tieneFrase: true,
  },
  {
    id: "FRASE_5",
    nombre: "Frase 5",
    descripcion: "Diseño con frase en el frente",
    archivo: "FRASE 5.png",
    tieneFrase: true,
  },
  {
    id: "FRASE_6",
    nombre: "Frase 6",
    descripcion: "Diseño con frase en el frente",
    archivo: "FRASE 6.png",
    tieneFrase: true,
  },
  {
    id: "FRASE_7",
    nombre: "Frase 7",
    descripcion: "Diseño con frase en el frente",
    archivo: "FRASE 7.png",
    tieneFrase: true,
  },
  {
    id: "FRENTE_8",
    nombre: "Frente 8",
    descripcion: "Diseño con frase en el frente",
    archivo: "FRENTE 8.png",
    tieneFrase: true,
  },
];

// ─── Catálogo de Diseños de Atrás (Espalda) ──────────────────────────────────
// Se muestran exclusivamente cuando el frente seleccionado NO tiene frase.
export const OPCIONES_ATRAS: OpcionAtras[] = [
  {
    id: "ATRAS_2",
    nombre: "Propuesta 2",
    descripcion: "«Siempre Alegres» con ilustración de Don Bosco en círculo amarillo",
    archivo: "2.png",
  },
  {
    id: "ATRAS_3",
    nombre: "Propuesta 3",
    descripcion: "«El que no vive para servir no sirve para vivir» (Azul y Verde)",
    archivo: "3.png",
  },
  {
    id: "ATRAS_4",
    nombre: "Propuesta 4",
    descripcion: "«El que no vive para servir no sirve para vivir» (Blanco Monocromo)",
    archivo: "4.png",
  },
  {
    id: "ATRAS_5",
    nombre: "Propuesta 5",
    descripcion: "«Siempre Alegres» con siluetas de comunidad CAMREVOC",
    archivo: "5.png",
  },
  {
    id: "ATRAS_11",
    nombre: "Propuesta 11",
    descripcion: "«Las calles se vuelven patios y ahí quiero estar» (Blanco)",
    archivo: "11.png",
  },
  {
    id: "ATRAS_12",
    nombre: "Propuesta 12",
    descripcion: "«Las calles se vuelven patios y ahí quiero estar» (Verde y Azul)",
    archivo: "12.png",
  },
  {
    id: "ATRAS_CRV_MANGA",
    nombre: "Propuesta CRV",
    descripcion: "«Las calles se vuelven patios» con detalle CRV",
    archivo: "CRV MANGA.png",
  },
];

// ─── Catálogo de Colores ─────────────────────────────────────────────────────
export const OPCIONES_COLOR: OpcionColor[] = [
  {
    id: "PETROLEO",
    nombre: "Petróleo",
    hex: "#2F5D7C",
    archivo: "Captura de pantalla 2026-09-29 002338.png",
  },
  {
    id: "MALBEC",
    nombre: "Malbec",
    hex: "#6B213F",
    archivo: "Captura de pantalla 2026-09-29 002348.png",
  },
  {
    id: "MARINO",
    nombre: "Marino",
    hex: "#101827",
    archivo: "Captura de pantalla 2026-09-29 002405.png",
  },
  {
    id: "NEGRO",
    nombre: "Negro",
    hex: "#111111",
    archivo: "Captura de pantalla 2026-09-29 002409.png",
  },
];

// ─── Helpers de Búsqueda ─────────────────────────────────────────────────────
export function getFrenteById(id: string): OpcionFrente | undefined {
  return OPCIONES_FRENTE.find((f) => f.id === id);
}

export function getAtrasById(id: string): OpcionAtras | undefined {
  return OPCIONES_ATRAS.find((a) => a.id === id);
}

export function getColorById(id: string): OpcionColor | undefined {
  return OPCIONES_COLOR.find((c) => c.id === id);
}
