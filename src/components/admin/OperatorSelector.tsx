"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { setOperator, logoutAdmin, type Operator } from "@/app/actions/admin-auth";
import { Loader2 } from "lucide-react";

const OPERATORS: Operator[] = ["Damián", "Pepo", "Facu", "Otro"];

export default function OperatorSelector() {
  const [selected, setSelected] = useState<Operator | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConfirm = () => {
    if (!selected) return;
    startTransition(async () => {
      await setOperator(selected);
      router.refresh();
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
            src="/logo.png"
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

        <div className="grid grid-cols-2 gap-3 mb-6">
          {OPERATORS.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setSelected(op)}
              className={`rounded-2xl border-2 py-3 text-sm font-semibold transition-all ${
                selected === op
                  ? "border-[#009B4D] bg-[#009B4D] text-white shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#009B4D] py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-[#007a3d] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continuar al panel
        </button>

        <button
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
