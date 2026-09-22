"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { confirmarEntrega } from "@/app/actions/vale-actions";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface Props {
  valeId: string;
  codigo: string;
  cantidadPollos: number;
  destinatario: string;
}

export default function ConfirmarEntregaButton({
  valeId,
  codigo,
  cantidadPollos,
  destinatario,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Cerrar con Escape si no está en proceso
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal && !isPending) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, isPending]);

  const handleConfirm = () => {
    if (done || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmarEntrega(valeId, codigo);
      if (result.ok) {
        setDone(true);
        setShowModal(false);
        router.refresh();
      } else {
        setError(result.error ?? "Error al confirmar la entrega.");
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
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="w-full rounded-2xl bg-white py-5 text-xl font-extrabold text-[#009B4D] shadow-lg transition-all active:scale-95 hover:bg-slate-50 disabled:opacity-70 cursor-pointer"
      >
        ✅ CONFIRMAR ENTREGA DE POLLOS
      </button>

      {/* Modal de confirmación en 2 pasos */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) {
              setShowModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-800 text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="h-7 w-7 shrink-0 text-amber-500" />
              <h3 id="modal-title" className="text-lg font-bold text-slate-900 leading-tight">
                ¿Confirmar entrega de pollos?
              </h3>
            </div>

            <div className="space-y-2 text-sm text-slate-600 leading-relaxed mb-6">
              <p className="font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                Atención: Esta acción es irreversible y marcará el vale como utilizado.
              </p>
              <p>
                ¿Confirmás que estás entregando{" "}
                <strong className="text-slate-900">
                  {cantidadPollos} pollo{cantidadPollos !== 1 ? "s" : ""}
                </strong>{" "}
                a <strong className="text-slate-900">{destinatario}</strong>?
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-[#009B4D] py-3 text-sm font-bold text-white shadow-md hover:bg-[#008040] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Confirmando…</span>
                  </>
                ) : (
                  "Sí, confirmar entrega"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
