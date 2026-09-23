"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { setOperator, logoutAdmin } from "@/app/actions/admin-auth";
import { Loader2, User, ArrowRight } from "lucide-react";

export const PREDEFINED_OPERATORS = ["Damián", "Pepo", "Facu", "Otro"] as const;
export type PredefinedOperator = (typeof PREDEFINED_OPERATORS)[number];

export default function OperatorSelector() {
  const [selected, setSelected] = useState<PredefinedOperator | null>(null);
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const customInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Enfocar el input cuando se elige "Otro"
  useEffect(() => {
    if (selected === "Otro") {
      customInputRef.current?.focus();
    }
  }, [selected]);

  const handleSelect = (op: PredefinedOperator) => {
    setSelected(op);
    setError(null);
    if (op !== "Otro") {
      setCustomName("");
    }
  };

  const handleConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selected) return;

    const finalName = selected === "Otro" ? customName.trim() : selected;

    if (!finalName || finalName.length < 2) {
      setError("Por favor ingresá un nombre válido (mínimo 2 letras).");
      customInputRef.current?.focus();
      return;
    }

    startTransition(async () => {
      const result = await setOperator(finalName);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "No se pudo guardar el operador.");
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
      router.push("/admin/login");
    });
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Image
            src="/pollos/logo.png"
            alt="Logo Camrevoc"
            width={64}
            height={64}
            className="rounded-2xl shadow-md"
          />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Panel de Administración
            </p>
            <h1 className="text-lg font-bold text-slate-900">¿Quién está operando?</h1>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PREDEFINED_OPERATORS.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => handleSelect(op)}
                className={`rounded-2xl border-2 py-3 text-sm font-semibold transition-all ${
                  selected === op
                    ? "border-[#009B4D] bg-[#009B4D] text-white shadow-xs"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          {/* Desplegable de nombre personalizado cuando elige "Otro" */}
          {selected === "Otro" && (
            <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <label
                htmlFor="custom-name"
                className="block text-xs font-semibold text-slate-700"
              >
                Ingresá tu nombre
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={customInputRef}
                  id="custom-name"
                  type="text"
                  placeholder="Ej: Lucas, Nico, etc."
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    setError(null);
                  }}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!selected || (selected === "Otro" && !customName.trim()) || isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009B4D] py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-[#007a3d] active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Continuar al panel</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
