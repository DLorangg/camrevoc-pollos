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
        router.push("/admin");
        router.refresh();
      } else {
        setError(result.error ?? "Error de autenticación.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2E3192] to-[#1a1d5e] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-2xl">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo Camrevoc"
            width={72}
            height={72}
            className="rounded-xl"
            priority
          />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Panel de Administración
            </p>
            <h1 className="text-xl font-bold text-[#2E3192]">Camrevoc</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Contraseña maestra
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                disabled={isPending}
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-[#2E3192] focus:outline-none focus:ring-2 focus:ring-[#2E3192]/20 disabled:opacity-60"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E3192] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232577] disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
