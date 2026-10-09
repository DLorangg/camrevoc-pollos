import {
  CONVIVENCIA_EDAD_MAYORIA,
  CONVIVENCIA_ETAPAS,
} from "@/config/convivencia";
import type {
  InscripcionConvivenciaInput,
  IntegranteConvivenciaInput,
} from "@/types/convivencia";

/**
 * Validación pura (sin I/O) de una inscripción de Convivencia Familiar.
 * Se usa en el cliente para dar feedback temprano y, de forma AUTORITATIVA,
 * en la Server Action. Recibe `unknown` porque el servidor no puede confiar
 * en la forma de los datos enviados por el navegador.
 */

export type ResultadoValidacion =
  | { ok: true; data: InscripcionConvivenciaInput }
  | { ok: false; errors: string[] };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOMBRE = 80;
const MAX_PARENTESCO = 60;
const MAX_SALUD = 500;
const MAX_TELEFONO_DIGITOS = 15;

export function normalizarDni(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/[.\s-]/g, "") : "";
}

export function esDniValido(dni: string): boolean {
  return /^\d{7,9}$/.test(dni);
}

export function esMenor(edad: number): boolean {
  return edad < CONVIVENCIA_EDAD_MAYORIA;
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

function esTelefonoValido(tel: string): boolean {
  if (!/^[0-9+()\-\s]+$/.test(tel)) return false;
  const digitos = tel.replace(/\D/g, "").length;
  return digitos >= 6 && digitos <= MAX_TELEFONO_DIGITOS;
}

function parseEdad(v: unknown): number | null {
  if (typeof v === "number") {
    return Number.isInteger(v) ? v : null;
  }
  if (typeof v === "string" && /^\d{1,3}$/.test(v.trim())) {
    return parseInt(v.trim(), 10);
  }
  return null;
}

function validarIntegrante(
  raw: unknown,
  idx: number,
  errors: string[]
): IntegranteConvivenciaInput | null {
  const esTitular = idx === 0;
  const etiqueta = esTitular
    ? "Integrante vinculado a CAMREVOC"
    : `Integrante ${idx + 1}`;

  if (typeof raw !== "object" || raw === null) {
    errors.push(`${etiqueta}: datos inválidos.`);
    return null;
  }
  const r = raw as Record<string, unknown>;
  const errInicio = errors.length;

  const nombre = texto(r.nombre);
  const apellido = texto(r.apellido);
  if (!nombre) errors.push(`${etiqueta}: el nombre es obligatorio.`);
  else if (nombre.length > MAX_NOMBRE) errors.push(`${etiqueta}: el nombre es demasiado largo.`);
  if (!apellido) errors.push(`${etiqueta}: el apellido es obligatorio.`);
  else if (apellido.length > MAX_NOMBRE) errors.push(`${etiqueta}: el apellido es demasiado largo.`);

  const dni = normalizarDni(r.dni);
  if (!dni) errors.push(`${etiqueta}: el DNI es obligatorio.`);
  else if (!esDniValido(dni)) {
    errors.push(`${etiqueta}: el DNI debe tener entre 7 y 9 números.`);
  }

  const edad = parseEdad(r.edad);
  if (edad === null) errors.push(`${etiqueta}: la edad es obligatoria y debe ser un número entero.`);
  else if (edad < 0 || edad > 120) errors.push(`${etiqueta}: la edad debe estar entre 0 y 120.`);

  // Etapa: obligatoria para el titular; opcional para el resto (sin inferir por parentesco).
  const etapaRaw = texto(r.etapa);
  let etapa: string | null = null;
  if (etapaRaw) {
    if ((CONVIVENCIA_ETAPAS as readonly string[]).includes(etapaRaw)) etapa = etapaRaw;
    else errors.push(`${etiqueta}: la etapa seleccionada no es válida.`);
  } else if (esTitular) {
    errors.push(`${etiqueta}: la etapa es obligatoria.`);
  }

  // Parentesco: solo para integrantes adicionales.
  let parentesco: string | null = null;
  if (!esTitular) {
    parentesco = texto(r.parentesco);
    if (!parentesco) errors.push(`${etiqueta}: el parentesco con el titular es obligatorio.`);
    else if (parentesco.length > MAX_PARENTESCO) {
      errors.push(`${etiqueta}: el parentesco es demasiado largo.`);
    }
  }

  const saludRaw = texto(r.observacionesSalud);
  if (saludRaw.length > MAX_SALUD) {
    errors.push(`${etiqueta}: las observaciones de salud superan los ${MAX_SALUD} caracteres.`);
  }
  const observacionesSalud = saludRaw || null;

  if (typeof r.esCeliaco !== "boolean") {
    errors.push(`${etiqueta}: indicá si es celíaco/a.`);
  }

  // Menores: acompañamiento y contacto de emergencia.
  let menorAcompanado: boolean | null = null;
  let contactoEmergencia: IntegranteConvivenciaInput["contactoEmergencia"] = null;

  if (edad !== null && edad >= 0 && edad <= 120 && esMenor(edad)) {
    if (typeof r.menorAcompanado !== "boolean") {
      errors.push(
        `${etiqueta}: indicá si el menor asiste acompañado por un adulto de su familia.`
      );
    } else {
      menorAcompanado = r.menorAcompanado;
    }

    const ce =
      typeof r.contactoEmergencia === "object" && r.contactoEmergencia !== null
        ? (r.contactoEmergencia as Record<string, unknown>)
        : {};
    const ceNombre = texto(ce.nombre);
    const ceVinculo = texto(ce.vinculo);
    const ceTelefono = texto(ce.telefono);
    const algunoCompletado = Boolean(ceNombre || ceVinculo || ceTelefono);
    // Obligatorio si el menor NO está acompañado; si está acompañado es opcional,
    // pero si se completa parcialmente debe completarse por entero.
    const requerido = menorAcompanado === false;

    if (requerido || algunoCompletado) {
      if (!ceNombre) errors.push(`${etiqueta}: el nombre del contacto de emergencia es obligatorio.`);
      if (!ceVinculo) errors.push(`${etiqueta}: el vínculo del contacto de emergencia es obligatorio.`);
      if (!ceTelefono) errors.push(`${etiqueta}: el teléfono del contacto de emergencia es obligatorio.`);
      else if (!esTelefonoValido(ceTelefono)) {
        errors.push(`${etiqueta}: el teléfono del contacto de emergencia no es válido.`);
      }
      if (ceNombre.length > MAX_NOMBRE || ceVinculo.length > MAX_PARENTESCO) {
        errors.push(`${etiqueta}: los datos del contacto de emergencia son demasiado largos.`);
      }
      if (ceNombre && ceVinculo && ceTelefono) {
        contactoEmergencia = { nombre: ceNombre, vinculo: ceVinculo, telefono: ceTelefono };
      }
    }
  }

  if (errors.length > errInicio || edad === null) return null;

  return {
    nombre,
    apellido,
    dni,
    edad,
    etapa,
    parentesco,
    observacionesSalud,
    esCeliaco: r.esCeliaco as boolean,
    menorAcompanado,
    contactoEmergencia,
  };
}

export function validarInscripcionConvivencia(input: unknown): ResultadoValidacion {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Los datos de la inscripción son inválidos."] };
  }
  const r = input as Record<string, unknown>;

  const envioId = typeof r.envioId === "string" ? r.envioId.trim() : "";
  if (!UUID_RE.test(envioId)) {
    errors.push("No se pudo identificar el envío. Recargá la página e intentá nuevamente.");
  }

  const integrantesRaw = Array.isArray(r.integrantes) ? r.integrantes : null;
  if (!integrantesRaw || integrantesRaw.length === 0) {
    errors.push("Debe haber al menos un integrante vinculado a CAMREVOC.");
    return { ok: false, errors };
  }

  const integrantes: IntegranteConvivenciaInput[] = [];
  integrantesRaw.forEach((raw, idx) => {
    const v = validarIntegrante(raw, idx, errors);
    if (v) integrantes.push(v);
  });

  // DNI duplicados dentro de la misma familia.
  const vistos = new Set<string>();
  for (const i of integrantes) {
    if (vistos.has(i.dni)) {
      errors.push("Hay integrantes con el mismo DNI. Revisá los datos cargados.");
      break;
    }
    vistos.add(i.dni);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      envioId,
      integrantes,
    },
  };
}
