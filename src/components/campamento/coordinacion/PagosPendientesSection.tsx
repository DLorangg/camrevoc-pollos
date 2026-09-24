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
  AlertTriangle,
} from "lucide-react";
import type { PagoPendienteRevision } from "@/types/campamento";
import { formatPrecio } from "@/config/campamento";
import {
  aprobarPagoCampamento,
  observarPagoCampamento,
} from "@/app/campamento/actions/coordinacion-pagos";

interface PagosPendientesSectionProps {
  pagos: PagoPendienteRevision[];
  etapaNum: string;
  nombreEtapa: string;
}

export default function PagosPendientesSection({
  pagos,
  etapaNum,
  nombreEtapa,
}: PagosPendientesSectionProps) {
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [pagoRechazando, setPagoRechazando] = useState<PagoPendienteRevision | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAprobar = (pagoId: string) => {
    setProcesandoId(pagoId);
    startTransition(async () => {
      await aprobarPagoCampamento(pagoId, etapaNum);
      setProcesandoId(null);
    });
  };

  const handleRechazar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoRechazando) return;

    setProcesandoId(pagoRechazando.id);
    startTransition(async () => {
      await observarPagoCampamento(pagoRechazando.id, motivoRechazo, etapaNum);
      setProcesandoId(null);
      setPagoRechazando(null);
      setMotivoRechazo("");
    });
  };

  if (pagos.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-2xs">
        <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
        <p className="text-sm font-bold text-slate-800">¡Al día! No hay pagos pendientes de revisión</p>
        <p className="mt-1 text-xs text-slate-400">
          Cuando las familias informen sus transferencias desde el portal público, aparecerán acá para su validación.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <p>
          Hay <strong>{pagos.length} pago(s)</strong> informados por familias esperando verificación. Al aprobar un pago, el saldo del participante se actualiza automáticamente en el sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pagos.map((pago) => {
          const isBusy = isPending && procesandoId === pago.id;
          const cleanPhone = pago.contacto_telefono?.replace(/\D/g, "") || "";
          const wpUrl = cleanPhone
            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                `¡Hola! Te escribo de la coordinación de ${nombreEtapa} de CamReVoc respecto al comprobante de pago de ${pago.inscripto.nombre} ${pago.inscripto.apellido}...`
              )}`
            : null;

          return (
            <div
              key={pago.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="space-y-2">
                {/* Header card */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Pendiente de revisión
                    </span>
                    <h3 className="mt-1 text-base font-extrabold text-slate-900">
                      {pago.inscripto.apellido}, {pago.inscripto.nombre}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">DNI {pago.inscripto.dni}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-700 block">
                      {formatPrecio(pago.monto)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(pago.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Comprobante & WhatsApp */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {pago.comprobante_url ? (
                    <a
                      href={pago.comprobante_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Ver Comprobante</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin comprobante</span>
                  )}

                  {wpUrl && (
                    <a
                      href={wpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                      title="Escribir por WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-teal-600" />
                      <span>{pago.contacto_telefono}</span>
                    </a>
                  )}
                </div>

                {/* Observaciones */}
                {pago.observaciones && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl italic">
                    &ldquo;{pago.observaciones}&rdquo;
                  </p>
                )}
              </div>

              {/* Botones de acción del coordinador */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAprobar(pago.id)}
                  disabled={isBusy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#009B4D] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#007a3d] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Aprobar Pago</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPagoRechazando(pago);
                    setMotivoRechazo("");
                  }}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Observar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Observar / Rechazar */}
      {pagoRechazando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Observar / Rechazar Pago de {pagoRechazando.inscripto.nombre} {pagoRechazando.inscripto.apellido}
              </h3>
              <button
                type="button"
                onClick={() => setPagoRechazando(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRechazar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo de la observación o rechazo *
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej: El comprobante es ilegible, no se acreditó el dinero en la cuenta, monto erróneo..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPagoRechazando(null)}
                  disabled={isPending}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !motivoRechazo.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>Confirmar Observación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
