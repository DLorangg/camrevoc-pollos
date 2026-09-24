"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { DATOS_BANCARIOS_CAMPAMENTO } from "@/config/campamento";

interface CopyButtonProps {
  value: string;
  label: string;
  highlight?: boolean;
}

function CopyButton({ value, label, highlight }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
        copied
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-xs"
          : "border-slate-300 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
      } ${highlight ? "font-semibold" : ""}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-slate-500" />
      )}
      {copied ? "¡Copiado!" : `Copiar ${label}`}
    </button>
  );
}

export default function BankCardCampamento() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-5 shadow-xs">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-800">
          💳 Datos para transferencia
        </h3>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <p>
              <span className="font-semibold text-slate-900">Banco:</span>{" "}
              {DATOS_BANCARIOS_CAMPAMENTO.banco}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-slate-900">Titular:</span>{" "}
              {DATOS_BANCARIOS_CAMPAMENTO.titular}
            </p>
          </div>
          <p>
            <span className="font-semibold text-slate-900">CUIT:</span>{" "}
            {DATOS_BANCARIOS_CAMPAMENTO.cuit}
          </p>

          {/* CBU row */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-white/70 px-3.5 py-2.5">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                CBU
              </span>
              <span className="font-mono text-xs text-slate-900 sm:text-sm">
                {DATOS_BANCARIOS_CAMPAMENTO.cbu}
              </span>
            </div>
            <CopyButton value={DATOS_BANCARIOS_CAMPAMENTO.cbu} label="CBU" />
          </div>

          {/* Alias row — destacado */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-white px-3.5 py-3 shadow-xs">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                🏷️ Alias (recomendado)
              </span>
              <span className="font-mono text-base font-extrabold tracking-wider text-emerald-950 sm:text-lg">
                {DATOS_BANCARIOS_CAMPAMENTO.alias}
              </span>
            </div>
            <CopyButton
              value={DATOS_BANCARIOS_CAMPAMENTO.alias}
              label="Alias"
              highlight
            />
          </div>

          {/* Motivo / Referencia row */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-white/70 px-3.5 py-2.5">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                Motivo / Referencia (opcional)
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 sm:text-sm">
                {DATOS_BANCARIOS_CAMPAMENTO.motivo}
              </span>
            </div>
            <CopyButton
              value={DATOS_BANCARIOS_CAMPAMENTO.motivo}
              label="Motivo"
            />
          </div>
        </div>
      </div>

      {/* Leyenda aclaratoria */}
      <p className="text-xs text-slate-500 leading-relaxed px-1">
        Recordá que una vez realizada la transferencia, debés enviarle el
        comprobante al coordinador/a de tu etapa por WhatsApp.
      </p>
    </div>
  );
}
