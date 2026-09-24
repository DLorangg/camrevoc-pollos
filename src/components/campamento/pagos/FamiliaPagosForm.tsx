"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  UserPlus,
  Trash2,
  Upload,
  Loader2,
  FileCheck,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import BankCardCampamento from "@/components/campamento/BankCardCampamento";
import { formatPrecio } from "@/config/campamento";
import {
  buscarInscriptoPorDni,
  subirPagoFamilia,
  type BuscarInscriptoPagoResult,
} from "@/app/campamento/actions/familia-pagos";

type InscriptoEncontrado = NonNullable<BuscarInscriptoPagoResult["inscripto"]>;

export default function FamiliaPagosForm() {
  // Estado de Paso 1 (Participante principal)
  const [dniPrincipal, setDniPrincipal] = useState("");
  const [buscandoPrincipal, startBuscarPrincipal] = useTransition();
  const [errorPrincipal, setErrorPrincipal] = useState<string | null>(null);
  const [inscriptoPrincipal, setInscriptoPrincipal] = useState<InscriptoEncontrado | null>(null);
  const [confirmadoPrincipal, setConfirmadoPrincipal] = useState(false);

  // Estado de Paso 2 (Hermano/a opcional)
  const [mostrarBuscarHermano, setMostrarBuscarHermano] = useState(false);
  const [dniHermano, setDniHermano] = useState("");
  const [buscandoHermano, startBuscarHermano] = useTransition();
  const [errorHermano, setErrorHermano] = useState<string | null>(null);
  const [inscriptoHermano, setInscriptoHermano] = useState<InscriptoEncontrado | null>(null);
  const [confirmadoHermano, setConfirmadoHermano] = useState(false);

  // Montos
  const [montoPrincipal, setMontoPrincipal] = useState<string>("");
  const [montoHermano, setMontoHermano] = useState<string>("");

  // Paso 4: Comprobante y datos de contacto
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [telefono, setTelefono] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Envío final y UI
  const [isSubmitting, startSubmit] = useTransition();
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // ─── Buscar Principal ────────────────────────────────────────────────────────
  const handleBuscarPrincipal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPrincipal(null);
    setInscriptoPrincipal(null);
    setConfirmadoPrincipal(false);

    startBuscarPrincipal(async () => {
      const res = await buscarInscriptoPorDni(dniPrincipal);
      if (res.ok && res.inscripto) {
        setInscriptoPrincipal(res.inscripto);
        setMontoPrincipal(res.inscripto.saldoPendiente > 0 ? String(res.inscripto.saldoPendiente) : "");
      } else {
        setErrorPrincipal(
          res.error ||
            "No encontramos ninguna inscripción con este DNI. Verificá el número o completá la inscripción primero."
        );
      }
    });
  };

  // ─── Buscar Hermano ──────────────────────────────────────────────────────────
  const handleBuscarHermano = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorHermano(null);
    setInscriptoHermano(null);
    setConfirmadoHermano(false);

    if (dniHermano.trim() === dniPrincipal.trim()) {
      setErrorHermano("El DNI del hermano no puede ser el mismo que el del primer participante.");
      return;
    }

    startBuscarHermano(async () => {
      const res = await buscarInscriptoPorDni(dniHermano);
      if (res.ok && res.inscripto) {
        setInscriptoHermano(res.inscripto);
        setMontoHermano(res.inscripto.saldoPendiente > 0 ? String(res.inscripto.saldoPendiente) : "");
      } else {
        setErrorHermano(
          res.error ||
            "No encontramos ninguna inscripción con este DNI. Verificá el número o completá la inscripción primero."
        );
      }
    });
  };

  // Total transferido calculado
  const montoPrinNum = Number(montoPrincipal) || 0;
  const montoHermNum = confirmadoHermano && inscriptoHermano ? Number(montoHermano) || 0 : 0;
  const montoTotalTransferido = montoPrinNum + montoHermNum;

  // ─── Envío Final ─────────────────────────────────────────────────────────────
  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio(null);

    if (!inscriptoPrincipal || !confirmadoPrincipal) {
      setErrorEnvio("Debés confirmar al participante principal.");
      return;
    }

    if (montoPrinNum <= 0) {
      setErrorEnvio("El monto correspondiente al primer participante debe ser mayor a 0.");
      return;
    }

    if (confirmadoHermano && inscriptoHermano && montoHermNum <= 0) {
      setErrorEnvio("El monto correspondiente al hermano/a debe ser mayor a 0.");
      return;
    }

    if (!comprobante) {
      setErrorEnvio("Debés adjuntar el archivo de comprobante de la transferencia.");
      return;
    }

    startSubmit(async () => {
      const items = [{ inscriptoId: inscriptoPrincipal.id, monto: montoPrinNum }];
      if (confirmadoHermano && inscriptoHermano) {
        items.push({ inscriptoId: inscriptoHermano.id, monto: montoHermNum });
      }

      const formData = new FormData();
      formData.set("items", JSON.stringify(items));
      formData.set("comprobante", comprobante);
      formData.set("telefono", telefono);
      formData.set("observaciones", observaciones);

      const res = await subirPagoFamilia(formData);
      if (res.ok) {
        setExito(true);
      } else {
        setErrorEnvio(res.error || "Ocurrió un error al enviar el comprobante. Intentá nuevamente.");
      }
    });
  };

  // ─── Pantalla de Éxito ───────────────────────────────────────────────────────
  if (exito) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              ¡Comprobante enviado correctamente! 📄
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Tu pago quedó registrado como pendiente de verificación. El equipo de coordinación de tu etapa revisará la transferencia y actualizará tu saldo a la brevedad.
            </p>
          </div>

          {/* Resumen de participantes incluidos */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left space-y-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
              Detalle del comprobante
            </span>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                {inscriptoPrincipal?.apellido}, {inscriptoPrincipal?.nombre} ({inscriptoPrincipal?.etapa})
              </span>
              <span className="font-bold text-emerald-700">{formatPrecio(montoPrinNum)}</span>
            </div>
            {confirmadoHermano && inscriptoHermano && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {inscriptoHermano.apellido}, {inscriptoHermano.nombre} ({inscriptoHermano.etapa})
                </span>
                <span className="font-bold text-emerald-700">{formatPrecio(montoHermNum)}</span>
              </div>
            )}
            <hr className="border-slate-200" />
            <div className="flex justify-between text-base font-black text-slate-900">
              <span>Total informado:</span>
              <span className="text-emerald-700">{formatPrecio(montoTotalTransferido)}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#009B4D] transition-colors"
            >
              <span>Volver a la página principal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulario por pasos ────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── PASO 1: Identificación del Participante ── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
            1
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Identificación del Participante
          </h2>
        </div>

        {!confirmadoPrincipal ? (
          <form onSubmit={handleBuscarPrincipal} className="space-y-4 pt-1">
            <p className="text-xs text-slate-500">
              Ingresá el DNI del chico/a inscripto/a para ubicar su cuenta y saldo restante.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="DNI (sin puntos ni espacios)"
                  value={dniPrincipal}
                  onChange={(e) => setDniPrincipal(e.target.value.replace(/\D/g, ""))}
                  disabled={buscandoPrincipal}
                  maxLength={9}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm font-mono text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={buscandoPrincipal || !dniPrincipal.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#009B4D] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#007a3d] transition-all disabled:opacity-50 cursor-pointer"
              >
                {buscandoPrincipal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando…
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Consultar DNI
                  </>
                )}
              </button>
            </div>

            {errorPrincipal && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="space-y-1">
                  <p>{errorPrincipal}</p>
                  <p className="text-[11px] text-rose-600">
                    ¿Aún no te inscribiste?{" "}
                    <Link href="/campamento/inscripcion" className="font-bold underline hover:text-rose-900">
                      Hacé clic acá para completar el formulario
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Tarjeta de confirmación encontrada */}
            {inscriptoPrincipal && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4.5 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-800">
                      Participante encontrado
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {inscriptoPrincipal.nombre} {inscriptoPrincipal.apellido}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {inscriptoPrincipal.etapa} · Destino:{" "}
                      <strong className="text-slate-800">{inscriptoPrincipal.destino}</strong>
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-900 font-mono">
                    DNI {inscriptoPrincipal.dni}
                  </span>
                </div>

                {/* Resumen de saldo */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-white p-3 text-center border border-emerald-200 shadow-2xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Tarifa</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700">
                      {formatPrecio(inscriptoPrincipal.tarifa)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-emerald-600 uppercase font-semibold">Abonado</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-700">
                      {formatPrecio(inscriptoPrincipal.totalAbonado)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-amber-700 uppercase font-semibold">Saldo Restante</span>
                    <span className="text-xs sm:text-sm font-extrabold text-amber-800">
                      {inscriptoPrincipal.saldoPendiente === 0
                        ? "¡Completado!"
                        : formatPrecio(inscriptoPrincipal.saldoPendiente)}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <p className="text-xs text-emerald-950 font-medium">
                    ¿Confirmás que sos <strong>{inscriptoPrincipal.nombre} {inscriptoPrincipal.apellido}</strong>?
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmadoPrincipal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#009B4D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#007a3d] transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Sí, continuar</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Participante 1 confirmado (modo resumen con botón de cambiar) */
          <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-sm">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {inscriptoPrincipal?.apellido}, {inscriptoPrincipal?.nombre}
                </h3>
                <p className="text-xs text-slate-600">
                  {inscriptoPrincipal?.etapa} (DNI {inscriptoPrincipal?.dni}) · Saldo pendiente:{" "}
                  <strong className="text-amber-800 font-bold">
                    {formatPrecio(inscriptoPrincipal?.saldoPendiente || 0)}
                  </strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setConfirmadoPrincipal(false);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        )}
      </section>

      {/* ── PASO 2: Opción Hermanos (Solo si el principal ya está confirmado) ── */}
      {confirmadoPrincipal && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                2
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                ¿La transferencia incluye a otro/a hermano/a?
              </h2>
            </div>
          </div>

          {!mostrarBuscarHermano && !confirmadoHermano && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 text-center sm:text-left">
                <Users className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Si hiciste una única transferencia bancaria para dos hermanos, podés vincularlo ahora.</span>
              </div>
              <button
                type="button"
                onClick={() => setMostrarBuscarHermano(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-400 hover:text-emerald-800 transition-colors cursor-pointer shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5 text-emerald-700" />
                <span>Agregar hermano/a</span>
              </button>
            </div>
          )}

          {/* Formulario búsqueda hermano */}
          {mostrarBuscarHermano && !confirmadoHermano && (
            <form onSubmit={handleBuscarHermano} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  DNI del Hermano/a
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarBuscarHermano(false);
                    setInscriptoHermano(null);
                    setErrorHermano(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="DNI del hermano/a"
                  value={dniHermano}
                  onChange={(e) => setDniHermano(e.target.value.replace(/\D/g, ""))}
                  disabled={buscandoHermano}
                  maxLength={9}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm font-mono text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={buscandoHermano || !dniHermano.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#009B4D] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {buscandoHermano ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Buscar</span>
                </button>
              </div>

              {errorHermano && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                  <span>{errorHermano}</span>
                </div>
              )}

              {inscriptoHermano && (
                <div className="rounded-xl border border-emerald-300 bg-white p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {inscriptoHermano.nombre} {inscriptoHermano.apellido}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {inscriptoHermano.etapa} · Saldo pendiente:{" "}
                        <strong className="text-amber-800 font-bold">
                          {formatPrecio(inscriptoHermano.saldoPendiente)}
                        </strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmadoHermano(true)}
                      className="rounded-xl bg-[#009B4D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#007a3d] cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Hermano confirmado */}
          {confirmadoHermano && inscriptoHermano && (
            <div className="flex items-center justify-between rounded-2xl border border-sky-300 bg-sky-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white font-black text-sm">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {inscriptoHermano.apellido}, {inscriptoHermano.nombre}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {inscriptoHermano.etapa} (DNI {inscriptoHermano.dni}) · Saldo pendiente:{" "}
                    <strong className="text-amber-800 font-bold">
                      {formatPrecio(inscriptoHermano.saldoPendiente)}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmadoHermano(false);
                  setInscriptoHermano(null);
                  setMontoHermano("");
                }}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                title="Quitar hermano"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Quitar</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── PASO 3 & 4: Monto, Datos Bancarios y Comprobante ── */}
      {confirmadoPrincipal && inscriptoPrincipal && (
        <form onSubmit={handleSubmitFinal} className="space-y-8 animate-in fade-in duration-300">
          {/* Tarjeta de Datos Bancarios Institucionales */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <HelpCircle className="h-4 w-4 text-emerald-700" />
              <span className="text-xs font-semibold text-slate-600">
                Verificá que la transferencia se haya realizado a la cuenta oficial de los campamentos:
              </span>
            </div>
            <BankCardCampamento />
          </section>

          {/* Paso 3: Asignación de Montos */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                3
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Monto transferido
              </h2>
            </div>

            <div className="space-y-3">
              {/* Monto para Principal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto a imputar a {inscriptoPrincipal.nombre} {inscriptoPrincipal.apellido} ($) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={montoPrincipal}
                    onChange={(e) => setMontoPrincipal(e.target.value)}
                    placeholder={`Saldo restante: ${inscriptoPrincipal.saldoPendiente}`}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm font-bold text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20"
                  />
                  {inscriptoPrincipal.saldoPendiente > 0 && montoPrincipal !== String(inscriptoPrincipal.saldoPendiente) && (
                    <button
                      type="button"
                      onClick={() => setMontoPrincipal(String(inscriptoPrincipal.saldoPendiente))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                    >
                      Saldar total
                    </button>
                  )}
                </div>
              </div>

              {/* Monto para Hermano (si aplica) */}
              {confirmadoHermano && inscriptoHermano && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto a imputar a su hermano/a {inscriptoHermano.nombre} {inscriptoHermano.apellido} ($) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={montoHermano}
                      onChange={(e) => setMontoHermano(e.target.value)}
                      placeholder={`Saldo restante: ${inscriptoHermano.saldoPendiente}`}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm font-bold text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20"
                    />
                    {inscriptoHermano.saldoPendiente > 0 && montoHermano !== String(inscriptoHermano.saldoPendiente) && (
                      <button
                        type="button"
                        onClick={() => setMontoHermano(String(inscriptoHermano.saldoPendiente))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 hover:bg-sky-200 cursor-pointer"
                      >
                        Saldar total
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Total acumulado de la transferencia */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-700">Monto total de la transferencia:</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {formatPrecio(montoTotalTransferido)}
                </span>
              </div>
            </div>
          </section>

          {/* Paso 4: Comprobante y Envío */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                4
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Comprobante y Envío
              </h2>
            </div>

            <div className="space-y-4">
              {/* Archivo obligatorio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjuntar Comprobante (imagen o PDF) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setComprobante(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                  />
                </div>
                {comprobante && (
                  <p className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <FileCheck className="h-3.5 w-3.5" />
                    Archivo seleccionado: <strong>{comprobante.name}</strong>
                  </p>
                )}
              </div>

              {/* Teléfono / WhatsApp de contacto */}
              <div>
                <label htmlFor="contacto-tel" className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / WhatsApp de contacto{" "}
                  <span className="text-slate-400 font-normal">(recomendado)</span>
                </label>
                <input
                  id="contacto-tel"
                  type="text"
                  placeholder="Ej: 299 1234567 (Mamá de Juan)"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20"
                />
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Para que el coordinador/a pueda contactarte directamente ante cualquier duda.
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label htmlFor="obs-text" className="block text-xs font-semibold text-slate-700 mb-1">
                  Aclaraciones / Observaciones{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  id="obs-text"
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Cuota 1 de 2, transferido desde la cuenta del abuelo..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 resize-none"
                />
              </div>

              {errorEnvio && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{errorEnvio}</span>
                </div>
              )}

              {/* Botón Enviar */}
              <button
                type="submit"
                disabled={isSubmitting || montoTotalTransferido <= 0 || !comprobante}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009B4D] py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-[#007a3d] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando comprobante…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Informar Pago ({formatPrecio(montoTotalTransferido)})
                  </>
                )}
              </button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
