"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  DollarSign,
  TrendingUp,
  Search,
  LogOut,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  ChevronLeft,
  ShieldCheck,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import type { InscriptoAdminGeneral, MetricasAdminGeneral } from "@/types/campamento";
import { formatPrecio } from "@/config/campamento";
import { logoutAdminGeneral } from "@/app/campamento/actions/admin-general-auth";
import { exportarCampamentoExcelAction } from "@/app/campamento/actions/admin-general-actions";
import FichaInscriptoModal from "./FichaInscriptoModal";
import { normalizarEtapa } from "@/config/campamento-coordinadores";

interface AdminGeneralDashboardProps {
  inscriptos: InscriptoAdminGeneral[];
  metricas: MetricasAdminGeneral;
}

type FiltroDestino = "TODOS" | "Junín" | "Regina";
type FiltroEstadoPago =
  | "TODOS"
  | "PAGADOS"
  | "PARCIALES"
  | "PENDIENTES"
  | "DIFICULTAD"
  | "REVISION"
  | "COMPARTIDO";

const ETAPAS_JUNIN = ["1ra", "2da", "3ra", "6ta", "7ma"];
const ETAPAS_REGINA = ["4ta", "5ta"];
const TODAS_ETAPAS = ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "7ma"];

export default function AdminGeneralDashboard({
  inscriptos,
  metricas: metricasIniciales,
}: AdminGeneralDashboardProps) {
  const router = useRouter();

  // Estados de navegación y filtros
  const [destino, setDestino] = useState<FiltroDestino>("TODOS");
  const [etapa, setEtapa] = useState<string>("TODAS");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPago>("TODOS");
  const [busqueda, setBusqueda] = useState<string>("");

  // Ficha individual
  const [inscriptoFichaId, setInscriptoFichaId] = useState<string | null>(null);

  // Estados de acciones
  const [isLoggingOut, startLogout] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<{
    tipo: "error" | "info" | "success";
    mensaje: string;
  } | null>(null);

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAdminGeneral();
      router.push("/campamento/admin-general/login");
      router.refresh();
    });
  };

  // Etapas disponibles según campamento seleccionado
  const etapasDisponibles = useMemo(() => {
    if (destino === "Junín") return ETAPAS_JUNIN;
    if (destino === "Regina") return ETAPAS_REGINA;
    return TODAS_ETAPAS;
  }, [destino]);

  // Al cambiar de destino, resetear etapa si no pertenece
  const handleCambioDestino = (nuevoDestino: FiltroDestino) => {
    setDestino(nuevoDestino);
    if (nuevoDestino === "Junín" && !ETAPAS_JUNIN.includes(etapa)) {
      setEtapa("TODAS");
    } else if (nuevoDestino === "Regina" && !ETAPAS_REGINA.includes(etapa)) {
      setEtapa("TODAS");
    }
  };

  // Inscriptos filtrados en tiempo real
  const inscriptosFiltrados = useMemo(() => {
    return inscriptos.filter((item) => {
      // 1. Filtro Destino
      if (destino !== "TODOS" && item.destino !== destino) {
        return false;
      }

      // 2. Filtro Etapa
      if (etapa !== "TODAS") {
        const numEtapa = normalizarEtapa(etapa);
        if (numEtapa && normalizarEtapa(item.etapa) !== numEtapa) {
          return false;
        }
      }

      // 3. Filtro Estado de Pago
      if (filtroEstado === "PAGADOS" && item.estadoPago !== "PAGADO") return false;
      if (filtroEstado === "PARCIALES" && item.estadoPago !== "PARCIAL") return false;
      if (filtroEstado === "PENDIENTES" && item.estadoPago !== "PENDIENTE") return false;
      if (filtroEstado === "DIFICULTAD" && !item.dificultad_pago) return false;
      if (filtroEstado === "REVISION" && item.montoPendienteRevision <= 0) return false;
      if (filtroEstado === "COMPARTIDO" && !item.tieneComprobanteCompartido) return false;

      // 4. Búsqueda por texto (Nombre, Apellido, DNI, Teléfono)
      if (busqueda.trim().length > 0) {
        const q = busqueda.trim().toLowerCase();
        const qDigits = q.replace(/\D/g, "");
        const nombreCompleto = `${item.nombre} ${item.apellido}`.toLowerCase();
        const apellidoPrimero = `${item.apellido} ${item.nombre}`.toLowerCase();
        const tel = item.ultimoTelefono?.telefono.replace(/\D/g, "") || "";

        const match =
          nombreCompleto.includes(q) ||
          apellidoPrimero.includes(q) ||
          (qDigits.length >= 3 && item.dni.includes(qDigits)) ||
          (qDigits.length >= 4 && tel.includes(qDigits));

        if (!match) return false;
      }

      return true;
    });
  }, [inscriptos, destino, etapa, filtroEstado, busqueda]);

  // Métricas reactivas del conjunto actualmente filtrado por Destino y Etapa
  const metricasVista = useMemo(() => {
    // Si no hay filtros aplicados, usar métricas precálculadas
    if (destino === "TODOS" && etapa === "TODAS") {
      return {
        totalInscriptos: metricasIniciales.totalInscriptos,
        totalRecaudado: metricasIniciales.totalRecaudado,
        totalPresupuestado: metricasIniciales.totalPresupuestado,
        totalSaldoPendiente: metricasIniciales.totalSaldoPendiente,
        porcentajeCobranza: metricasIniciales.porcentajeCobranza,
        conteoPagados: metricasIniciales.conteoPagados,
        conteoParciales: metricasIniciales.conteoParciales,
        conteoPendientes: metricasIniciales.conteoPendientes,
        conteoDificultad: metricasIniciales.conteoDificultad,
        conteoConPagosRevision: metricasIniciales.conteoConPagosRevision,
        totalMontoRevision: metricasIniciales.totalMontoRevision,
      };
    }

    // Si hay filtro de destino o etapa, computar sobre los inscriptos de ese ámbito
    const inscriptosAmbito = inscriptos.filter((item) => {
      if (destino !== "TODOS" && item.destino !== destino) return false;
      if (etapa !== "TODAS") {
        const numEtapa = normalizarEtapa(etapa);
        if (numEtapa && normalizarEtapa(item.etapa) !== numEtapa) return false;
      }
      return true;
    });

    let totalRecaudado = 0;
    let totalPresupuestado = 0;
    let totalSaldoPendiente = 0;
    let conteoPagados = 0;
    let conteoParciales = 0;
    let conteoPendientes = 0;
    let conteoDificultad = 0;
    let conteoConPagosRevision = 0;
    let totalMontoRevision = 0;

    for (const item of inscriptosAmbito) {
      totalRecaudado += item.totalPagado;
      totalPresupuestado += item.tarifa;
      totalSaldoPendiente += item.saldoRestante;

      if (item.estadoPago === "PAGADO") conteoPagados++;
      else if (item.estadoPago === "PARCIAL") conteoParciales++;
      else conteoPendientes++;

      if (item.dificultad_pago) conteoDificultad++;
      if (item.montoPendienteRevision > 0) {
        conteoConPagosRevision++;
        totalMontoRevision += item.montoPendienteRevision;
      }
    }

    const porcentajeCobranza =
      totalPresupuestado > 0 ? Math.round((totalRecaudado / totalPresupuestado) * 100) : 0;

    return {
      totalInscriptos: inscriptosAmbito.length,
      totalRecaudado,
      totalPresupuestado,
      totalSaldoPendiente,
      porcentajeCobranza,
      conteoPagados,
      conteoParciales,
      conteoPendientes,
      conteoDificultad,
      conteoConPagosRevision,
      totalMontoRevision,
    };
  }, [inscriptos, destino, etapa, metricasIniciales]);

  // Manejo de Exportación a Excel
  const handleExportarExcel = async () => {
    setExportNotice(null);
    setIsExporting(true);

    try {
      const res = await exportarCampamentoExcelAction({
        destino: destino === "TODOS" ? undefined : destino,
        etapa: etapa === "TODAS" ? undefined : etapa,
        estadoPago: filtroEstado === "TODOS" ? undefined : filtroEstado,
        busqueda: busqueda.trim() || undefined,
      });

      if (!res.ok) {
        setExportNotice({
          tipo: "error",
          mensaje: res.error || "No se pudo generar el archivo de exportación.",
        });
        return;
      }

      if (!res.total || res.total === 0 || !res.base64) {
        setExportNotice({
          tipo: "info",
          mensaje: "No hay inscriptos que coincidan con los filtros seleccionados para exportar.",
        });
        return;
      }

      // Descarga directa desde el navegador
      const binaryString = window.atob(res.base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename || "campamentos-2027-inscriptos.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setExportNotice({
        tipo: "success",
        mensaje: `Se exportaron ${res.total} inscriptos correctamente a ${res.filename}.`,
      });
    } catch (err) {
      console.error("[handleExportarExcel] Error:", err);
      setExportNotice({
        tipo: "error",
        mensaje: "Ocurrió un error inesperado al descargar el archivo Excel.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Inscripto seleccionado para la Ficha Individual
  const inscriptoFicha = useMemo(() => {
    if (!inscriptoFichaId) return null;
    return inscriptos.find((i) => i.id === inscriptoFichaId) || null;
  }, [inscriptos, inscriptoFichaId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              title="Volver al inicio"
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <Image
                src="/logo.png"
                alt="Logo CamReVoc"
                width={36}
                height={36}
                className="h-8 w-8 rounded-xl object-contain"
              />
              <span className="hidden sm:inline font-bold">Inicio</span>
            </Link>
            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900">
                  Panel General de Campamentos 2027
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-900">
                  <ShieldCheck className="h-3 w-3 text-emerald-700" />
                  Solo Lectura
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Junín de los Andes & Villa Regina · Todas las etapas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Cabecera y Botón de Exportación */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Nómina Consolidada y Situación Contable
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Consulta de participantes, historial de pagos, teléfonos informados y recaudación.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportarExcel}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {isExporting ? "Generando Excel…" : "Exportar a Excel (.xlsx)"}
          </button>
        </div>

        {/* Notificación de Exportación */}
        {exportNotice && (
          <div
            role="status"
            className={`flex items-center justify-between gap-2 rounded-2xl border p-3.5 text-xs font-semibold ${
              exportNotice.tipo === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : exportNotice.tipo === "info"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <span>{exportNotice.mensaje}</span>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="cursor-pointer px-1 font-bold opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navegación de Nivel 1: Selector de Campamento */}
        <section className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Seleccionar Campamento:
            </span>
            <span className="text-xs text-slate-400">
              {destino === "TODOS"
                ? "Consolidado total"
                : destino === "Junín"
                ? "1ra, 2da, 3ra, 6ta y 7ma Etapa ($550.000)"
                : "4ta y 5ta Etapa ($200.000)"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "TODOS", label: "Todos los Campamentos" },
              { id: "Junín", label: "Junín de los Andes ($550k)" },
              { id: "Regina", label: "Villa Regina ($200k)" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleCambioDestino(btn.id as FiltroDestino)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  destino === btn.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Navegación de Nivel 2: Selector de Etapas del Campamento */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">
              Etapa:
            </span>
            <button
              type="button"
              onClick={() => setEtapa("TODAS")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                etapa === "TODAS"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas
            </button>
            {etapasDisponibles.map((et) => (
              <button
                key={et}
                type="button"
                onClick={() => setEtapa(et)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  etapa === et
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {et} Etapa
              </button>
            ))}
          </div>
        </section>

        {/* Tarjetas de Métricas Consolidadas */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* Total Inscriptos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Inscriptos</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {metricasVista.totalInscriptos}
            </p>
            <p className="text-[11px] text-slate-400">
              {destino === "TODOS"
                ? `${metricasIniciales.porDestino.Junín.totalInscriptos} Junín · ${metricasIniciales.porDestino.Regina.totalInscriptos} Regina`
                : `${metricasVista.conteoPagados} al día`}
            </p>
          </div>

          {/* Recaudado Aprobado */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Abonado Aprobado</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-900 sm:text-3xl">
              {formatPrecio(metricasVista.totalRecaudado)}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">Pagos verificados</p>
          </div>

          {/* Saldo Pendiente */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold uppercase tracking-wider">Saldo por Cobrar</span>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-900 sm:text-3xl">
              {formatPrecio(metricasVista.totalSaldoPendiente)}
            </p>
            <p className="text-[11px] text-amber-700 font-medium">
              Presupuesto: {formatPrecio(metricasVista.totalPresupuestado)}
            </p>
          </div>

          {/* Porcentaje de Cobranza */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">% Cobranza</span>
              <span className="text-xs font-bold text-emerald-600">🎯 Meta</span>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-700 sm:text-3xl">
              {metricasVista.porcentajeCobranza}%
            </p>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, metricasVista.porcentajeCobranza)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Sección de Búsqueda y Filtros Rápidos */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          {/* Buscador Universal */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por DNI, nombre, apellido o teléfono informado…"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* Filtros de Estado */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">
              Estado:
            </span>
            {(
              [
                ["TODOS", "Todos los estados"],
                ["PAGADOS", `Al día (${metricasVista.conteoPagados})`],
                ["PARCIALES", `Pago parcial (${metricasVista.conteoParciales})`],
                ["PENDIENTES", `Sin pagos (${metricasVista.conteoPendientes})`],
                ["DIFICULTAD", `Con dificultad (${metricasVista.conteoDificultad})`],
                ["REVISION", `En revisión (${metricasVista.conteoConPagosRevision})`],
                ["COMPARTIDO", "Comprobante compartido"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFiltroEstado(val)}
                className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  filtroEstado === val
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <p>
              Mostrando <strong>{inscriptosFiltrados.length}</strong> de{" "}
              <strong>{inscriptos.length}</strong> inscriptos totales.
            </p>
            {(busqueda || filtroEstado !== "TODOS" || destino !== "TODOS" || etapa !== "TODAS") && (
              <button
                type="button"
                onClick={() => {
                  setDestino("TODOS");
                  setEtapa("TODAS");
                  setFiltroEstado("TODOS");
                  setBusqueda("");
                }}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            )}
          </div>
        </section>

        {/* Tabla / Listado de Inscriptos */}
        {inscriptosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-2xs">
            <p className="font-bold text-slate-700">No se encontraron inscriptos</p>
            <p className="mt-1 text-xs text-slate-400">
              No hay participantes que coincidan con los filtros o la búsqueda ingresada.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Inscripto</th>
                    <th className="px-3 py-3">Campamento / Etapa</th>
                    <th className="px-3 py-3 text-right">Tarifa Base</th>
                    <th className="px-3 py-3 text-right">Abonado</th>
                    <th className="px-3 py-3 text-right">Saldo</th>
                    <th className="px-3 py-3 text-center">Estado</th>
                    <th className="px-3 py-3">Último Teléfono</th>
                    <th className="px-3 py-3">Alertas</th>
                    <th className="px-4 py-3 text-right">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inscriptosFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Inscripto */}
                      <td className="px-4 py-3.5 font-medium">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.apellido}, {item.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span>DNI {item.dni}</span>
                          <span className="rounded bg-slate-100 px-1 text-[10px] text-slate-600">
                            {item.rol}
                          </span>
                        </div>
                      </td>

                      {/* Campamento / Etapa */}
                      <td className="px-3 py-3.5">
                        <span className="font-semibold text-slate-800">{item.destino}</span>
                        <div className="text-[11px] text-slate-500">{item.etapa}</div>
                      </td>

                      {/* Tarifa Base */}
                      <td className="px-3 py-3.5 text-right font-medium text-slate-600">
                        {formatPrecio(item.tarifa)}
                      </td>

                      {/* Abonado Aprobado */}
                      <td className="px-3 py-3.5 text-right font-bold text-emerald-700">
                        {formatPrecio(item.totalPagado)}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="px-3 py-3.5 text-right font-bold text-slate-800">
                        {item.saldoRestante === 0 ? (
                          <span className="text-emerald-600">$0</span>
                        ) : (
                          formatPrecio(item.saldoRestante)
                        )}
                      </td>

                      {/* Estado Contable */}
                      <td className="px-3 py-3.5 text-center">
                        {item.estadoPago === "PAGADO" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            <CheckCircle className="h-3 w-3" /> Pagado
                          </span>
                        ) : item.estadoPago === "PARCIAL" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                            <Clock className="h-3 w-3" /> Parcial
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Último Teléfono Informado */}
                      <td className="px-3 py-3.5">
                        {item.ultimoTelefono ? (
                          <div>
                            <span className="font-mono text-xs font-semibold text-slate-800">
                              {item.ultimoTelefono.telefono}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Último en pago
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sin teléfono</span>
                        )}
                      </td>

                      {/* Alertas */}
                      <td className="px-3 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {item.dificultad_pago && (
                            <span
                              title="Familia declaró dificultad de pago"
                              className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800"
                            >
                              <AlertTriangle className="h-2.5 w-2.5" /> Dificultad
                            </span>
                          )}
                          {item.tieneComprobanteCompartido && (
                            <span
                              title="Comprobante bancario compartido con otros inscriptos"
                              className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800"
                            >
                              Compartido
                            </span>
                          )}
                          {item.montoPendienteRevision > 0 && (
                            <span
                              title={`Pagos pendientes de aprobación: ${formatPrecio(item.montoPendienteRevision)}`}
                              className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900"
                            >
                              En revisión
                            </span>
                          )}
                          {item.regimen_alimentario !== "Omnívoro" && (
                            <span
                              title={`Régimen: ${item.regimen_alimentario}`}
                              className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800"
                            >
                              {item.regimen_alimentario}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Acción Ficha */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setInscriptoFichaId(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Ficha</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Ficha Individual */}
      {inscriptoFicha && (
        <FichaInscriptoModal
          inscripto={inscriptoFicha}
          onClose={() => setInscriptoFichaId(null)}
          onSelectOtroInscripto={(nuevoId) => setInscriptoFichaId(nuevoId)}
        />
      )}
    </div>
  );
}
