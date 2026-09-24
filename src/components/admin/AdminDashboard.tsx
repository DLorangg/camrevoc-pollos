"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  X,
  Loader2,
  LogOut,
  MessageCircle,
  Trophy,
  Layers,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  approvePedido,
  rejectPedido,
  type DashboardData,
  type EtapaStat,
  type VendedorLeaderboard,
} from "@/app/actions/admin-pedidos";
import { PRECIO_POLLO } from "@/config/constants";
import { confirmarEntrega } from "@/app/actions/vale-actions";
import { logoutAdmin, clearOperator } from "@/app/actions/admin-auth";
import type { Pedido, Vale } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type PedidoConVales = Pedido & { vales: Vale[] };
type Filter = "Todos" | "Pendiente" | "PorEntregar" | "Entregado" | "Rechazado";
type AdminTab = "pedidos" | "estadisticas";
type SortOrder = "fecha_desc" | "fecha_asc" | "nombre_asc" | "nombre_desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApellidoNombreKey(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0]?.toLowerCase() || "";
  // Tomar la última palabra como apellido y el resto como nombre
  const apellido = parts[parts.length - 1].toLowerCase();
  const nombres = parts.slice(0, -1).join(" ").toLowerCase();
  return `${apellido} ${nombres}`;
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function waLink(whatsapp: string, pedido: PedidoConVales, appUrl: string) {
  const num = whatsapp.replace(/\D/g, "");
  const codigos = pedido.vales.map((v) => v.codigo).join(", ");
  const nombre = pedido.animador_vendedor || pedido.nombre_comprador;
  const emojiWave = "\u{1F44B}";
  const text = encodeURIComponent(
    `Hola ${nombre} ${emojiWave}, te confirmamos tu pedido de ${pedido.cantidad_total} pollo${pedido.cantidad_total !== 1 ? "s" : ""} de CamReVoc.\n\nTus c\u00f3digos de vale: ${codigos}\n\nPod\u00e9s verlos en:\n${pedido.vales.map((v) => `${appUrl}/vale/${v.codigo}`).join("\n")}`,
  );
  return `https://api.whatsapp.com/send?phone=${num}&text=${text}`;
}

/** Link de WhatsApp prearmado para un vale pendiente específico */
function waPendingValeLink(
  whatsapp: string,
  pedido: PedidoConVales,
  vale: Vale,
) {
  const num = whatsapp.replace(/\D/g, "");
  const nombre = pedido.animador_vendedor || pedido.nombre_comprador;
  const destinatario = vale.destinatario || "el destinatario";
  const text = encodeURIComponent(
    `Hola ${nombre}! Te avisamos desde CamReVoc que el vale ${vale.codigo} a nombre de ${destinatario} por ${vale.cantidad_pollos} pollo${vale.cantidad_pollos !== 1 ? "s" : ""} todav\u00eda no fue retirado en el puesto de entrega.`,
  );
  return `https://api.whatsapp.com/send?phone=${num}&text=${text}`;
}

// ─── Image modal ──────────────────────────────────────────────────────────────

function ImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-1.5 shadow"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
        {url.endsWith(".pdf") ? (
          <iframe src={url} className="h-[80vh] w-full rounded-xl" title="Comprobante PDF" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Comprobante" className="max-h-[85vh] w-full rounded-xl object-contain bg-white" />
        )}
      </div>
    </div>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

const MOTIVOS = [
  "Comprobante no coincide",
  "Monto insuficiente",
  "Comprobante ilegible",
  "Transferencia no acreditada",
  "Otro",
];

