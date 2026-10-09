"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import {
  CONVIVENCIA_AUTORIZACION_MENORES,
  CONVIVENCIA_CONFIG,
  CONVIVENCIA_ETAPAS,
  CONVIVENCIA_MENSAJE_CERRADA,
} from "@/config/convivencia";
import { validarInscripcionConvivencia, esMenor } from "@/lib/convivencia/validation";
import { createInscripcionConvivencia } from "@/app/convivencia/actions/inscripcion";
import {
  ConvivenciaDatosActividad,
  ConvivenciaQueLlevar,
  formatearPrecioConvivencia,
} from "@/components/convivencia/ActividadInfo";

type SiNo = "" | "si" | "no";

interface IntegranteForm {
  key: string;
  nombre: string;
  apellido: string;
  dni: string;
  edad: string;
  etapa: string;
  parentesco: string;
  observacionesSalud: string;
  menorAcompanado: SiNo;
  ceNombre: string;
  ceVinculo: string;
  ceTelefono: string;
}

const PARENTESCOS_SUGERIDOS = [
  "Madre",
  "Padre",
  "Hijo/a",
  "Hermano/a",
  "Abuelo/a",
  "Tío/a",
  "Primo/a",
  "Pareja / cónyuge",
];

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700";

let keyCounter = 0;
function nuevoIntegrante(): IntegranteForm {
  keyCounter += 1;
  return {
    key: `integrante-${keyCounter}`,
    nombre: "",
    apellido: "",
    dni: "",
    edad: "",
    etapa: "",
    parentesco: "",
    observacionesSalud: "",
    menorAcompanado: "",
    ceNombre: "",
    ceVinculo: "",
    ceTelefono: "",
  };
}

function edadNumero(v: string): number | null {
  return /^\d{1,3}$/.test(v.trim()) ? parseInt(v.trim(), 10) : null;
}

function AutorizacionAviso() {
  const { disponible, url } = CONVIVENCIA_AUTORIZACION_MENORES;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Si el menor no asiste con un adulto de su familia, deberá presentar una{" "}
        <strong>autorización firmada</strong>.{" "}
        {disponible && url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="font-bold underline">
            Descargar autorización
          </a>
        ) : (
          "El documento se publicará más adelante en esta página."
        )}
      </p>
    </div>
  );
}

