"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Users,
  DollarSign,
  TrendingUp,
  Search,
  LogOut,
  AlertTriangle,
  Utensils,
  CreditCard,
  CheckCircle,
  Clock,
  HeartHandshake,
  KeyRound,
  ShieldAlert,
  Inbox,
} from "lucide-react";
import type { InscriptoConPagos, MetricasEtapa, PagoPendienteRevision } from "@/types/campamento";
import type { CoordinadorConfig } from "@/config/campamento-coordinadores";
import { logoutCoordinador } from "@/app/campamento/actions/coordinacion-auth";
import { formatPrecio } from "@/config/campamento";
import GestionPagosModal from "./GestionPagosModal";
import CambiarPinModal from "./CambiarPinModal";
import PagosPendientesSection from "./PagosPendientesSection";

interface EtapaDashboardProps {
  inscriptos: InscriptoConPagos[];
  pagosPendientes?: PagoPendienteRevision[];
  metricas: MetricasEtapa;
  etapaConfig: CoordinadorConfig;
  coordinadorActual: string;
  esDefaultPin: boolean;
}

type FiltroEstado = "TODOS" | "PENDIENTES" | "PARCIALES" | "PAGADOS" | "DIFICULTAD";
type TabDashboard = "INSCRIPTOS" | "PENDIENTES";

