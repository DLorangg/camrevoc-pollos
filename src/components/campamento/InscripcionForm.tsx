"use client";

import { useState, useTransition } from "react";
import {
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  UserCheck,
  Heart,
  AlertCircle,
} from "lucide-react";
import { inscribirParticipante } from "@/app/campamento/actions/inscripcion";
import type { InscripcionInput } from "@/app/campamento/actions/inscripcion";
import BankCardCampamento from "@/components/campamento/BankCardCampamento";
import {
  ETAPAS_CAMPAMENTO,
  ROLES_CAMPAMENTO,
  REGIMENES_ALIMENTARIOS,
  getDestinoPorEtapa,
  formatPrecio,
} from "@/config/campamento";
import type {
  EtapaCampamento,
  RolCampamento,
  RegimenAlimentario,
} from "@/config/campamento";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SuccessData {
  apellido: string;
  nombre: string;
  dni: string;
  etapa: string;
  rol: string;
  destino: string;
  tarifa: number;
  fechas: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InscripcionForm() {
  // Form state
  const [apellido, setApellido] = useState("");
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [etapa, setEtapa] = useState<EtapaCampamento | "">("");
  const [rol, setRol] = useState<RolCampamento | "">("");
  const [dificultadPago, setDificultadPago] = useState(false);
  const [regimenAlimentario, setRegimenAlimentario] =
    useState<RegimenAlimentario>("Omnívoro");
  const [detalleAlimentario, setDetalleAlimentario] = useState("");
  const [quiereAportar, setQuiereAportar] = useState(false);
  const [contactoDonacion, setContactoDonacion] = useState("");

  // UI state
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  // Derived
  const destinoInfo = etapa ? getDestinoPorEtapa(etapa) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!etapa || !rol) {
      setError("Seleccioná la etapa y el rol.");
      return;
    }

    startTransition(async () => {
      const input: InscripcionInput = {
        apellido,
        nombre,
        dni,
        etapa: etapa as EtapaCampamento,
        rol: rol as RolCampamento,
        dificultad_pago: dificultadPago,
        regimen_alimentario: regimenAlimentario,
        detalle_alimentario: detalleAlimentario,
        quiere_aportar: quiereAportar,
        contacto_donacion: contactoDonacion,
      };

      const result = await inscribirParticipante(input);

      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(result.data);
      }
    });
  };

  // ─── Pantalla de éxito ───────────────────────────────────────────────────

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              ¡Inscripción confirmada! 🏕️
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Registramos tu confirmación de asistencia para los Campamentos 2027.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Apellido y Nombre</span>
              <span className="font-semibold text-slate-900">
                {success.apellido}, {success.nombre}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">DNI</span>
              <span className="font-mono font-semibold text-slate-900">
                {success.dni}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Etapa</span>
              <span className="font-semibold text-slate-900">
                {success.etapa}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Rol</span>
              <span className="font-semibold text-slate-900">{success.rol}</span>
            </div>
            <hr className="border-slate-200" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Destino asignado</span>
              <span className="font-bold text-emerald-700">
                {success.destino}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tarifa base</span>
              <span className="font-bold text-emerald-700">
                {formatPrecio(success.tarifa)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Fechas</span>
              <span className="font-semibold text-slate-900">
                {success.fechas}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm text-amber-900 leading-relaxed">
              📋 <strong>Recordá realizar la transferencia a la cuenta institucional y enviarle el comprobante al coordinador/a de tu etapa. ¡Nos vemos en el campamento!</strong>
            </p>
          </div>

          {/* Tarjeta bancaria para realizar la transferencia */}
          <div className="text-left pt-2">
            <BankCardCampamento />
          </div>

          <p className="text-xs text-slate-400">
            Casa Salesiana Don Bosco Neuquén · CamReVoc
          </p>
        </div>
      </div>
    );
  }

  // ─── Formulario ──────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Apellido */}
      <div>
        <label
          htmlFor="apellido"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Apellido/s (como figura en el DNI) <span className="text-rose-500">*</span>
        </label>
        <input
          id="apellido"
          type="text"
          required
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          disabled={isPending}
          placeholder="Ej: González"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
        />
      </div>

      {/* Nombre completo */}
      <div>
        <label
          htmlFor="nombre"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Nombre completo (como figura en el DNI) <span className="text-rose-500">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={isPending}
          placeholder="Ej: Juan Manuel"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
        />
      </div>

      {/* DNI */}
      <div>
        <label
          htmlFor="dni"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          DNI (sin puntos ni espacios) <span className="text-rose-500">*</span>
        </label>
        <input
          id="dni"
          type="text"
          inputMode="numeric"
          required
          value={dni}
          onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
          disabled={isPending}
          placeholder="Ej: 45678901"
          maxLength={9}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
        />
        <p className="mt-1 text-xs text-slate-400">
          Sin puntos ni espacios.
        </p>
      </div>

      {/* Etapa */}
      <div>
        <label
          htmlFor="etapa"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Etapa <span className="text-rose-500">*</span>
        </label>
        <select
          id="etapa"
          required
          value={etapa}
          onChange={(e) => setEtapa(e.target.value as EtapaCampamento | "")}
          disabled={isPending}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
        >
          <option value="">Seleccioná tu etapa</option>
          {ETAPAS_CAMPAMENTO.map((e) => (
            <option key={e} value={e}>
              {e} Etapa
            </option>
          ))}
        </select>
      </div>

      {/* Badge de destino y tarifa */}
      {destinoInfo && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-700" />
            <span className="text-sm font-bold text-emerald-800">
              {destinoInfo.nombre}
            </span>
            <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
              {formatPrecio(destinoInfo.tarifa)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <Calendar className="h-3.5 w-3.5" />
            <span>{destinoInfo.fechas}</span>
          </div>
        </div>
      )}

      {/* Rol */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Rol <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES_CAMPAMENTO.map((r) => (
            <button
              key={r}
              type="button"
              disabled={isPending}
              onClick={() => setRol(r)}
              className={`rounded-xl border-2 px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                rol === r
                  ? "border-[#009B4D] bg-[#009B4D]/10 text-[#009B4D] shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              } disabled:opacity-50`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Dificultad de pago */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={dificultadPago}
            onChange={(e) => setDificultadPago(e.target.checked)}
            disabled={isPending}
            className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#009B4D] focus:ring-[#009B4D]/20 accent-[#009B4D]"
          />
          <div>
            <span className="text-sm font-medium text-slate-700">
              ¿Tenés dificultades para abonar el campamento?
            </span>
            <p className="mt-0.5 text-xs text-slate-500">
              Si marcás esta opción, nos pondremos en contacto para buscar
              alternativas. ¡Queremos que todos puedan participar!
            </p>
          </div>
        </label>
      </div>

      {/* Régimen alimentario */}
      <div>
        <label
          htmlFor="regimen"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Régimen alimentario
        </label>
        <select
          id="regimen"
          value={regimenAlimentario}
          onChange={(e) => {
            const nuevoRegimen = e.target.value as RegimenAlimentario;
            setRegimenAlimentario(nuevoRegimen);
            if (nuevoRegimen !== "Otros") {
              setDetalleAlimentario("");
            }
          }}
          disabled={isPending}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
        >
          {REGIMENES_ALIMENTARIOS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Detalles alimentarios / alergias (Solo visible si es 'Otros') */}
      {regimenAlimentario === "Otros" && (
        <div className="animate-in fade-in duration-200">
          <label
            htmlFor="detalleAlimentario"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Explicar qué alimentos no puede consumir o detalles de alergias{" "}
            <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="detalleAlimentario"
            required
            value={detalleAlimentario}
            onChange={(e) => setDetalleAlimentario(e.target.value)}
            disabled={isPending}
            placeholder="Especificá los alimentos o alergias..."
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50 resize-none"
          />
        </div>
      )}

      {/* Sección solidaria */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
          En el caso de poder dar una mano extra aportando donaciones de dinero, mercadería o materiales, ¡nos sería de gran ayuda!
        </p>

        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={quiereAportar}
            onChange={(e) => {
              setQuiereAportar(e.target.checked);
              if (!e.target.checked) setContactoDonacion("");
            }}
            disabled={isPending}
            className="mt-0.5 h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-400/20 accent-amber-600"
          />
          <div>
            <span className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-amber-700" />
              Quiero aportar
            </span>
          </div>
        </label>

        {quiereAportar && (
          <div className="animate-in fade-in duration-200 pt-1">
            <label
              htmlFor="contactoDonacion"
              className="mb-1.5 block text-xs font-semibold text-amber-900"
            >
              Nombre y teléfono / WhatsApp de contacto
            </label>
            <input
              id="contactoDonacion"
              type="text"
              required={quiereAportar}
              value={contactoDonacion}
              onChange={(e) => setContactoDonacion(e.target.value)}
              disabled={isPending}
              placeholder="Ej: Mamá de Juan - 299 1234567"
              className="w-full rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:bg-slate-50"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !apellido || !nombre || !dni || !etapa || !rol}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009B4D] py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-[#007a3d] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Inscribiendo…
          </>
        ) : (
          <>
            <UserCheck className="h-4 w-4" />
            Confirmar inscripción
          </>
        )}
      </button>
    </form>
  );
}
