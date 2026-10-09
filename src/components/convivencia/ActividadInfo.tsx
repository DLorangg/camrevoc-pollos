import { CalendarDays, Clock, MapPin, Banknote, Backpack } from "lucide-react";
import {
  CONVIVENCIA_CONFIG,
  CONVIVENCIA_QUE_LLEVAR,
  CONVIVENCIA_TARIFA_TEXTO,
} from "@/config/convivencia";

const ARS = new Intl.NumberFormat("es-AR");

export function formatearPrecioConvivencia(monto: number): string {
  return `$${ARS.format(monto)}`;
}

/** Datos de la actividad (fecha, horario, lugar, costo y pago). Sin hooks: usable en servidor y cliente. */
export function ConvivenciaDatosActividad() {
  return (
    <ul className="space-y-3 text-sm text-slate-700">
      <li className="flex items-start gap-3">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <span>
          <strong className="text-slate-900">Fecha:</strong> {CONVIVENCIA_CONFIG.fechaTexto}
        </span>
      </li>
      <li className="flex items-start gap-3">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <span>
          <strong className="text-slate-900">Horario:</strong> {CONVIVENCIA_CONFIG.horarioTexto}
        </span>
      </li>
      <li className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <span>
          <strong className="text-slate-900">Lugar:</strong> {CONVIVENCIA_CONFIG.lugarNombre},{" "}
          {CONVIVENCIA_CONFIG.lugarDireccion}
        </span>
      </li>
      <li className="flex items-start gap-3">
        <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <span>
          <strong className="text-slate-900">Costo:</strong> {CONVIVENCIA_TARIFA_TEXTO}{" "}
          {CONVIVENCIA_CONFIG.pagoTexto}
        </span>
      </li>
    </ul>
  );
}

/** Lista de elementos que hay que llevar. */
export function ConvivenciaQueLlevar() {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
        <Backpack className="h-4 w-4 text-sky-600" />
        ¿Qué hay que llevar?
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {CONVIVENCIA_QUE_LLEVAR.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
