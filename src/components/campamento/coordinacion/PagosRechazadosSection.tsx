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
  const [isPending, startTransition] = useTransition();

  const handleReconsiderar = (pagoId: string) => {
    setProcesandoId(pagoId);
    startTransition(async () => {
      await aprobarPagoCampamento(pagoId, etapaNum);
      setProcesandoId(null);
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

                {/* Motivo de Rechazo destacado */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-rose-700 block">
                    Motivo del rechazo:
                  </span>
                  <p className="font-medium italic text-rose-800 leading-relaxed">
                    &ldquo;{motivoText}&rdquo;
                  </p>
                </div>

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
                  onClick={() => handleReconsiderar(pago.id)}
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
    </div>
  );
}