function IntegranteFields({
  value,
  titulo,
  esTitular,
  onChange,
  onRemove,
  disabled,
}: {
  value: IntegranteForm;
  titulo: string;
  esTitular: boolean;
  onChange: (patch: Partial<IntegranteForm>) => void;
  onRemove?: () => void;
  disabled: boolean;
}) {
  const edad = edadNumero(value.edad);
  const menor = edad !== null && edad <= 120 && esMenor(edad);
  const id = value.key;

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-extrabold text-slate-900">{titulo}</legend>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Quitar
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-nombre`} className={labelCls}>Nombre *</label>
          <input
            id={`${id}-nombre`}
            className={inputCls}
            value={value.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            autoComplete="off"
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor={`${id}-apellido`} className={labelCls}>Apellido *</label>
          <input
            id={`${id}-apellido`}
            className={inputCls}
            value={value.apellido}
            onChange={(e) => onChange({ apellido: e.target.value })}
            autoComplete="off"
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor={`${id}-dni`} className={labelCls}>DNI *</label>
          <input
            id={`${id}-dni`}
            className={inputCls}
            inputMode="numeric"
            value={value.dni}
            onChange={(e) => onChange({ dni: e.target.value })}
            placeholder="Solo números"
            autoComplete="off"
            maxLength={12}
          />
        </div>
        <div>
          <label htmlFor={`${id}-edad`} className={labelCls}>Edad *</label>
          <input
            id={`${id}-edad`}
            className={inputCls}
            inputMode="numeric"
            value={value.edad}
            onChange={(e) => onChange({ edad: e.target.value })}
            autoComplete="off"
            maxLength={3}
          />
        </div>

        {esTitular ? (
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-etapa`} className={labelCls}>Etapa a la que pertenece *</label>
            <select
              id={`${id}-etapa`}
              className={inputCls}
              value={value.etapa}
              onChange={(e) => onChange({ etapa: e.target.value })}
            >
              <option value="">Seleccioná una opción</option>
              {CONVIVENCIA_ETAPAS.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor={`${id}-parentesco`} className={labelCls}>
                Parentesco con el titular *
              </label>
              <input
                id={`${id}-parentesco`}
                className={inputCls}
                list="convivencia-parentescos"
                value={value.parentesco}
                onChange={(e) => onChange({ parentesco: e.target.value })}
                placeholder="Ej: Hijo/a, Madre…"
                autoComplete="off"
                maxLength={60}
              />
            </div>
            <div>
              <label htmlFor={`${id}-etapa`} className={labelCls}>
                ¿Pertenece a CAMREVOC?
              </label>
              <select
                id={`${id}-etapa`}
                className={inputCls}
                value={value.etapa}
                onChange={(e) => onChange({ etapa: e.target.value })}
              >
                <option value="">No pertenece a CAMREVOC</option>
                {CONVIVENCIA_ETAPAS.map((et) => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label htmlFor={`${id}-salud`} className={labelCls}>
            Observaciones de salud relevantes (opcional)
          </label>
          <textarea
            id={`${id}-salud`}
            className={inputCls}
            rows={2}
            value={value.observacionesSalud}
            onChange={(e) => onChange({ observacionesSalud: e.target.value })}
            maxLength={500}
          />
        </div>
      </div>

      {menor && (
        <div className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3.5">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-900">
            Menor de edad
          </p>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-800">
              ¿Asiste acompañado por un adulto de su familia? *
            </p>
            <div className="flex gap-4 text-sm text-slate-700">
              {(["si", "no"] as const).map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`${id}-acompanado`}
                    checked={value.menorAcompanado === opt}
                    onChange={() => onChange({ menorAcompanado: opt })}
                  />
                  {opt === "si" ? "Sí" : "No"}
                </label>
              ))}
            </div>
          </div>

          {value.menorAcompanado === "no" && <AutorizacionAviso />}

          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-800">
              Contacto de emergencia {value.menorAcompanado === "no" ? "*" : "(opcional)"}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor={`${id}-ce-nombre`} className={labelCls}>Nombre</label>
                <input
                  id={`${id}-ce-nombre`}
                  className={inputCls}
                  value={value.ceNombre}
                  onChange={(e) => onChange({ ceNombre: e.target.value })}
                  autoComplete="off"
                  maxLength={80}
                />
              </div>
              <div>
                <label htmlFor={`${id}-ce-vinculo`} className={labelCls}>Vínculo</label>
                <input
                  id={`${id}-ce-vinculo`}
                  className={inputCls}
                  value={value.ceVinculo}
                  onChange={(e) => onChange({ ceVinculo: e.target.value })}
                  autoComplete="off"
                  maxLength={60}
                />
              </div>
              <div>
                <label htmlFor={`${id}-ce-tel`} className={labelCls}>Teléfono</label>
                <input
                  id={`${id}-ce-tel`}
                  className={inputCls}
                  inputMode="tel"
                  value={value.ceTelefono}
                  onChange={(e) => onChange({ ceTelefono: e.target.value })}
                  autoComplete="off"
                  maxLength={25}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}

export default function ConvivenciaInscripcionForm({ abierta }: { abierta: boolean }) {
  const [cerrada, setCerrada] = useState(!abierta);
  const [titular, setTitular] = useState<IntegranteForm>(() => nuevoIntegrante());
  const [extras, setExtras] = useState<IntegranteForm[]>([]);
  const [hayCeliaco, setHayCeliaco] = useState<SiNo>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [exito, setExito] = useState<{ id: string; cantidad: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  // Clave de idempotencia: se genera una sola vez por formulario y se reutiliza en los
  // reintentos, de modo que un reenvío nunca duplica la inscripción.
  const envioIdRef = useRef<string | null>(null);
  const enviandoRef = useRef(false);

  if (cerrada) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-lg shadow-slate-200/50">
        <XCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-extrabold text-slate-900">{CONVIVENCIA_MENSAJE_CERRADA}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Gracias a todas las familias que participan de la Convivencia Familiar CAMREVOC.
        </p>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="space-y-5 rounded-3xl border border-emerald-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h2 className="text-2xl font-extrabold text-slate-900">¡Inscripción registrada!</h2>
          <p className="mt-1 text-sm text-slate-600">
            Anotamos a <strong>{exito.cantidad}</strong>{" "}
            {exito.cantidad === 1 ? "integrante" : "integrantes"} de tu familia.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Código de inscripción: {exito.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <p className="mb-3 text-sm font-bold text-slate-900">
            Total a abonar: {formatearPrecioConvivencia()} por familia
          </p>
          <ConvivenciaDatosActividad />
          <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900">
            Recordá: el pago es obligatorio en efectivo el día de la actividad.
          </p>
        </div>

        <ConvivenciaQueLlevar />

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const updateExtra = (key: string, patch: Partial<IntegranteForm>) =>
    setExtras((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  const buildPayload = (envioId: string) => {
    const mapear = (f: IntegranteForm) => ({
      nombre: f.nombre,
      apellido: f.apellido,
      dni: f.dni,
      edad: f.edad,
      etapa: f.etapa,
      parentesco: f.parentesco,
      observacionesSalud: f.observacionesSalud,
      menorAcompanado:
        f.menorAcompanado === "si" ? true : f.menorAcompanado === "no" ? false : undefined,
      contactoEmergencia: { nombre: f.ceNombre, vinculo: f.ceVinculo, telefono: f.ceTelefono },
    });
    return {
      envioId,
      hayCeliaco: hayCeliaco === "si" ? true : hayCeliaco === "no" ? false : undefined,
      integrantes: [mapear(titular), ...extras.map(mapear)],
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enviandoRef.current || isPending) return;
    setErrors([]);

    if (!envioIdRef.current) envioIdRef.current = crypto.randomUUID();
    const payload = buildPayload(envioIdRef.current);

    // Validación temprana de UX; el servidor revalida de forma autoritativa.
    const local = validarInscripcionConvivencia(payload);
    if (!local.ok) {
      setErrors(local.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    enviandoRef.current = true;
    startTransition(async () => {
      try {
        const res = await createInscripcionConvivencia(local.data);
        if (res.ok && res.inscripcionId && typeof res.cantidadIntegrantes === "number") {
          setExito({ id: res.inscripcionId, cantidad: res.cantidadIntegrantes });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (res.cerrada) {
          setCerrada(true);
        } else {
          setErrors(res.errors?.length ? res.errors : ["No se pudo registrar la inscripción."]);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        setErrors([
          "No pudimos confirmar el registro (problema de conexión). Verificá tu conexión y volvé a intentar: no se duplicará la inscripción.",
        ]);
      } finally {
        enviandoRef.current = false;
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <datalist id="convivencia-parentescos">
        {PARENTESCOS_SUGERIDOS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      {errors.length > 0 && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="mb-1 font-bold">Revisá la inscripción:</p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs">
            {errors.map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Empezá por la persona vinculada directamente con CAMREVOC (puede ser cualquier integrante
        de la familia, no necesariamente un adulto). Luego sumá al resto de la familia.
      </p>

      <IntegranteFields
        value={titular}
        titulo="Persona vinculada a CAMREVOC (titular)"
        esTitular
        onChange={(patch) => setTitular((t) => ({ ...t, ...patch }))}
        disabled={isPending}
      />

      {extras.map((ex, idx) => (
        <IntegranteFields
          key={ex.key}
          value={ex}
          titulo={`Integrante ${idx + 2}`}
          esTitular={false}
          onChange={(patch) => updateExtra(ex.key, patch)}
          onRemove={() => setExtras((prev) => prev.filter((p) => p.key !== ex.key))}
          disabled={isPending}
        />
      ))}

      <button
        type="button"
        onClick={() => setExtras((prev) => [...prev, nuevoIntegrante()])}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 py-3 text-sm font-bold text-sky-800 hover:bg-sky-50 transition-colors cursor-pointer disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Agregar integrante
      </button>

      <fieldset disabled={isPending} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <legend className="text-sm font-extrabold text-slate-900">Alimentación</legend>
        <p className="mb-2 mt-1 text-sm font-semibold text-slate-800">
          ¿Hay algún integrante celíaco? *
        </p>
        <div className="flex gap-4 text-sm text-slate-700">
          {(["si", "no"] as const).map((opt) => (
            <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hay-celiaco"
                checked={hayCeliaco === opt}
                onChange={() => setHayCeliaco(opt)}
              />
              {opt === "si" ? "Sí" : "No"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="flex items-center gap-2 font-bold text-slate-800">
          <Users className="h-4 w-4 text-sky-600" />
          {formatearPrecioConvivencia()} por familia · pago en efectivo el día de la actividad
        </p>
        <p className="mt-1">
          Inscripciones abiertas hasta el {CONVIVENCIA_CONFIG.fechaCierreTexto}.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-xs hover:bg-sky-700 transition-colors disabled:opacity-60 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrando inscripción…
          </>
        ) : (
          "Inscribir a mi familia"
        )}
      </button>
    </form>
  );
}
