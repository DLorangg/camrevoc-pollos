"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, KeyRound, Loader2, AlertCircle, PlusCircle, Check } from "lucide-react";
import { loginCoordinador, obtenerCoordinadoresEtapa } from "@/app/campamento/actions/coordinacion-auth";
import { COORDINADORES_POR_ETAPA } from "@/config/campamento-coordinadores";

export default function CoordinacionLoginForm() {
  const router = useRouter();
  const [etapa, setEtapa] = useState("1");
  const [coordinador, setCoordinador] = useState("");
  const [esOtroNombre, setEsOtroNombre] = useState(false);
  const [coordinadoresGuardados, setCoordinadoresGuardados] = useState<string[]>([]);
  const [cargandoCoords, setCargandoCoords] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cargar coordinadores guardados al cambiar de etapa
  useEffect(() => {
    let activo = true;
    setCargandoCoords(true);
    setCoordinador("");
    setEsOtroNombre(false);

    obtenerCoordinadoresEtapa(etapa)
      .then((coords) => {
        if (!activo) return;
        setCoordinadoresGuardados(coords);
        if (coords.length === 0) {
          setEsOtroNombre(true);
        }
      })
      .catch((err) => {
        console.error("Error cargando coordinadores:", err);
        if (activo) setEsOtroNombre(true);
      })
      .finally(() => {
        if (activo) setCargandoCoords(false);
      });

    return () => {
      activo = false;
    };
  }, [etapa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await loginCoordinador(etapa, coordinador, pin);
      if (res.ok && res.etapaNum) {
        router.push(`/campamento/etapa/${res.etapaNum}`);
        router.refresh();
      } else {
        setError(res.error || "Datos incorrectos.");
      }
    });
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-7 py-9 shadow-xl shadow-slate-200/50">
        {/* Header logos & título */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs">
            <Image
              src="/logo.png"
              alt="Logo CamReVoc"
              width={60}
              height={60}
              className="h-14 w-14 object-contain rounded-xl"
              priority
            />
          </div>
          <div>
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Portal de Coordinación
            </span>
            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Campamentos 2027 ⛺
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Ingreso exclusivo para coordinadores de etapa
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Etapa */}
          <div>
            <label htmlFor="etapa-select" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Etapa que coordinás
            </label>
            <select
              id="etapa-select"
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50 cursor-pointer"
            >
              {Object.entries(COORDINADORES_POR_ETAPA).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.nombreEtapa}
                </option>
              ))}
            </select>
          </div>

          {/* Coordinador/a */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Tu Nombre / Coordinador/a
            </label>

            {cargandoCoords ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Cargando coordinadores de la etapa…</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Si ya hay coordinadores guardados y no eligió escribir otro nombre */}
                {coordinadoresGuardados.length > 0 && !esOtroNombre && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {coordinadoresGuardados.map((nombre) => {
                        const seleccionado = coordinador === nombre;
                        return (
                          <button
                            key={nombre}
                            type="button"
                            onClick={() => setCoordinador(nombre)}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                              seleccionado
                                ? "border-[#009B4D] bg-[#009B4D]/10 text-[#009B4D] ring-2 ring-[#009B4D]/20 shadow-2xs"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                            }`}
                          >
                            {seleccionado && <Check className="h-3.5 w-3.5 text-[#009B4D]" />}
                            <span>{nombre}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEsOtroNombre(true);
                        setCoordinador("");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline pt-1 cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Ingresar otro nombre</span>
                    </button>
                  </div>
                )}

                {/* Si debe o eligió escribir su nombre */}
                {(coordinadoresGuardados.length === 0 || esOtroNombre) && (
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="coord-name"
                        type="text"
                        required
                        value={coordinador}
                        onChange={(e) => setCoordinador(e.target.value)}
                        placeholder="Escribí tu nombre (ej: Sofi G.)"
                        disabled={isPending}
                        autoFocus={esOtroNombre}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
                      />
                    </div>

                    {coordinadoresGuardados.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEsOtroNombre(false);
                          setCoordinador("");
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        ← Volver a la lista de coordinadores
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PIN */}
          <div>
            <label htmlFor="pin-input" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              PIN de la etapa
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="pin-input"
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm font-mono text-slate-900 shadow-2xs focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={isPending || !coordinador.trim() || !pin.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#009B4D] py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-[#007a3d] disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingresando…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Acceder al Panel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

