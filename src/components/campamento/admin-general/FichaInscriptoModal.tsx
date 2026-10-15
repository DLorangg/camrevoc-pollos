"use client";

import {
  X,
  CreditCard,
  Utensils,
  HeartHandshake,
  FileText,
  ExternalLink,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import type { InscriptoAdminGeneral } from "@/types/campamento";
import { formatPrecio } from "@/config/campamento";

interface FichaInscriptoModalProps {
  inscripto: InscriptoAdminGeneral | null;
  onClose: () => void;
  onSelectOtroInscripto?: (inscriptoId: string) => void;
}

const fmtFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default function FichaInscriptoModal({
  inscripto,
  onClose,
  onSelectOtroInscripto,
}: FichaInscriptoModalProps) {
  if (!inscripto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:px-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {inscripto.destino} · {inscripto.etapa}
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                Rol: {inscripto.rol}
              </span>
              {inscripto.estadoPago === "PAGADO" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  <CheckCircle className="h-3 w-3" /> Al día (Pagado)
                </span>
              ) : inscripto.estadoPago === "PARCIAL" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <Clock className="h-3 w-3" /> Pago Parcial
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                  Sin pagos aprobados
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {inscripto.apellido}, {inscripto.nombre}
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              DNI: <strong className="text-slate-800 font-bold">{inscripto.dni}</strong> · Inscripción:{" "}
              {fmtFecha.format(new Date(inscripto.created_at))}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Cerrar ficha"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Resumen Contable */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tarifa Base
              </span>
              <p className="mt-1 text-lg font-black text-slate-900">
                {formatPrecio(inscripto.tarifa)}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Abonado Aprobado
              </span>
              <p className="mt-1 text-lg font-black text-emerald-900">
                {formatPrecio(inscripto.totalPagado)}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Saldo Pendiente
              </span>
              <p className="mt-1 text-lg font-black text-amber-900">
                {formatPrecio(inscripto.saldoRestante)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                En Revisión
              </span>
              <p className="mt-1 text-lg font-black text-slate-700">
                {formatPrecio(inscripto.montoPendienteRevision)}
              </p>
            </div>
          </section>

          {/* Bloques de Información Personal, Médica y Teléfonos */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Salud y Régimen Alimentario */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Utensils className="h-4 w-4 text-emerald-600" />
                <span>Salud y Nutrición</span>
              </div>
              <div className="text-xs space-y-1.5 text-slate-700">
                <p>
                  <strong className="text-slate-900">Régimen:</strong> {inscripto.regimen_alimentario}
                </p>
                {inscripto.detalle_alimentario ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-amber-900">
                    <strong>Alergias / Restricciones:</strong> {inscripto.detalle_alimentario}
                  </div>
                ) : (
                  <p className="text-slate-400">Sin restricciones alimentarias declaradas.</p>
                )}
              </div>
            </div>

            {/* Dificultad económica y Aporte Solidario */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <HeartHandshake className="h-4 w-4 text-emerald-600" />
                <span>Situación Pastoral / Aportes</span>
              </div>
              <div className="text-xs space-y-2 text-slate-700">
                {inscripto.dificultad_pago ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-100/60 p-2.5 text-amber-900 font-medium">
                    ⚠️ La familia declaró dificultad económica para costear la tarifa.
                  </div>
                ) : (
                  <p className="text-slate-500">No declaró dificultad económica.</p>
                )}

                {inscripto.quiere_aportar && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-900">
                    <strong>Voluntad de donar dinero o insumos:</strong>{" "}
                    {inscripto.contacto_donacion || "Sin contacto especificado"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Teléfonos de Contacto Informados */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Phone className="h-4 w-4 text-emerald-600" />
                <span>Teléfonos de Contacto (Registrados en Pagos)</span>
              </div>
              {inscripto.ultimoTelefono && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Último informado
                </span>
              )}
            </div>

            {inscripto.historialTelefonos.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                La familia aún no informó ningún teléfono en los registros de pago.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-slate-500 font-medium">Último teléfono informado: </span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {inscripto.ultimoTelefono?.telefono}
                    </strong>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Fecha del registro: {fmtFecha.format(new Date(inscripto.ultimoTelefono!.fecha))}
                  </span>
                </div>

                {inscripto.historialTelefonos.length > 1 && (
                  <details className="text-xs text-slate-600">
                    <summary className="cursor-pointer font-bold text-slate-700 hover:text-slate-900 py-1">
                      Ver historial de teléfonos anteriores ({inscripto.historialTelefonos.length - 1})
                    </summary>
                    <ul className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200">
                      {inscripto.historialTelefonos.slice(1).map((t, idx) => (
                        <li key={`${t.pagoId}-${idx}`} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-800">{t.telefono}</span>
                          <span className="text-[11px] text-slate-400">{fmtFecha.format(new Date(t.fecha))}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <p className="text-[11px] text-slate-400 italic">
                  * Nota: Los teléfonos provienen exclusivamente de los pagos registrados por la familia; la tabla de inscriptos no almacena teléfono propio.
                </p>
              </div>
            )}
          </section>

          {/* Historial de Pagos y Comprobantes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-600" />
                Historial de Pagos Registrados ({inscripto.pagos.length})
              </h3>
              {inscripto.tieneComprobanteCompartido && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
                  <Users className="h-3 w-3" /> Comprobante compartido con otros inscriptos
                </span>
              )}
            </div>

            {inscripto.pagos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                No hay pagos registrados para este inscripto hasta el momento.
              </div>
            ) : (
              <div className="space-y-3">
                {inscripto.pagos.map((p) => {
                  const url = p.comprobante_url?.trim();
                  const otros = url ? inscripto.comprobantesCompartidosDetalle[url] || [] : [];
                  const esCompartido = otros.length > 0;

                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                        p.estado === "APROBADO"
                          ? "border-emerald-200 bg-white"
                          : p.estado === "RECHAZADO"
                          ? "border-rose-200 bg-rose-50/50"
                          : "border-amber-200 bg-amber-50/40"
                      }`}
                    >
                      {/* Cabecera del pago */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">
                            {formatPrecio(Number(p.monto) || 0)}
                          </span>
                          {p.estado === "APROBADO" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              <CheckCircle className="h-3 w-3" /> APROBADO
                            </span>
                          ) : p.estado === "RECHAZADO" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                              <XCircle className="h-3 w-3" /> RECHAZADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                              <Clock className="h-3 w-3" /> EN REVISIÓN (PENDIENTE)
                            </span>
                          )}

                          <span className="text-xs text-slate-500 font-medium">
                            · {p.es_efectivo ? `💵 Efectivo (Recibió: ${p.recibido_por || "Coordinador"})` : "🏦 Transferencia"}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">
                          {fmtFecha.format(new Date(p.created_at))}
                        </span>
                      </div>

                      {/* Observaciones y motivo rechazo */}
                      {p.observaciones && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <strong>Observaciones:</strong> {p.observaciones}
                        </p>
                      )}

                      {p.estado === "RECHAZADO" && p.motivo_rechazo && (
                        <div className="rounded-xl border border-rose-300 bg-rose-100/60 p-2.5 text-xs text-rose-900 font-medium">
                          <strong>Motivo de rechazo:</strong> {p.motivo_rechazo}
                        </div>
                      )}

                      {/* Auditoría */}
                      {(p.verificado_por || p.registrado_por) && (
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4">
                          {p.verificado_por && (
                            <span>
                              Auditado por: <strong className="text-slate-600">{p.verificado_por}</strong>
                              {p.verificado_at && ` (${fmtFecha.format(new Date(p.verificado_at))})`}
                            </span>
                          )}
                          {p.registrado_por && p.subido_por === "COORDINADOR" && (
                            <span>
                              Cargado manualmente por: <strong className="text-slate-600">{p.registrado_por}</strong>
                            </span>
                          )}
                          {p.contacto_telefono && (
                            <span>
                              Tel. informado en este pago: <strong className="text-slate-600 font-mono">{p.contacto_telefono}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Enlace al comprobante */}
                      {p.comprobante_url && (
                        <div className="pt-1">
                          <a
                            href={p.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Ver comprobante adjunto</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </a>
                        </div>
                      )}

                      {/* Detalle de Comprobante Compartido */}
                      {esCompartido && (
                        <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                            <Users className="h-3.5 w-3.5 text-violet-700" />
                            <span>Comprobante compartido con otros {otros.length} inscripto(s):</span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-violet-800">
                            {otros.map((o) => (
                              <li
                                key={o.inscriptoId}
                                className="flex flex-wrap items-center justify-between gap-2 bg-white/70 px-2.5 py-1.5 rounded-lg border border-violet-100"
                              >
                                <div>
                                  <strong className="text-slate-900">
                                    {o.apellido}, {o.nombre}
                                  </strong>{" "}
                                  <span className="font-mono text-[11px] text-slate-500">(DNI {o.dni})</span> ·{" "}
                                  <span className="text-[11px] text-slate-600">{o.destino} ({o.etapa})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    Parte asignada: {formatPrecio(o.monto)}
                                  </span>
                                  {onSelectOtroInscripto && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectOtroInscripto(o.inscriptoId)}
                                      className="text-[11px] font-bold text-violet-700 underline hover:text-violet-900 cursor-pointer"
                                    >
                                      Ver su ficha
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[10px] text-violet-700 italic">
                            * Los montos ya están desglosados individualmente; no se duplican en la recaudación global.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer Modal */}
        <div className="border-t border-slate-100 p-4 sm:px-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
