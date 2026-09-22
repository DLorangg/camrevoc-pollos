"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarEntrega } from "@/app/actions/vale-actions";
import { Loader2, CheckCircle } from "lucide-react";

export default function ConfirmarEntregaButton({ valeId }: { valeId: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConfirm = () => {
    if (done || isPending) return;
    startTransition(async () => {
      const result = await confirmarEntrega(valeId);
      if (result.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(result.error ?? "Error al confirmar.");
      }
    });
  };

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/20 px-6 py-4 text-white">
        <CheckCircle className="h-6 w-6" />
        <span className="text-lg font-bold">¡Entrega registrada!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full rounded-2xl bg-white py-5 text-xl font-extrabold text-[#009B4D] shadow-lg transition-transform active:scale-95 disabled:opacity-70"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            Confirmando…
          </span>
        ) : (
          "✅ CONFIRMAR ENTREGA DE POLLOS"
        )}
      </button>
      {error && (
        <p className="text-center text-sm text-white/80 bg-red-600/40 rounded-xl py-2">{error}</p>
      )}
    </div>
  );
}
