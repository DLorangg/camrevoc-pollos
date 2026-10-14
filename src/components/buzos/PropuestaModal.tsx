"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X, Layers, Shirt, CheckCircle2, XCircle } from "lucide-react";

export interface PropuestaModalData {
  titulo: string;
  subtitulo?: string;
  frente?: {
    src: string;
    nombre?: string;
  };
  espalda?: {
    src?: string;
    nombre?: string;
    noCorresponde?: boolean;
  };
  color?: {
    nombre: string;
    hex?: string;
  };
  crvManga?: boolean;
}

export interface PropuestaModalProps {
  data: PropuestaModalData | null;
  onClose: () => void;
}

export default function PropuestaModal({ data, onClose }: PropuestaModalProps) {
  const [tabMovil, setTabMovil] = useState<"frente" | "espalda">("frente");

  // Escuchar la tecla Escape para cerrar
  useEffect(() => {
    if (!data) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data, onClose]);

  // Si no hay datos, no renderizar nada
  if (!data) return null;

  const tieneFrente = Boolean(data.frente?.src);
  const tieneEspalda = Boolean(data.espalda?.src || data.espalda?.noCorresponde);
  const tieneAmbos = tieneFrente && tieneEspalda;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-propuesta-titulo"
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="min-w-0 pr-3">
            <h3 id="modal-propuesta-titulo" className="text-base sm:text-lg font-bold text-white truncate">
              {data.titulo}
            </h3>
            {data.subtitulo && (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {data.subtitulo}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Cerrar vista ampliada"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas solo en celular cuando existen ambas vistas */}
        {tieneAmbos && (
          <div className="flex md:hidden border-b border-slate-800 bg-slate-950/40 p-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTabMovil("frente")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                tabMovil === "frente"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shirt className="h-3.5 w-3.5" />
              <span>Frente</span>
            </button>
            <button
              type="button"
              onClick={() => setTabMovil("espalda")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                tabMovil === "espalda"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Espalda</span>
            </button>
          </div>
        )}

        {/* Contenido / Visor de Imágenes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {tieneAmbos ? (
            /* Ambos lados: 2 columnas en desktop, según pestaña en celular */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Columna Frente */}
              <div
                className={`flex flex-col space-y-2 ${
                  tabMovil === "espalda" ? "hidden md:flex" : "flex"
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300">
                    Frente
                  </span>
                  {data.frente?.nombre && (
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px]">
                      {data.frente.nombre}
                    </span>
                  )}
                </div>
                <div className="relative w-full h-[52vh] md:h-[58vh] rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center overflow-hidden">
                  {data.frente?.src ? (
                    <Image
                      src={data.frente.src}
                      alt={data.frente.nombre || "Frente"}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  ) : null}
                </div>
              </div>

              {/* Columna Espalda */}
              <div
                className={`flex flex-col space-y-2 ${
                  tabMovil === "frente" ? "hidden md:flex" : "flex"
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                    Espalda
                  </span>
                  {data.espalda?.nombre && (
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px]">
                      {data.espalda.nombre}
                    </span>
                  )}
                </div>
                <div className="relative w-full h-[52vh] md:h-[58vh] rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center overflow-hidden">
                  {data.espalda?.noCorresponde ? (
                    <div className="p-6 text-center space-y-2 max-w-xs">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                        <Layers className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-300">
                        No corresponde diseño de espalda
                      </p>
                      <p className="text-[11px] text-slate-500">
                        El diseño de frente seleccionado incluye frase estampada en el frente.
                      </p>
                    </div>
                  ) : data.espalda?.src ? (
                    <Image
                      src={data.espalda.src}
                      alt={data.espalda.nombre || "Espalda"}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : tieneFrente ? (
            /* Vista individual Frente */
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300">
                  Diseño de Frente
                </span>
                {data.frente?.nombre && (
                  <span className="text-xs font-semibold text-slate-300 truncate">
                    {data.frente.nombre}
                  </span>
                )}
              </div>
              <div className="relative w-full h-[58vh] md:h-[64vh] rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center overflow-hidden">
                <Image
                  src={data.frente!.src}
                  alt={data.frente?.nombre || data.titulo}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>
            </div>
          ) : tieneEspalda ? (
            /* Vista individual Espalda */
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                  Diseño de Espalda
                </span>
                {data.espalda?.nombre && (
                  <span className="text-xs font-semibold text-slate-300 truncate">
                    {data.espalda.nombre}
                  </span>
                )}
              </div>
              <div className="relative w-full h-[58vh] md:h-[64vh] rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center overflow-hidden">
                {data.espalda?.src ? (
                  <Image
                    src={data.espalda.src}
                    alt={data.espalda?.nombre || data.titulo}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Pie del Modal con metadatos del voto (si existen) y botón de cierre */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-950/50 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {data.color && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-200">
                {data.color.hex && (
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: data.color.hex }}
                  />
                )}
                <span>Color: {data.color.nombre}</span>
              </span>
            )}

            {data.crvManga !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-200">
                {data.crvManga ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Logo en manga: Sí</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-slate-400" />
                    <span>Logo en manga: No</span>
                  </>
                )}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer self-end"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
