"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ResultadosBuzosAdmin, logoutBuzosAdmin } from "@/app/buzos/actions/admin-actions";
import {
  Shirt,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Palette,
  Layers,
} from "lucide-react";

interface AdminDashboardProps {
  resultados: ResultadosBuzosAdmin;
}

export default function AdminDashboard({ resultados }: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutBuzosAdmin();
      router.push("/buzos/admin/login");
      router.refresh();
    });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Shirt className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Módulo de Administración
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Resultados de Votación Buzos 2027
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cómputo en tiempo real de animadores y coordinadores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-2xs transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* KPI Principal: Total de Votantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de Votantes
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-slate-900">
            {resultados.totalVotantes}
          </p>
          <p className="mt-1 text-xs text-slate-400">DNI únicos registrados</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              CRV en Manga: Sí
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-slate-900">
            {resultados.crvManga.si}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {resultados.crvManga.siPorcentaje}% del total
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              CRV en Manga: No
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-slate-900">
            {resultados.crvManga.no}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {resultados.crvManga.noPorcentaje}% del total
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Frente con Frase
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-slate-900">
            {resultados.atrasNoCorresponde}
          </p>
          <p className="mt-1 text-xs text-slate-400">Omitieron elección de espalda</p>
        </div>
      </div>

      {/* Resultados por Sección */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Resultados Frente */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Frente del Buzo</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {resultados.frente.length} propuestas
            </span>
          </div>

          <div className="space-y-3">
            {resultados.frente.map((f, idx) => (
              <div key={f.id} className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                      {idx + 1}
                    </span>
                    {f.archivo && (
                      <div className="relative h-8 w-8 shrink-0 rounded-md bg-white overflow-hidden border border-slate-200">
                        <Image
                          src={`/Buzos/Delante/${f.archivo}`}
                          alt={f.nombre}
                          fill
                          className="object-contain p-0.5"
                          sizes="32px"
                        />
                      </div>
                    )}
                    <span className="font-bold text-slate-900 truncate">{f.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-extrabold text-purple-700">{f.votos} votos</span>
                    <span className="text-slate-400 text-xs">({f.porcentaje}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${f.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Resultados Atrás (Espalda) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Espalda del Buzo</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {resultados.atras.length} propuestas
            </span>
          </div>

          <div className="space-y-3">
            {resultados.atras.map((a, idx) => (
              <div key={a.id} className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                      {idx + 1}
                    </span>
                    {a.archivo && (
                      <div className="relative h-8 w-8 shrink-0 rounded-md bg-white overflow-hidden border border-slate-200">
                        <Image
                          src={`/Buzos/Atras/${a.archivo}`}
                          alt={a.nombre}
                          fill
                          className="object-contain p-0.5"
                          sizes="32px"
                        />
                      </div>
                    )}
                    <span className="font-bold text-slate-900 truncate">{a.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-extrabold text-purple-700">{a.votos} votos</span>
                    <span className="text-slate-400 text-xs">({a.porcentaje}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${a.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {resultados.atrasNoCorresponde > 0 && (
            <p className="text-[11px] text-slate-400 text-center pt-2">
              * {resultados.atrasNoCorresponde} personas eligieron un frente con frase (la espalda no correspondió).
            </p>
          )}
        </section>

        {/* 3. Resultados Color */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Color Oficial</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">4 colores</span>
          </div>

          <div className="space-y-3">
            {resultados.color.map((c, idx) => (
              <div key={c.id} className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                      {idx + 1}
                    </span>
                    {c.hex ? (
                      <div
                        className="h-7 w-7 shrink-0 rounded-full border border-black/15 shadow-xs"
                        style={{ backgroundColor: c.hex }}
                      />
                    ) : c.archivo ? (
                      <div className="relative h-7 w-7 shrink-0 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                        <Image
                          src={`/Buzos/Colores/${c.archivo}`}
                          alt={c.nombre}
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-slate-900">{c.nombre}</span>
                      {c.hex && (
                        <span className="font-mono text-xs font-semibold text-slate-400">
                          {c.hex}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-extrabold text-purple-700">{c.votos} votos</span>
                    <span className="text-slate-400 text-xs">({c.porcentaje}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${c.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Resumen CRV Manga */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Logo CRV en Manga</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Sí vs. No</span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Sí, incluir logo en la manga
                </span>
                <span className="font-black text-emerald-700">
                  {resultados.crvManga.si} ({resultados.crvManga.siPorcentaje}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-emerald-200/60 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${resultados.crvManga.siPorcentaje}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-slate-500" />
                  No, sin logo en la manga
                </span>
                <span className="font-black text-slate-700">
                  {resultados.crvManga.no} ({resultados.crvManga.noPorcentaje}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-slate-600 rounded-full transition-all duration-300"
                  style={{ width: `${resultados.crvManga.noPorcentaje}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Tabla de Votantes para Auditoría */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Listado de Votos</h2>
            <p className="text-xs text-slate-500">Última actualización por votante</p>
          </div>
          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
            {resultados.votosRecientes.length} registros
          </span>
        </div>

        {resultados.votosRecientes.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">
            Aún no se han registrado votos.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">DNI</th>
                  <th className="py-2.5 px-3">Frente</th>
                  <th className="py-2.5 px-3">Espalda</th>
                  <th className="py-2.5 px-3 text-center">CRV Manga</th>
                  <th className="py-2.5 px-3">Color</th>
                  <th className="py-2.5 px-3 text-right">Última Modif.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {resultados.votosRecientes.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{v.dni}</td>
                    <td className="py-3 px-3">{v.frenteNombre}</td>
                    <td className="py-3 px-3 text-slate-500">{v.atrasNombre}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          v.crvManga
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {v.crvManga ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {v.colorHex && (
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <span>{v.colorNombre}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(v.updatedAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      hs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Navegación al pie */}
      <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600 transition-colors">
          ← Ir a la Home
        </Link>
        <Link href="/buzos" className="hover:text-purple-700 transition-colors">
          Ver pantalla pública de votación →
        </Link>
      </div>
    </div>
  );
}