export default function EtapaDashboard({
  inscriptos,
  pagosPendientes = [],
  metricas,
  etapaConfig,
  coordinadorActual,
  esDefaultPin: defaultPinInicial,
}: EtapaDashboardProps) {
  const router = useRouter();
  const [tabActual, setTabActual] = useState<TabDashboard>("INSCRIPTOS");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("TODOS");
  const [inscriptoSeleccionado, setInscriptoSeleccionado] = useState<InscriptoConPagos | null>(null);
  const [modalPinAbierto, setModalPinAbierto] = useState(false);
  const [esDefaultPin, setEsDefaultPin] = useState(defaultPinInicial);
  const [isLoggingOut, startLogout] = useTransition();

  const handleLogout = () => {
    startLogout(async () => {
      await logoutCoordinador();
      router.push("/campamento/coordinacion");
      router.refresh();
    });
  };

  // Filtrado de inscriptos
  const inscriptosFiltrados = inscriptos.filter((item) => {
    // Búsqueda por texto (nombre, apellido, dni)
    const q = busqueda.trim().toLowerCase();
    const matchTexto =
      !q ||
      item.nombre.toLowerCase().includes(q) ||
      item.apellido.toLowerCase().includes(q) ||
      item.dni.includes(q);

    if (!matchTexto) return false;

    // Filtro por estado
    if (filtro === "PENDIENTES") return item.estadoPago === "PENDIENTE";
    if (filtro === "PARCIALES") return item.estadoPago === "PARCIAL";
    if (filtro === "PAGADOS") return item.estadoPago === "PAGADO";
    if (filtro === "DIFICULTAD") return item.dificultad_pago;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="CamReVoc"
              width={40}
              height={40}
              className="h-9 w-9 rounded-xl object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 sm:text-lg">
                  {etapaConfig.nombreEtapa}
                </h1>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  {etapaConfig.destino} (${(etapaConfig.tarifa / 1000).toFixed(0)}k)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Coordina: <strong className="text-slate-700">{coordinadorActual}</strong>
              </p>
            </div>
          </div>

          {/* Acciones del Navbar */}
          <div className="flex items-center gap-2">
            {/* Botón Cambiar PIN */}
            <button
              type="button"
              onClick={() => setModalPinAbierto(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-colors cursor-pointer"
              title="Cambiar PIN de acceso"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline">Cambiar PIN</span>
            </button>

            {/* Botón Cerrar Sesión / Cambiar etapa */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Banner de advertencia si tiene PIN por defecto */}
      {esDefaultPin && (
        <aside className="border-b border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 px-4 py-3 text-amber-900 shadow-2xs">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2.5 sm:px-6">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-center sm:text-left">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700" />
              <span>
                <strong>⚠️ Tu etapa está usando la contraseña por defecto.</strong> Te recomendamos cambiarla por seguridad.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setModalPinAbierto(true)}
              className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Cambiar contraseña ahora
            </button>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Métricas Header */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* Total Inscriptos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Inscriptos</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {metricas.totalInscriptos}
            </p>
            <p className="text-[11px] text-slate-400">Chicos y chicas inscriptos</p>
          </div>

          {/* Recaudado */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Recaudado</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-900 sm:text-3xl">
              {formatPrecio(metricas.totalRecaudado)}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">En caja de la etapa</p>
          </div>

          {/* Presupuestado */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Presupuestado</span>
              <TrendingUp className="h-4 w-4 text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {formatPrecio(metricas.totalPresupuestado)}
            </p>
            <p className="text-[11px] text-slate-400">Total al 100% de la cuota</p>
          </div>

            {/* Porcentaje de Cobranza */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">% Cobranza</span>
              <span className="text-xs font-bold text-emerald-600">🎯 Meta</span>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-700 sm:text-3xl">
              {metricas.porcentajeCobranza}%
            </p>
            <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, metricas.porcentajeCobranza)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Selector de Pestañas: Inscriptos vs Pagos Pendientes */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setTabActual("INSCRIPTOS")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tabActual === "INSCRIPTOS"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Chicos Inscriptos ({inscriptos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActual("PENDIENTES")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              tabActual === "PENDIENTES"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Inbox className="h-4 w-4 text-amber-500" />
            <span>Pagos pendientes de revisión</span>
            {pagosPendientes.length > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-black ${
                  tabActual === "PENDIENTES"
                    ? "bg-white text-amber-700"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {pagosPendientes.length}
              </span>
            )}
          </button>
        </div>

        {/* Contenido según pestaña seleccionada */}
        {tabActual === "PENDIENTES" ? (
          <PagosPendientesSection
            pagos={pagosPendientes}
            etapaNum={String(etapaConfig.etapaNum)}
            nombreEtapa={etapaConfig.nombreEtapa}
          />
        ) : (
          <>
            {/* Barra de Filtros y Búsqueda */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Buscador */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por Nombre, Apellido o DNI..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-[#009B4D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 transition-all"
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Contador de resultados */}
                <div className="text-xs text-slate-500 shrink-0 self-center">
                  Mostrando <strong>{inscriptosFiltrados.length}</strong> de{" "}
                  <strong>{inscriptos.length}</strong> inscriptos
                </div>
              </div>

          {/* Filtros rápidos por estado */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-400 mr-1">Filtro:</span>
            {[
              { id: "TODOS", label: "Todos" },
              { id: "PENDIENTES", label: "Pendientes", badgeColor: "bg-rose-100 text-rose-800" },
              { id: "PARCIALES", label: "Pagos Parciales", badgeColor: "bg-amber-100 text-amber-800" },
              { id: "PAGADOS", label: "Pagados", badgeColor: "bg-emerald-100 text-emerald-800" },
              { id: "DIFICULTAD", label: "Con Dificultad de Pago", badgeColor: "bg-purple-100 text-purple-800" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id as FiltroEstado)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  filtro === f.id
                    ? "bg-[#009B4D] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Tabla / Lista de Inscriptos */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {inscriptosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-base font-semibold">No se encontraron inscriptos con los filtros actuales.</p>
              <p className="mt-1 text-xs text-slate-400">Probá modificando el término de búsqueda o el filtro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">Participante</th>
                    <th className="px-4 py-3">DNI / Rol</th>
                    <th className="px-4 py-3">Alertas & Dieta</th>
                    <th className="px-4 py-3">Estado de Pago</th>
                    <th className="px-4 py-3 text-right sm:px-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inscriptosFiltrados.map((item) => {
                    const esOmnivoro = item.regimen_alimentario === "Omnívoro";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Participante */}
                        <td className="px-4 py-3.5 sm:px-6">
                          <p className="font-extrabold text-slate-900">
                            {item.apellido}, {item.nombre}
                          </p>
                          {item.quiere_aportar && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                              <HeartHandshake className="h-3 w-3" />
                              Ofrece donar: {item.contacto_donacion || "Sí"}
                            </span>
                          )}
                        </td>

                        {/* DNI y Rol */}
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-xs text-slate-700 font-semibold">{item.dni}</p>
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                              item.rol === "COORDINADOR"
                                ? "bg-purple-100 text-purple-800"
                                : item.rol === "ANIMADOR"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.rol}
                          </span>
                        </td>

                        {/* Alertas sutiles */}
                        <td className="px-4 py-3.5 space-y-1">
                          {item.dificultad_pago && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                              <AlertTriangle className="h-3 w-3" />
                              Dificultad de pago
                            </span>
                          )}
                          {!esOmnivoro && (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-900">
                                <Utensils className="h-3 w-3" />
                                {item.regimen_alimentario}
                              </span>
                              {item.detalle_alimentario && (
                                <span
                                  className="text-[10px] text-slate-500 italic max-w-[140px] truncate block"
                                  title={item.detalle_alimentario}
                                >
                                  ({item.detalle_alimentario})
                                </span>
                              )}
                            </div>
                          )}
                          {esOmnivoro && !item.dificultad_pago && (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Estado de Pago */}
                        <td className="px-4 py-3.5">
                          {item.estadoPago === "PAGADO" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                              <CheckCircle className="h-3.5 w-3.5" />
                              PAGADO
                            </span>
                          ) : item.estadoPago === "PARCIAL" ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                                <Clock className="h-3 w-3" />
                                PARCIAL
                              </span>
                              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                                {formatPrecio(item.totalPagado)} de {formatPrecio(item.tarifa)}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                                <AlertTriangle className="h-3 w-3" />
                                PENDIENTE
                              </span>
                              <p className="mt-0.5 text-[11px] text-slate-400 font-mono">
                                Resta: {formatPrecio(item.tarifa)}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Botón Gestionar Pagos */}
                        <td className="px-4 py-3.5 text-right sm:px-6">
                          <button
                            type="button"
                            onClick={() => setInscriptoSeleccionado(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#009B4D] transition-colors cursor-pointer"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Gestionar Pagos</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
        )}
      </main>

      {/* Modal de Pagos */}
      {inscriptoSeleccionado && (
        <GestionPagosModal
          inscripto={inscriptoSeleccionado}
          coordinadorActual={coordinadorActual}
          etapaNum={String(etapaConfig.etapaNum)}
          onClose={() => setInscriptoSeleccionado(null)}
        />
      )}

      {/* Modal de Cambio de PIN */}
      {modalPinAbierto && (
        <CambiarPinModal
          etapaNombre={etapaConfig.nombreEtapa}
          onClose={() => setModalPinAbierto(false)}
          onSuccess={() => setEsDefaultPin(false)}
        />
      )}
    </div>
  );
}
