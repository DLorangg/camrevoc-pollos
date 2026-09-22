"use client";

import { useState, useTransition, useMemo } from "react";
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
} from "lucide-react";
import { approvePedido, rejectPedido, type DashboardData } from "@/app/actions/admin-pedidos";
import { logoutAdmin } from "@/app/actions/admin-auth";
import type { Pedido, Vale } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type PedidoConVales = Pedido & { vales: Vale[] };
type Filter = "Todos" | "Pendiente" | "Aprobado" | "Rechazado";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRECIO_POLLO = 8_000;

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

function waLink(whatsapp: string, pedido: PedidoConVales, appUrl: string) {
  const num = whatsapp.replace(/\D/g, "");
  const codigos = pedido.vales.map((v) => v.codigo).join(", ");
  const text = encodeURIComponent(
    `Hola ${pedido.nombre_comprador} 👋, te confirmamos tu pedido de ${pedido.cantidad_total} pollo${pedido.cantidad_total !== 1 ? "s" : ""} de Camrevoc.\n\nTus códigos de vale: ${codigos}\n\nPodés verlos en:\n${pedido.vales.map((v) => `${appUrl}/vale/${v.codigo}`).join("\n")}`,
  );
  return `https://wa.me/${num}?text=${text}`;
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
    <div className={`rounded-2xl border-l-4 bg-white px-5 py-4 shadow-sm ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-700 border-amber-200",
    Aprobado: "bg-green-100 text-green-700 border-green-200",
    Rechazado: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[estado] ?? "bg-gray-100 text-gray-600"}`}>
      {estado}
    </span>
  );
}

// ─── Row actions ─────────────────────────────────────────────────────────────

function PedidoRow({
  pedido,
  appUrl,
  onImageClick,
}: {
  pedido: PedidoConVales;
  appUrl: string;
  onImageClick: (url: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
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

  return (
    <>
      {rejectingId && (
        <RejectModal
          pedidoId={rejectingId}
          onClose={() => setRejectingId(null)}
          onConfirm={confirmReject}
        />
      )}
      <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors text-sm">
        {/* Fecha */}
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(pedido.created_at)}</td>

        {/* Comprador */}
        <td className="px-4 py-3">
          <p className="font-medium text-gray-900">{pedido.nombre_comprador}</p>
          <p className="text-xs text-gray-500">{pedido.email}</p>
        </td>

        {/* WhatsApp */}
        <td className="px-4 py-3">
          <a
            href={`https://wa.me/${pedido.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-700 hover:underline font-mono text-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {pedido.whatsapp}
          </a>
        </td>

        {/* Etapa / Animador */}
        <td className="px-4 py-3">
          <p className="text-gray-700">{pedido.etapa}</p>
          <p className="text-xs text-gray-400">{pedido.animador_vendedor}</p>
        </td>

        {/* Pollos */}
        <td className="px-4 py-3 text-center font-bold text-gray-900">{pedido.cantidad_total}</td>

        {/* Comprobantes */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {pedido.comprobantes_urls.length === 0 ? (
              <span className="text-xs text-gray-400">—</span>
            ) : (
              pedido.comprobantes_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => onImageClick(url)}
                  className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
            <p className="mt-1 text-[10px] text-gray-400">{pedido.aprobado_por}</p>
          )}
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1.5">
            {pedido.estado_pago === "Pendiente" && (
              <>
                <button
                  onClick={approve}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#009B4D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#007a3d] disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                  Aprobar
                </button>
                <button
                  onClick={() => setRejectingId(pedido.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Rechazar
                </button>
              </>
            )}
            <a
              href={waLink(pedido.whatsapp, pedido, appUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              WhatsApp
            </a>
          </div>
        </td>
      </tr>
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
  const [filter, setFilter] = useState<Filter>("Todos");
  const [search, setSearch] = useState("");
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { metrics } = data;

  const filtered = useMemo(() => {
    return data.pedidos.filter((p) => {
      const matchFilter = filter === "Todos" || p.estado_pago === filter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.nombre_comprador.toLowerCase().includes(q) ||
        p.whatsapp.includes(q) ||
        p.email.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [data.pedidos, filter, search]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
      router.push("/admin/login");
    });
  };

  const FILTERS: Filter[] = ["Todos", "Pendiente", "Aprobado", "Rechazado"];

  return (
    <>
      {modalUrl && <ImageModal url={modalUrl} onClose={() => setModalUrl(null)} />}

      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="rounded-xl shadow-xs" />
          <div>
            <h1 className="text-base font-bold text-slate-900">Panel Camrevoc</h1>
            <p className="text-xs text-slate-500">Operando como: <strong className="text-slate-800">{operator}</strong></p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </header>

      <main className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        </div>

        {/* Filters + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f
                    ? "bg-[#009B4D] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o WhatsApp…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 sm:w-72"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">
              No hay pedidos que coincidan con los filtros.
            </p>
          ) : (
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  {["Fecha", "Comprador", "WhatsApp", "Etapa / Animador", "Pollos", "Comprobantes", "Estado", "Acciones"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((pedido) => (
                  <PedidoRow
                    key={pedido.id}
                    pedido={pedido}
                    appUrl={appUrl}
                    onImageClick={setModalUrl}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} mostrado{filtered.length !== 1 ? "s" : ""}
        </p>
      </main>
    </>
  );
}