function RejectModal({
  pedidoId,
  onClose,
  onConfirm,
}: {
  pedidoId: string;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState(MOTIVOS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-3 text-base font-semibold text-gray-900">Rechazar pedido</h3>
        <p className="mb-3 text-sm text-gray-500">Seleccioná el motivo del rechazo:</p>
        <select
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="mb-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo)}
            className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-2xl border-l-4 bg-white px-5 py-4 shadow-xs ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-800 border-amber-200",
    Aprobado: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rechazado: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[estado] ?? "bg-slate-100 text-slate-600"}`}>
      {estado}
    </span>
  );
}

// ─── Vale detail row (inside accordion) ──────────────────────────────────────

function ValeDetailRow({
  vale,
  pedido,
  appUrl,
  onEntregado,
  onValeEntregado,
}: {
  vale: Vale;
  pedido: PedidoConVales;
  appUrl: string;
  onEntregado: () => void;
  onValeEntregado: (pedidoId: string, valeId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleMarcarEntregado = () => {
    // 1. Actualización optimista inmediata en estado local
    onValeEntregado(pedido.id, vale.id);

    // 2. Persistir en servidor
    startTransition(async () => {
      await confirmarEntrega(vale.id, vale.codigo);
      onEntregado();
    });
  };

  const entregado = vale.estado_entrega === "Entregado";

  return (
    <tr className="border-t border-slate-100 text-xs">
      {/* Código */}
      <td className="px-3 py-2">
        <a
          href={`${appUrl}/vale/${vale.codigo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
        >
          {vale.codigo}
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      </td>

      {/* Retira */}
      <td className="px-3 py-2 text-slate-700">
        {vale.destinatario || <span className="italic text-slate-400">Comprador</span>}
      </td>

      {/* Cantidad */}
      <td className="px-3 py-2 text-center font-bold text-slate-800">
        {vale.cantidad_pollos} pollo{vale.cantidad_pollos !== 1 ? "s" : ""}
      </td>

      {/* Estado */}
      <td className="px-3 py-2">
        {entregado ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            ✓ Entregado
            {vale.entregado_at && (
              <span className="font-normal opacity-70">{formatTime(vale.entregado_at)} hs</span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            ⏳ Pendiente de retiro
          </span>
        )}
      </td>

      {/* Acciones */}
      <td className="px-3 py-2">
        {!entregado && (
          <div className="flex items-center gap-1.5">
            {/* Marcar Entregado */}
            <button
              onClick={handleMarcarEntregado}
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Marcar Entregado
            </button>

            {/* WhatsApp al vendedor */}
            <a
              href={waPendingValeLink(pedido.whatsapp, pedido, vale)}
              target="_blank"
              rel="noopener noreferrer"
              title="Avisar al vendedor por WhatsApp"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              WA
            </a>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Vales accordion (expanded row) ──────────────────────────────────────────

function ValesAccordion({
  pedido,
  appUrl,
  colSpan,
  onRefresh,
  onValeEntregado,
}: {
  pedido: PedidoConVales;
  appUrl: string;
  colSpan: number;
  onRefresh: () => void;
  onValeEntregado: (pedidoId: string, valeId: string) => void;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Detalle de vales &mdash; {pedido.vales.length} vale{pedido.vales.length !== 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Retira</th>
                  <th className="px-3 py-2 text-center">Cantidad</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedido.vales.map((vale) => (
                  <ValeDetailRow
                    key={vale.id}
                    vale={vale}
                    pedido={pedido}
                    appUrl={appUrl}
                    onEntregado={onRefresh}
                    onValeEntregado={onValeEntregado}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Row actions ─────────────────────────────────────────────────────────────

function PedidoRow({
  pedido,
  appUrl,
  onImageClick,
  onValeEntregado,
}: {
  pedido: PedidoConVales;
  appUrl: string;
  onImageClick: (url: string) => void;
  onValeEntregado: (pedidoId: string, valeId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const approve = () =>
    startTransition(async () => {
      await approvePedido(pedido.id);
      router.refresh();
    });

  const confirmReject = (motivo: string) => {
    setRejectingId(null);
    startTransition(async () => {
      await rejectPedido(pedido.id, motivo);
      router.refresh();
    });
  };

  const hasVales = pedido.vales && pedido.vales.length > 0;

  return (
    <>
      {rejectingId && (
        <RejectModal
          pedidoId={rejectingId}
          onClose={() => setRejectingId(null)}
          onConfirm={confirmReject}
        />
      )}
      <tr className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors text-sm">
        {/* Fecha */}
        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(pedido.created_at)}</td>

        {/* Vendedor / Responsable */}
        <td className="px-4 py-3">
          <p className="font-semibold text-slate-900">{pedido.animador_vendedor || pedido.nombre_comprador}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-800 border border-emerald-200/60">
              {pedido.etapa}
            </span>
            <span>·</span>
            <span>{pedido.email}</span>
          </div>
        </td>

        {/* WhatsApp */}
        <td className="px-4 py-3">
          <a
            href={`https://wa.me/${pedido.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-mono text-xs font-medium"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {pedido.whatsapp}
          </a>
        </td>

        {/* Pollos + acordeón */}
        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-slate-900">{pedido.cantidad_total}</span>
            {hasVales && (() => {
              const entregados = pedido.vales.filter((v) => v.estado_entrega === "Entregado").length;
              const total = pedido.vales.length;
              const parcial = entregados > 0 && entregados < total;
              return (
                <>
                  <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                      expanded
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        {total} vale{total !== 1 ? "s" : ""}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Ver {total} vale{total !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                  {parcial && (
                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                      Entrega parcial ({entregados}/{total})
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </td>

        {/* Comprobantes */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {pedido.comprobantes_urls.length === 0 ? (
              <span className="text-xs text-slate-400">—</span>
            ) : (
              pedido.comprobantes_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => onImageClick(url)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors"
                >
                  Ver {i + 1}
                </button>
              ))
            )}
          </div>
        </td>

        {/* Estado */}
        <td className="px-4 py-3">
          <EstadoBadge estado={pedido.estado_pago} />
          {pedido.aprobado_por && (
            <p className="mt-1 text-[10px] text-slate-400 max-w-[140px] truncate" title={pedido.aprobado_por}>
              {pedido.aprobado_por}
            </p>
          )}
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {pedido.estado_pago === "Pendiente" && (
              <>
                <button
                  onClick={approve}
                  disabled={isPending}
                  title="Aprobar pedido"
                  className="rounded-lg bg-[#009B4D] p-1.5 text-white hover:bg-[#007a3d] disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setRejectingId(pedido.id)}
                  disabled={isPending}
                  title="Rechazar pedido"
                  className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {pedido.estado_pago === "Aprobado" && (
              <a
                href={waLink(pedido.whatsapp, pedido, appUrl)}
                target="_blank"
                rel="noopener noreferrer"
                title="Reenviar vales por WhatsApp"
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </a>
            )}
            {hasVales && (
              <a
                href={`/vale/${pedido.vales[0].codigo}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir primer vale"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </td>
      </tr>

      {/* Acordeón de vales */}
      {expanded && hasVales && (
        <ValesAccordion
          pedido={pedido}
          appUrl={appUrl}
          colSpan={7}
          onRefresh={() => router.refresh()}
          onValeEntregado={onValeEntregado}
        />
      )}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard({
  data,
  operator,
}: {
  data: DashboardData;
  operator: string;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("pedidos");
  const [pedidos, setPedidos] = useState(data.pedidos);
  const [filter, setFilter] = useState<Filter>("Todos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("fecha_desc");
  const [search, setSearch] = useState("");
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { metrics, rankingEtapas, leaderboardVendedores } = data;

  // Sincronizar estado local cuando cambian las props del servidor (ej: tras router.refresh())
  useEffect(() => {
    setPedidos(data.pedidos);
  }, [data.pedidos]);

  // Actualización optimista inmediata de la entrega de un vale
  const handleValeEntregado = (pedidoId: string, valeId: string) => {
    const nowIso = new Date().toISOString();
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p;
        return {
          ...p,
          vales: p.vales.map((v) =>
            v.id === valeId
              ? { ...v, estado_entrega: "Entregado" as const, entregado_at: nowIso }
              : v,
          ),
        };
      }),
    );
  };

  // ─── Clasificadores semánticos ────────────────────────────────────────────
  const counts = useMemo(() => {
    let pendiente = 0, porEntregar = 0, entregado = 0, rechazado = 0;
    for (const p of pedidos) {
      if (p.estado_pago === "Pendiente") pendiente++;
      else if (p.estado_pago === "Rechazado") rechazado++;
      else if (p.estado_pago === "Aprobado") {
        const hasVales = p.vales.length > 0;
        const allDone = hasVales && p.vales.every((v) => v.estado_entrega === "Entregado");
        if (allDone) entregado++;
        else porEntregar++;
      }
    }
    return { pendiente, porEntregar, entregado, rechazado };
  }, [pedidos]);

  const totalPollosEntregados = useMemo(() => {
    return pedidos.reduce((acc, p) => {
      return (
        acc +
        p.vales.reduce(
          (vAcc, v) => (v.estado_entrega === "Entregado" ? vAcc + v.cantidad_pollos : vAcc),
          0,
        )
      );
    }, 0);
  }, [pedidos]);

  const filtered = useMemo(() => {
    return pedidos.filter((p) => {
      // Filtro semántico
      let matchFilter = false;
      if (filter === "Todos") {
        matchFilter = true;
      } else if (filter === "Pendiente") {
        matchFilter = p.estado_pago === "Pendiente";
      } else if (filter === "Rechazado") {
        matchFilter = p.estado_pago === "Rechazado";
      } else if (filter === "PorEntregar") {
        // Aprobados que tienen al menos un vale pendiente (o sin vales: anomalía)
        matchFilter =
          p.estado_pago === "Aprobado" &&
          (p.vales.length === 0 || p.vales.some((v) => v.estado_entrega !== "Entregado"));
      } else if (filter === "Entregado") {
        // Aprobados con TODOS los vales entregados
        matchFilter =
          p.estado_pago === "Aprobado" &&
          p.vales.length > 0 &&
          p.vales.every((v) => v.estado_entrega === "Entregado");
      }

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.nombre_comprador.toLowerCase().includes(q) ||
        (p.animador_vendedor && p.animador_vendedor.toLowerCase().includes(q)) ||
        p.etapa.toLowerCase().includes(q) ||
        p.whatsapp.includes(q) ||
        p.email.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [pedidos, filter, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    return list.sort((a, b) => {
      if (sortOrder === "fecha_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOrder === "fecha_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      const nameA = a.animador_vendedor || a.nombre_comprador || "";
      const nameB = b.animador_vendedor || b.nombre_comprador || "";
      const keyA = getApellidoNombreKey(nameA);
      const keyB = getApellidoNombreKey(nameB);
      const cmp = keyA.localeCompare(keyB, "es", { sensitivity: "base" });
      return sortOrder === "nombre_asc" ? cmp : -cmp;
    });
  }, [filtered, sortOrder]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
      router.push("/admin/login");
    });
  };

  const handleChangeOperator = () => {
    startTransition(async () => {
      await clearOperator();
      router.refresh();
    });
  };


  return (
    <>
      {modalUrl && <ImageModal url={modalUrl} onClose={() => setModalUrl(null)} />}

      {/* Top bar */}
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Image src="/pollos/logo.png" alt="Logo" width={36} height={36} className="rounded-xl shadow-xs" />
          <div>
            <h1 className="text-base font-bold text-slate-900">Panel Camrevoc</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>
                Operando: <strong className="font-semibold text-slate-900">{operator}</strong>
              </span>
              <span>·</span>
              <button
                type="button"
                onClick={handleChangeOperator}
                disabled={isPending}
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                title="Cambiar quién está operando"
              >
                Cambiar
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveTab("pedidos")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "pedidos"
              ? "border-[#009B4D] text-[#009B4D]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Gestión de Pedidos</span>
          {metrics.pendientesRevision > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {metrics.pendientesRevision}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("estadisticas")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all cursor-pointer ${
            activeTab === "estadisticas"
              ? "border-[#009B4D] text-[#009B4D]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Estadísticas &amp; Rankings</span>
        </button>
      </div>

      <main className="p-4 sm:p-6 space-y-6">
        {/* Metric Cards (Globales) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-5">
          <MetricCard
            label="Pollos solicitados"
            value={String(metrics.totalSolicitados)}
            color="border-slate-800"
          />
          <MetricCard
            label="Pollos confirmados"
            value={String(metrics.totalAprobados)}
            color="border-[#009B4D]"
          />
          <MetricCard
            label="Recaudación aprob."
            value={formatARS(metrics.recaudacionAprobada)}
            color="border-[#009B4D]"
          />
          <MetricCard
            label="Pendientes de revisión"
            value={String(metrics.pendientesRevision)}
            color="border-amber-400"
          />
          <MetricCard
            label="Pollos entregados"
            value={String(totalPollosEntregados)}
            color="border-blue-500"
          />
        </div>

        {/* ─── PESTAÑA 1: PEDIDOS ─────────────────────────────────────────── */}
        {activeTab === "pedidos" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filters + sort + search */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Todos */}
                <button
                  onClick={() => setFilter("Todos")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    filter === "Todos"
                      ? "bg-[#009B4D] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Todos
                </button>

                {/* Pendientes de revisión */}
                <button
                  onClick={() => setFilter("Pendiente")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    filter === "Pendiente"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  Pendientes
                  {counts.pendiente > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === "Pendiente" ? "bg-white/30 text-white" : "bg-amber-100 text-amber-800"}`}>
                      {counts.pendiente}
                    </span>
                  )}
                </button>

                {/* Aprobados / Por entregar */}
                <button
                  onClick={() => setFilter("PorEntregar")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    filter === "PorEntregar"
                      ? "bg-[#009B4D] text-white shadow-xs"
                      : "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  Aprobados / Por entregar
                  {counts.porEntregar > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === "PorEntregar" ? "bg-white/30 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                      {counts.porEntregar}
                    </span>
                  )}
                </button>

                {/* Entregados completos */}
                <button
                  onClick={() => setFilter("Entregado")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    filter === "Entregado"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  ✓ Entregados
                  {counts.entregado > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === "Entregado" ? "bg-white/30 text-white" : "bg-blue-100 text-blue-800"}`}>
                      {counts.entregado}
                    </span>
                  )}
                </button>

                {/* Rechazados */}
                <button
                  onClick={() => setFilter("Rechazado")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    filter === "Rechazado"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  Rechazados
                  {counts.rechazado > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === "Rechazado" ? "bg-white/30 text-white" : "bg-rose-100 text-rose-800"}`}>
                      {counts.rechazado}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="sort-order"
                    className="text-xs font-semibold text-slate-500 whitespace-nowrap"
                  >
                    Ordenar:
                  </label>
                  <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 cursor-pointer"
                  >
                    <option value="fecha_desc">Fecha (más reciente)</option>
                    <option value="fecha_asc">Fecha (más antiguo)</option>
                    <option value="nombre_asc">Apellido / Nombre (A - Z)</option>
                    <option value="nombre_desc">Apellido / Nombre (Z - A)</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por vendedor, WhatsApp, etapa…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 sm:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              {sorted.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-slate-400">
                  No hay pedidos que coincidan con los filtros.
                </p>
              ) : (
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSortOrder((prev) =>
                              prev === "fecha_desc" ? "fecha_asc" : "fecha_desc",
                            )
                          }
                          className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                          title="Alternar orden por fecha"
                        >
                          <span>Fecha</span>
                          {sortOrder === "fecha_desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-[#009B4D]" />
                          ) : sortOrder === "fecha_asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-[#009B4D]" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSortOrder((prev) =>
                              prev === "nombre_asc" ? "nombre_desc" : "nombre_asc",
                            )
                          }
                          className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                          title="Alternar orden por apellido / nombre"
                        >
                          <span>Vendedor / Responsable</span>
                          {sortOrder === "nombre_asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-[#009B4D]" />
                          ) : sortOrder === "nombre_desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-[#009B4D]" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3 text-center">Pollos / Vales</th>
                      <th className="px-4 py-3">Comprobantes</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((pedido) => (
                      <PedidoRow
                        key={pedido.id}
                        pedido={pedido}
                        appUrl={appUrl}
                        onImageClick={setModalUrl}
                        onValeEntregado={handleValeEntregado}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <p className="text-center text-xs text-slate-400">
              {sorted.length} pedido{sorted.length !== 1 ? "s" : ""} mostrado{sorted.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* ─── PESTAÑA 2: ESTADÍSTICAS & RANKINGS ─────────────────────────── */}
        {activeTab === "estadisticas" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Ranking por Etapas */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#009B4D]" />
                    <h2 className="text-lg font-bold text-slate-900">Ranking por Etapas</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Competencia sana y seguimiento de objetivos grupales por etapa.
                  </p>
                </div>
                {rankingEtapas.length > 0 && rankingEtapas[0].aprobados > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                    👑 Etapa líder: {rankingEtapas[0].etapa} ({rankingEtapas[0].aprobados} pollos)
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {rankingEtapas.map((stat) => (
                  <div key={stat.etapa} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${stat.esLider ? "text-emerald-950" : "text-slate-800"}`}>
                          {stat.etapa}
                        </span>
                        {stat.esLider && stat.aprobados > 0 && (
                          <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white tracking-wide">
                            LÍDER
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {stat.aprobados} pollos
                        </span>
                        {stat.pendientes > 0 && (
                          <span className="text-amber-700 font-medium">
                            (+{stat.pendientes} en rev.)
                          </span>
                        )}
                        <span className="text-slate-400 font-mono hidden sm:inline">
                          {formatARS(stat.recaudado)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          stat.esLider
                            ? "bg-[#009B4D] shadow-xs"
                            : "bg-slate-700"
                        }`}
                        style={{ width: `${Math.max(stat.porcentajeLider, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Leaderboard de Vendedores (Top 10) */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-900">Leaderboard de Vendedores (Top 10)</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Los chicos y animadores con mayor cantidad de pollos confirmados.
                  </p>
                </div>
              </div>

              {leaderboardVendedores.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  Aún no hay ventas confirmadas registradas.
                </p>
              ) : (
                <>
                  {/* Podio visual (Top 3) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {leaderboardVendedores.slice(0, 3).map((v) => {
                      const isFirst = v.posicion === 1;
                      const isSecond = v.posicion === 2;
                      const isThird = v.posicion === 3;

                      const medal = isFirst ? "🥇" : isSecond ? "🥈" : "🥉";
                      const cardStyle = isFirst
                        ? "border-emerald-300 bg-emerald-50/50 shadow-sm"
                        : isSecond
                        ? "border-slate-300 bg-slate-50/70"
                        : "border-amber-200 bg-amber-50/40";

                      return (
                        <div
                          key={v.nombre}
                          className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 ${cardStyle}`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-3xl">{medal}</span>
                            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow-2xs border border-slate-200/60">
                              #{v.posicion}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight truncate" title={v.nombre}>
                              {v.nombre}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">{v.etapa}</p>
                          </div>

                          <div className="border-t border-slate-200/60 pt-2 flex items-baseline justify-between">
                            <div>
                              <p className="text-2xl font-extrabold text-slate-900 leading-none">
                                {v.pollosAprobados}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">pollos confirmados</p>
                            </div>
                            <span className="text-xs font-semibold text-emerald-800 font-mono">
                              {formatARS(v.recaudado)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabla para puestos #4 al #10 */}
                  {leaderboardVendedores.length > 3 && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5 w-16 text-center">Puesto</th>
                            <th className="px-4 py-2.5">Vendedor</th>
                            <th className="px-4 py-2.5">Etapa</th>
                            <th className="px-4 py-2.5 text-center">Pollos</th>
                            <th className="px-4 py-2.5 text-right">Recaudado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardVendedores.slice(3).map((v) => (
                            <tr key={v.nombre} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-2.5 text-center font-bold text-slate-500">#{v.posicion}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-900">{v.nombre}</td>
                              <td className="px-4 py-2.5 text-slate-600">{v.etapa}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-slate-900">
                                {v.pollosAprobados}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-600">
                                {formatARS(v.recaudado)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
