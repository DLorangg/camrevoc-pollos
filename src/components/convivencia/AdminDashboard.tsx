"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, LogOut, Search, Wheat } from "lucide-react";
import { logoutConvivenciaAdmin } from "@/app/convivencia/actions/admin-actions";
import { CONVIVENCIA_ETAPAS } from "@/config/convivencia";
import type { InscripcionConvivenciaRow } from "@/types/convivencia";

type Filtro = "todas" | "celiacos" | "menores-sin-adulto" | "salud";

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const fmtFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function tieneMenorSinAdulto(i: InscripcionConvivenciaRow) {
  return i.convivencia_integrantes.some((m) => m.menor_acompanado === false);
}
function tieneSalud(i: InscripcionConvivenciaRow) {
  return i.convivencia_integrantes.some((m) => Boolean(m.observaciones_salud));
}

export default function ConvivenciaAdminDashboard({
  inscripciones,
}: {
  inscripciones: InscripcionConvivenciaRow[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [etapa, setEtapa] = useState("");
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const personas = inscripciones.reduce((a, i) => a + i.convivencia_integrantes.length, 0);
    return {
      familias: inscripciones.length,
      personas,
      celiacos: inscripciones.filter((i) => i.hay_celiaco).length,
      menoresSinAdulto: inscripciones.reduce(
        (a, i) => a + i.convivencia_integrantes.filter((m) => m.menor_acompanado === false).length,
        0
      ),
    };
  }, [inscripciones]);

  // DNIs presentes en más de una inscripción (posible duplicado de familia).
  const dnisRepetidos = useMemo(() => {
    const mapa = new Map<string, Set<string>>();
    inscripciones.forEach((i) =>
      i.convivencia_integrantes.forEach((m) => {
        if (!mapa.has(m.dni)) mapa.set(m.dni, new Set());
        mapa.get(m.dni)!.add(i.id);
      })
    );
    return new Set([...mapa.entries()].filter(([, ids]) => ids.size > 1).map(([dni]) => dni));
  }, [inscripciones]);

  const filtradas = useMemo(() => {
    const q = norm(busqueda);
    const qDigitos = busqueda.replace(/\D/g, "");
    return inscripciones.filter((i) => {
      if (filtro === "celiacos" && !i.hay_celiaco) return false;
      if (filtro === "menores-sin-adulto" && !tieneMenorSinAdulto(i)) return false;
      if (filtro === "salud" && !tieneSalud(i)) return false;
      if (etapa && !i.convivencia_integrantes.some((m) => m.etapa === etapa)) return false;
      if (!q) return true;
      return i.convivencia_integrantes.some((m) => {
        const completo = norm(`${m.nombre} ${m.apellido}`);
        const invertido = norm(`${m.apellido} ${m.nombre}`);
        return (
          completo.includes(q) ||
          invertido.includes(q) ||
          (qDigitos.length >= 3 && m.dni.includes(qDigitos))
        );
      });
    });
  }, [inscripciones, busqueda, filtro, etapa]);

  const salir = () =>
    startTransition(async () => {
      await logoutConvivenciaAdmin();
      router.push("/convivencia/admin/login");
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          <Image src="/logo.png" alt="Logo CamReVoc" width={24} height={24} className="rounded-lg" />
          Inicio
        </Link>
        <button
          onClick={salir}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900">Convivencia Familiar 2026</h1>
        <p className="text-sm text-slate-500">
          Inscripciones registradas. Contiene datos personales: uso exclusivo de coordinación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Familias", stats.familias],
          ["Personas", stats.personas],
          ["Familias con celíacos", stats.celiacos],
          ["Menores sin adulto", stats.menoresSinAdulto],
        ].map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="text-2xl font-black text-slate-900">{n}</p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por DNI o por nombre y apellido…"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todas", "Todas"],
              ["celiacos", "Con celíacos"],
              ["menores-sin-adulto", "Menores sin adulto"],
              ["salud", "Con obs. de salud"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFiltro(val)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                filtro === val
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
            aria-label="Filtrar por etapa"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          >
            <option value="">Todas las etapas</option>
            {CONVIVENCIA_ETAPAS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-400">
          Mostrando {filtradas.length} de {inscripciones.length} inscripciones.
        </p>
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {inscripciones.length === 0
            ? "Todavía no hay inscripciones registradas."
            : "No hay inscripciones que coincidan con la búsqueda."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((i) => {
            const titular = i.convivencia_integrantes.find((m) => m.es_titular);
            return (
              <li key={i.id} className="rounded-2xl border border-slate-200 bg-white shadow-xs">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {titular ? `${titular.apellido}, ${titular.nombre}` : "Inscripción"}
                        <span className="ml-2 text-xs font-medium text-slate-400">
                          #{i.id.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {fmtFecha.format(new Date(i.created_at))} ·{" "}
                        {i.convivencia_integrantes.length}{" "}
                        {i.convivencia_integrantes.length === 1 ? "persona" : "personas"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {i.hay_celiaco && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          <Wheat className="h-3 w-3" /> Celíaco
                        </span>
                      )}
                      {tieneMenorSinAdulto(i) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                          <AlertTriangle className="h-3 w-3" /> Menor sin adulto
                        </span>
                      )}
                      {tieneSalud(i) && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                          Obs. de salud
                        </span>
                      )}
                      {i.convivencia_integrantes.some((m) => dnisRepetidos.has(m.dni)) && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800">
                          DNI repetido
                        </span>
                      )}
                    </div>
                  </summary>

                  <div className="space-y-2 border-t border-slate-100 p-4">
                    <p className="text-xs text-slate-500">
                      ¿Hay celíacos en la familia?{" "}
                      <strong className="text-slate-800">{i.hay_celiaco ? "Sí" : "No"}</strong>
                    </p>
                    {i.convivencia_integrantes.map((m) => (
                      <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                        <p className="font-bold text-slate-900">
                          {m.apellido}, {m.nombre}{" "}
                          {m.es_titular && (
                            <span className="ml-1 rounded bg-sky-600 px-1.5 py-0.5 text-[10px] text-white">
                              TITULAR
                            </span>
                          )}
                        </p>
                        <p>
                          DNI {m.dni}
                          {dnisRepetidos.has(m.dni) && (
                            <span className="ml-1 font-bold text-violet-700">(repetido en otra inscripción)</span>
                          )}{" "}
                          · {m.edad} años · {m.es_titular ? "Titular" : `Parentesco: ${m.parentesco}`} ·{" "}
                          {m.etapa ?? "No pertenece a CAMREVOC"}
                        </p>
                        {m.observaciones_salud && (
                          <p className="mt-1">
                            <strong>Salud:</strong> {m.observaciones_salud}
                          </p>
                        )}
                        {m.menor_acompanado !== null && (
                          <p className={`mt-1 ${m.menor_acompanado ? "" : "font-bold text-rose-700"}`}>
                            Menor {m.menor_acompanado ? "acompañado por un adulto de su familia" : "SIN adulto de su familia (debe presentar autorización firmada)"}
                          </p>
                        )}
                        {m.emergencia_nombre && (
                          <p className="mt-1">
                            <strong>Emergencia:</strong> {m.emergencia_nombre} ({m.emergencia_vinculo}) ·{" "}
                            {m.emergencia_telefono}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
