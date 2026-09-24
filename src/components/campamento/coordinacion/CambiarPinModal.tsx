"use client";

import { useState, useTransition } from "react";
import { X, KeyRound, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { actualizarPinEtapa } from "@/app/campamento/actions/coordinacion-auth";

interface CambiarPinModalProps {
  etapaNombre: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CambiarPinModal({
  etapaNombre,
  onClose,
  onSuccess,
}: CambiarPinModalProps) {
  const [pinActual, setPinActual] = useState("");
  const [nuevoPin, setNuevoPin] = useState("");
  const [confirmarPin, setConfirmarPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (nuevoPin.length < 6) {
      setError("El nuevo PIN debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevoPin !== confirmarPin) {
      setError("El nuevo PIN y su confirmación no coinciden.");
      return;
    }

    startTransition(async () => {
      const res = await actualizarPinEtapa(pinActual, nuevoPin, confirmarPin);
      if (res.ok) {
        setExito(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(res.error || "Ocurrió un error al actualizar el PIN.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Cambiar PIN de Acceso
              </h2>
              <p className="text-xs text-slate-500">{etapaNombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* PIN Actual */}
          <div>
            <label
              htmlFor="pin-actual"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              PIN actual *
            </label>
            <input
              id="pin-actual"
              type="password"
              required
              value={pinActual}
              onChange={(e) => setPinActual(e.target.value)}
              placeholder="Ingresá la contraseña actual"
              disabled={isPending || exito}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm font-mono text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:bg-slate-50"
            />
          </div>

          {/* Nuevo PIN */}
          <div>
            <label
              htmlFor="nuevo-pin"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Nuevo PIN (mínimo 6 caracteres) *
            </label>
            <input
              id="nuevo-pin"
              type="password"
              required
              minLength={6}
              value={nuevoPin}
              onChange={(e) => setNuevoPin(e.target.value)}
              placeholder="••••••••"
              disabled={isPending || exito}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm font-mono text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:bg-slate-50"
            />
          </div>

          {/* Confirmar Nuevo PIN */}
          <div>
            <label
              htmlFor="confirmar-pin"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Confirmar nuevo PIN *
            </label>
            <input
              id="confirmar-pin"
              type="password"
              required
              minLength={6}
              value={confirmarPin}
              onChange={(e) => setConfirmarPin(e.target.value)}
              placeholder="••••••••"
              disabled={isPending || exito}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3.5 text-sm font-mono text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:bg-slate-50"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-[11px] text-amber-900 leading-relaxed">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <span>
              Anotá bien la nueva clave y compartila únicamente con los demás
              coordinadores de tu etapa.
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {exito && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-100 p-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>¡PIN actualizado con éxito!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending || exito}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || exito || !pinActual || !nuevoPin || !confirmarPin}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Actualizando…
                </>
              ) : (
                "Guardar nuevo PIN"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
