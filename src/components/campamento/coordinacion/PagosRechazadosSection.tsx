"use client";

import { useState, useTransition } from "react";
import {
  FileText,
  ExternalLink,
  MessageCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  AlertOctagon,
  User,
} from "lucide-react";
import type { PagoRechazadoRevision } from "@/types/campamento";
import { formatPrecio } from "@/config/campamento";
import { aprobarPagoCampamento } from "@/app/campamento/actions/coordinacion-pagos";

interface PagosRechazadosSectionProps {
  pagos: PagoRechazadoRevision[];
  etapaNum: string;
  nombreEtapa: string;
}

export default function PagosRechazadosSection({
  pagos,
  etapaNum,
  nombreEtapa,
}: PagosRechazadosSectionProps) {
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [pagoAprobando, setPagoAprobando] = useState<PagoRechazadoRevision | null>(null);
  const [observacionAprobacion, setObservacionAprobacion] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReconsiderarClick = (pago: PagoRechazadoRevision) => {
    setPagoAprobando(pago);
    setObservacionAprobacion(pago.observaciones || "");
  };

  const handleConfirmarAprobacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoAprobando) return;

    setProcesandoId(pagoAprobando.id);
    startTransition(async () => {
      await aprobarPagoCampamento(pagoAprobando.id, etapaNum, {
        observaciones: observacionAprobacion.trim() || undefined,
      });
      setProcesandoId(null);
      setPagoAprobando(null);
      setObservacionAprobacion("");
    });
  };

  if (pagos.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-2xs">
        <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
        <p className="text-sm font-bold text-slate-800">No hay pagos rechazados</p>
        <p className="mt-1 text-xs text-slate-400">
          Los comprobantes observados o rechazados aparecerán acá para su seguimiento y posible reconsideración.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 flex items-start gap-2.5">
        <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
        <div>
          <p>
            Hay <strong>{pagos.length} comprobante(s) rechazado(s)</strong> en esta etapa. Estos montos <strong>no computan</strong> en el saldo del participante hasta que sean reconsiderados o vueltos a transferir.
          </p>
          <p className="mt-1 text-[11px] text-rose-700">
            Podés contactar a la familia directamente por WhatsApp o presionar <strong>&ldquo;Reconsiderar / Aprobar&rdquo;</strong> si el comprobante fue rechazado por error.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pagos.map((pago) => {
          const isBusy = isPending && procesandoId === pago.id;
          const cleanPhone = pago.contacto_telefono?.replace(/\D/g, "") || "";
          const motivoText = pago.motivo_rechazo || "Inconsistencia en el comprobante o datos no coincidentes.";
          const wpUrl = cleanPhone
            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                `¡Hola! Te escribo de la coordinación de ${nombreEtapa} de CamReVoc respecto al comprobante de pago informado para ${pago.inscripto.nombre} ${pago.inscripto.apellido}. Tuvimos que rechazarlo por el siguiente motivo: "${motivoText}". ¿Podrías revisarlo o enviarnos nuevamente el comprobante?`
              )}`
            : null;

          return (
            <div
              key={pago.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="space-y-3">
                {/* Header card */}
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                    <XCircle className="h-3 w-3 text-rose-600" />
                    Rechazado
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {pago.subido_por === "FAMILIA" ? "Familia" : "Coordinador"}
                  </span>
                </div>

                {/* Datos del Participante y Monto */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {pago.inscripto.apellido}, {pago.inscripto.nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    DNI: <span className="font-mono font-medium text-slate-700">{pago.inscripto.dni}</span> · {pago.inscripto.etapa}
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-rose-700">
                    {formatPrecio(pago.monto)}
                  </p>
                </div>

                {/* Medio de pago */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {pago.es_efectivo ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      💵 Efectivo · Recibió: {pago.recibido_por || "No especificado"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      🏦 Transferencia
                    </span>
                  )}
                </div>

                {/* Motivo de Rechazo destacado */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-rose-700 block">
                    Motivo del rechazo:
                  </span>
                  <p className="font-medium italic text-rose-800 leading-relaxed">
                    &ldquo;{motivoText}&rdquo;
                  </p>
                </div>

                {/* Observación previa del pago (si existe) */}
                {pago.observaciones && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 space-y-0.5">
                    <span className="font-semibold text-[10px] uppercase text-slate-500 block">
                      Observación del pago:
                    </span>
                    <p className="italic text-slate-600">&ldquo;{pago.observaciones}&rdquo;</p>
                  </div>
                )}

                {/* Fechas y Quien rechazó */}
                <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Subido:
                    </span>
                    <span className="font-medium text-slate-700">
                      {new Date(pago.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {pago.verificado_at && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        Rechazado:
                      </span>
                      <span className="font-medium text-rose-800">
                        {new Date(pago.verificado_at).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {pago.verificado_por ? ` (${pago.verificado_por})` : ""}
                      </span>
                    </div>
                  )}

                  {pago.contacto_telefono && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contacto:</span>
                      <span className="font-semibold text-slate-700">{pago.contacto_telefono}</span>
                    </div>
                  )}
                </div>

                {/* Enlace al comprobante */}
                {pago.comprobante_url ? (
                  <div>
                    <a
                      href={pago.comprobante_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-white transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>Ver comprobante adjunto</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Sin archivo adjunto</p>
                )}
              </div>

              {/* Acciones */}
              <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {wpUrl && (
                  <a
                    href={wpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors text-center"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Avisar WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleReconsiderarClick(pago)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50/40 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Aprobar pago e impactar en el saldo"
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  <span>Reconsiderar / Aprobar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Reconsiderar y Aprobar con observación opcional */}
      {pagoAprobando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPagoAprobando(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reconsiderar y Aprobar Pago
                </h3>
                <p className="text-xs text-slate-500">
                  {pagoAprobando.inscripto.nombre} {pagoAprobando.inscripto.apellido} · <strong className="text-emerald-700">{formatPrecio(pagoAprobando.monto)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPagoAprobando(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarAprobacion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observación / Nota interna <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={observacionAprobacion}
                  onChange={(e) => setObservacionAprobacion(e.target.value)}
                  placeholder="Ej: Pago verificado con la familia; comprobante válido..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Podés dejarla vacía o indicar la aclaración por la que se reconsidera.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPagoAprobando(null)}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-[#009B4D] px-4 py-2 text-xs font-bold text-white hover:bg-[#007a3d] shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Confirmar y Aprobar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
