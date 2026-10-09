"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginConvivenciaAdmin } from "@/app/convivencia/actions/admin-actions";
import { Loader2, Lock, Users, ChevronLeft } from "lucide-react";

export default function ConvivenciaAdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await loginConvivenciaAdmin(password);
      if (res.ok) {
        router.push("/convivencia/admin");
        router.refresh();
      } else {
        setError(res.error || "Contraseña incorrecta.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Link
            href="/"
            title="Volver al inicio"
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-xs transition-transform hover:scale-105"
          >
            <Users className="h-8 w-8" />
          </Link>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
              Coordinación
            </p>
            <h1 className="text-xl font-extrabold text-slate-900">Convivencia Familiar 2026</h1>
            <p className="mt-0.5 text-xs text-slate-500">Inscripciones registradas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Contraseña de Administración
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá la contraseña"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm text-slate-900 shadow-2xs focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !password}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sky-700 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Ingresar al panel</span>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
          <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-slate-600">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Volver al inicio</span>
          </Link>
          <Link href="/convivencia" className="transition-colors hover:text-sky-700">
            Ir a la inscripción →
          </Link>
        </div>
      </div>
    </div>
  );
}
