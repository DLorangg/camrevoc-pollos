"use client";

import { useState } from "react";
import { Info, Truck, Tent, ChevronDown, ChevronUp } from "lucide-react";
import BankCardCampamento from "@/components/campamento/BankCardCampamento";

export default function InfoCampamentoCard() {
  const [abierto, setAbierto] = useState(true);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Encabezado colapsable */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between p-6 sm:px-8 text-left transition-colors hover:bg-slate-50/80 cursor-pointer"
        aria-expanded={abierto}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Información de los Campamentos 2027
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Fechas, destinos, tarifas y datos para transferencias
            </p>
          </div>
        </div>
        <div className="ml-4 text-slate-400">
          {abierto ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Contenido */}
      {abierto && (
        <div className="border-t border-slate-100 px-6 pb-8 pt-4 sm:px-8 space-y-6">
          {/* Texto introductorio */}
          <div className="space-y-2.5 text-sm text-slate-600 leading-relaxed">
            <p>
              Con este formulario confirmamos la participación de los/as camrevoquistas y guías animadores/as que asistirán a los campamentos de verano 2027.
            </p>
            <p>
              Por favor leer con detenimiento y atención los campos para evitar errores. En caso de familias con más de un/a participante, se deberá completar un formulario individual por cada uno/a.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-base select-none shrink-0">⚠️</span>
              <p>
                <strong>Importante:</strong> Este no es el último formulario previo a los campamentos. Más cerca de la fecha se enviará la ficha médica, autorizaciones y documentación para el seguro.
              </p>
            </div>
          </div>

          {/* Tarjetas de Destinos y Fechas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Junín */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4.5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                    Junín
                  </span>
                  <span className="text-sm font-extrabold text-emerald-900">
                    $550.000
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-emerald-800">
                  1ra, 2da, 3ra, 6ta y 7ma etapa
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Carga de camión:</strong> Martes 19 de enero</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Tent className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Campamento:</strong> Miércoles 20 al Domingo 24 de enero</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
                Tarifa base: $550.000
              </div>
            </div>

            {/* Regina */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4.5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-sky-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                    Regina
                  </span>
                  <span className="text-sm font-extrabold text-sky-900">
                    $200.000
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-sky-800">
                  4ta y 5ta etapa
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                    <span><strong>Carga de camión y salida:</strong> Miércoles 27 de enero</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Tent className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                    <span><strong>Campamento:</strong> Miércoles 27 al Domingo 31 de enero</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-sky-200/60 text-[11px] text-sky-800 font-medium">
                Tarifa base: $200.000
              </div>
            </div>
          </div>

          {/* Información Bancaria para Transferencias */}
          <div className="space-y-4">
            <BankCardCampamento />

            {/* Mensaje de contención */}
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 text-xs text-emerald-950 leading-relaxed">
              💚 <em>&ldquo;Queremos que todos/as puedan participar de su campamento. Frente a cualquier situación particular o dificultad, comunicarse con el/la coordinador/a de la etapa. ¡Los campamentos los hacemos entre todos/as!&rdquo;</em>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
