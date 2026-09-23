"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/app/actions/admin-auth";
import { Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAdmin(password);
      if (result.ok) {
        const searchParams = new URLSearchParams(window.location.search);
        const from = searchParams.get("from");
        const destination =
          from && from.startsWith("/admin") && !from.startsWith("/admin/login")
            ? from
            : "/admin";
        router.push(destination);
        router.refresh();
      } else {
        setError(result.error ?? "Error de autenticación.");
      }
    });
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-slate-200/50">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image
            src="/pollos/logo.png"
            alt="Logo Camrevoc"
            width={72}
            height={72}
            className="rounded-2xl shadow-md"
            priority
          />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Panel de Administración
            </p>
            <h1 className="text-xl font-extrabold text-slate-900">Camrevoc</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Contraseña maestra
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                disabled={isPending}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009B4D] py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-[#007a3d] disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando…
              </>
            ) : (
              "Ingresar al panel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
