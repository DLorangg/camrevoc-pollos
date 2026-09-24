"use client";

import { useState, useTransition, useRef } from "react";
import {
  X,
  CreditCard,
  Upload,
  Calendar,
  User,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  XCircle,
} from "lucide-react";
import type { InscriptoConPagos } from "@/types/campamento";
import { registrarPagoCampamento } from "@/app/campamento/actions/coordinacion-pagos";
import { formatPrecio } from "@/config/campamento";

interface GestionPagosModalProps {
  inscripto: InscriptoConPagos | null;
  coordinadorActual: string;
  etapaNum: string;
  onClose: () => void;
}

export default function GestionPagosModal({
  inscripto,
  coordinadorActual,
  etapaNum,
  onClose,
}: GestionPagosModalProps) {
  const [monto, setMonto] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!inscripto) return null;

  const saldo = inscripto.saldoRestante;
  const montoNum = Number(monto) || 0;
  const nuevoSaldo = Math.max(0, saldo - montoNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (montoNum <= 0) {
      setError("El monto a registrar debe ser mayor a 0.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("inscriptoId", inscripto.id);
      formData.set("monto", String(montoNum));
      formData.set("observaciones", observaciones);
      formData.set("etapa", etapaNum);
      if (archivo) {
        formData.set("comprobante", archivo);
      }

      const res = await registrarPagoCampamento(formData);
      if (res.ok) {
        setExito(true);
        setMonto("");
        setObservaciones("");
        setArchivo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => {
          setExito(false);
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Error al registrar el pago.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Gestión de Pagos
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {inscripto.apellido}, {inscripto.nombre}
            </h2>
            <p className="text-xs text-slate-500">
              DNI: <span className="font-mono">{inscripto.dni}</span> · Rol:{" "}
              <span className="font-medium text-slate-700">{inscripto.rol}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="overflow-y-auto p-5 sm:px-6 space-y-6">
          {/* Tarjeta de Resumen Financiero */}
          <div className="grid grid-cols-3 gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-center">
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 uppercase">
                Tarifa Total
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-800">
                {formatPrecio(inscripto.tarifa)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-emerald-700 uppercase">
                Total Pagado
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                {formatPrecio(inscripto.totalPagado)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-semibold text-amber-700 uppercase">
                Saldo Restante
              </span>
              <span
                className={`text-sm sm:text-base font-extrabold ${
                  inscripto.saldoRestante === 0 ? "text-emerald-600" : "text-amber-800"
                }`}
              >
                {inscripto.saldoRestante === 0 ? "¡Pagado!" : formatPrecio(inscripto.saldoRestante)}
              </span>
            </div>
          </div>

          {/* Historial de Pagos Anteriores */}
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Historial de Pagos ({inscripto.pagos.length})
            </h3>
            {inscripto.pagos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-500">
                Todavía no se registraron pagos para este inscripto.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {inscripto.pagos.map((pago, idx) => {
                  const estado = pago.estado || "APROBADO";
                  const esAprobado = estado === "APROBADO";
                  const esPendiente = estado === "PENDIENTE";
                  const esRechazado = estado === "RECHAZADO";

                  return (
                    <div key={pago.id || idx} className="p-3.5 text-xs text-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-black ${
                              esAprobado
                                ? "text-emerald-700"
                                : esPendiente
                                ? "text-amber-800"
                                : "text-slate-400 line-through"
                            }`}
                          >
                            {esAprobado ? `+${formatPrecio(pago.monto)}` : formatPrecio(pago.monto)}
                          </span>

                          {/* Badge de Estado */}
                          {esAprobado && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Aprobado
                            </span>
                          )}
                          {esPendiente && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Pendiente de revisión
                            </span>
                          )}
                          {esRechazado && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              Rechazado
                            </span>
                          )}
                        </div>

                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(pago.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Subtítulo indicando impacto en saldo */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium">
                          {esAprobado && (
                            <span className="text-emerald-700 font-semibold">✓ Resta del saldo</span>
                          )}
                          {esPendiente && (
                            <span className="text-amber-700 font-medium">⚠️ Aún no computado (en revisión)</span>
                          )}
                          {esRechazado && (
                            <span className="text-rose-600 font-medium">✕ No computa en el saldo</span>
                          )}
                        </span>

                        <span className="flex items-center gap-1 text-slate-500">
                          <User className="h-3 w-3" />
                          <span>
                            {pago.registrado_por || (pago.subido_por === "FAMILIA" ? "Familia" : "Coordinador")}
                          </span>
                        </span>
                      </div>

                      {/* Motivo de rechazo si aplica */}
                      {esRechazado && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2 text-[11px] text-rose-900 space-y-0.5">
                          <p className="font-semibold text-rose-800">
                            Motivo del rechazo:{" "}
                            <span className="font-normal italic">
                              &ldquo;{pago.motivo_rechazo || "Inconsistencia en los datos."}&rdquo;
                            </span>
                          </p>
                          {pago.verificado_at && (
                            <p className="text-[10px] text-rose-600">
                              Rechazado el:{" "}
                              {new Date(pago.verificado_at).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {pago.verificado_por ? ` por ${pago.verificado_por}` : ""}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Comprobante y Observaciones */}
                      <div className="flex items-center justify-between pt-0.5">
                        {pago.observaciones ? (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-md italic flex-1 mr-2">
                            &ldquo;{pago.observaciones}&rdquo;
                          </p>
                        ) : (
                          <span />
                        )}

                        {pago.comprobante_url && (
                          <a
                            href={pago.comprobante_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline shrink-0 text-[11px]"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Comprobante
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulario Cargar Nuevo Pago */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4.5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <span>➕</span> Registrar Nuevo Pago
            </h3>

            {/* Monto */}
            <div>
              <label htmlFor="monto-input" className="mb-1 block text-xs font-semibold text-slate-700">
                Monto del pago ($) *
              </label>
              <div className="relative">
                <input
                  id="monto-input"
                  type="number"
                  min="1"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder={`Ej: ${saldo > 0 ? saldo : "50000"}`}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm font-bold text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
                />
                {saldo > 0 && monto !== String(saldo) && (
                  <button
                    type="button"
                    onClick={() => setMonto(String(saldo))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                  >
                    Saldar total (${saldo.toLocaleString("es-AR")})
                  </button>
                )}
              </div>
              {montoNum > 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Saldo luego de este pago:{" "}
                  <strong className={nuevoSaldo === 0 ? "text-emerald-700" : "text-slate-800"}>
                    {nuevoSaldo === 0 ? "$0 (Completado)" : formatPrecio(nuevoSaldo)}
                  </strong>
                </p>
              )}
            </div>

            {/* Comprobante */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Archivo de Comprobante (imagen o PDF)
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArchivo(e.target.files[0]);
                    }
                  }}
                  disabled={isPending}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label htmlFor="obs-input" className="mb-1 block text-xs font-semibold text-slate-700">
                Observaciones / Notas (opcional)
              </label>
              <textarea
                id="obs-input"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Transferencia de la mamá, comprobante conjunto con su hermano..."
                disabled={isPending}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50 resize-none"
              />
            </div>

            {/* Registrado por info */}
            <p className="text-[11px] text-slate-500">
              Registrado por: <strong className="text-slate-700">{coordinadorActual}</strong>
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {exito && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-100 p-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>¡Pago registrado correctamente!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || montoNum <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009B4D] py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-[#007a3d] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando pago…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Guardar Pago
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
