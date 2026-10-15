"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2, ChevronLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { loginAdminGeneral } from "@/app/campamento/actions/admin-general-auth";

export default function AdminGeneralLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setError("Por favor ingresá la contraseña de administración general.");
      return;
    }

    startTransition(async () => {
      const res = await loginAdminGeneral(trimmed);
      if (res.ok) {
        router.push("/campamento/admin-general");
        router.refresh();
      } else {
        setError(res.error || "Contraseña incorrecta.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Botón Volver */}
      <div className="mx-auto w-full max-w-md mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logos */}
        <div className="mb-5 flex items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/"
            title="Volver al inicio"
            className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs hover:scale-105 transition-transform"
          >
            <Image
              src="/logo.png"
              alt="Logo CamReVoc"
              width={52}
              height={52}
              className="h-12 w-12 object-contain rounded-xl"
              priority
            />
          </Link>
          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
            <Image
              src="/salesianos.png"
              alt="Logo Salesianos"
              width={52}
              height={52}
              className="h-12 w-12 object-contain rounded-xl"
              priority
            />
          </div>
        </div>

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            Panel General · Solo Lectura
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Campamentos 2027
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Nómina unificada, tesorería y auditoría de Junín y Regina
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-xl sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Contraseña General de Coordinación
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá la contraseña…"
                  className="block w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando acceso…</span>
                </>
              ) : (
                <>
                  <span>Ingresar al panel general</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              ¿Sos coordinador de una etapa en particular?{" "}
              <Link
                href="/campamento/coordinacion"
                className="font-bold text-emerald-700 hover:underline"
              >
                Ingresá con tu PIN de etapa
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
