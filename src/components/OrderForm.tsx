"use client";

import { useState, useCallback, useRef } from "react";
import { PRECIO_POLLO, DATOS_BANCARIOS, ETAPAS } from "@/config/constants";
import { createClient } from "@/lib/supabase/client";
import { createOrder, type ValeInput, type ValeCreado } from "@/app/actions/create-order";
import { nanoid } from "nanoid";
import {
  CheckCircle,
  Copy,
  Check,
  Loader2,
  Plus,
  Trash2,
  X,
  Share2,
  AlertCircle,
} from "lucide-react";

// ─── Theme system ─────────────────────────────────────────────────────────────

export type Theme = "minimal" | "calido" | "dark";

interface ThemeTokens {
  // Page
  pageBg: string;
  // Card (the white container)
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardRounded: string;
  // Section headings
  sectionHeading: string;
  // Labels / body text
  labelText: string;
  bodyText: string;
  mutedText: string;
  // Inputs
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocus: string;
  inputDisabled: string;
  // Primary button
  btnPrimary: string;
  btnPrimaryHover: string;
  btnPrimaryText: string;
  // Accent / copy button
  copyBtn: string;
  copyBtnHover: string;
  copyBtnText: string;
  copyBtnBorder: string;
  // Bank card
  bankCardBg: string;
  bankCardBorder: string;
  bankCardTitle: string;
  bankCardText: string;
  bankCardMono: string;
  // Vale distributor
  valeCollapsedBg: string;
  valeCollapsedBorder: string;
  valeExpandedBg: string;
  valeExpandedBorder: string;
  valeNumBg: string;
  valeNumText: string;
  valeAddBtn: string;
  valeExpandLink: string;
  // File drop zone
  dropZoneBg: string;
  dropZoneBorder: string;
  dropZoneHover: string;
  dropZoneText: string;
  dropZoneAccent: string;
  // Success
  successAccent: string;
  // Footer text
  footerText: string;
  // Header subtitle
  headerSubtitle: string;
}

export const THEMES: Record<Theme, ThemeTokens> = {
  minimal: {
    pageBg: "bg-slate-50",
    cardBg: "bg-white",
    cardBorder: "border border-slate-200",
    cardShadow: "shadow-xl shadow-slate-200/60",
    cardRounded: "rounded-3xl",
    sectionHeading: "text-[#1E293B]",
    labelText: "text-slate-700",
    bodyText: "text-slate-800",
    mutedText: "text-slate-500",
    inputBg: "bg-white",
    inputBorder: "border-slate-300",
    inputText: "text-slate-900",
    inputPlaceholder: "placeholder-slate-400",
    inputFocus: "focus:border-[#009B4D] focus:ring-[#009B4D]/20",
    inputDisabled: "disabled:bg-slate-50",
    btnPrimary: "bg-[#009B4D]",
    btnPrimaryHover: "hover:bg-[#007a3d]",
    btnPrimaryText: "text-white",
    copyBtn: "bg-slate-50",
    copyBtnHover: "hover:bg-[#009B4D]/10",
    copyBtnText: "text-slate-700",
    copyBtnBorder: "border-slate-300",
    bankCardBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    bankCardBorder: "border-emerald-200",
    bankCardTitle: "text-emerald-800",
    bankCardText: "text-slate-700",
    bankCardMono: "text-slate-900",
    valeCollapsedBg: "bg-slate-50",
    valeCollapsedBorder: "border-slate-300",
    valeExpandedBg: "bg-white",
    valeExpandedBorder: "border-slate-200",
    valeNumBg: "bg-emerald-100",
    valeNumText: "text-emerald-800",
    valeAddBtn: "border-[#009B4D]/40 text-[#009B4D] hover:bg-[#009B4D]/5",
    valeExpandLink: "text-[#009B4D] hover:text-[#007a3d]",
    dropZoneBg: "bg-slate-50",
    dropZoneBorder: "border-slate-300",
    dropZoneHover: "hover:border-[#009B4D] hover:bg-emerald-50/50",
    dropZoneText: "text-slate-600",
    dropZoneAccent: "text-[#009B4D]",
    successAccent: "text-[#009B4D]",
    footerText: "text-slate-500",
    headerSubtitle: "text-slate-500",
  },

  calido: {
    pageBg: "bg-[#FBF9F5]",
    cardBg: "bg-white/95",
    cardBorder: "border border-stone-200",
    cardShadow: "shadow-2xl shadow-stone-300/40",
    cardRounded: "rounded-3xl",
    sectionHeading: "text-stone-800",
    labelText: "text-stone-700",
    bodyText: "text-stone-800",
    mutedText: "text-stone-500",
    inputBg: "bg-stone-50",
    inputBorder: "border-stone-300",
    inputText: "text-stone-900",
    inputPlaceholder: "placeholder-stone-400",
    inputFocus: "focus:border-[#E52427] focus:ring-[#E52427]/20",
    inputDisabled: "disabled:bg-stone-100",
    btnPrimary: "bg-[#E52427]",
    btnPrimaryHover: "hover:bg-[#c41f22]",
    btnPrimaryText: "text-white",
    copyBtn: "bg-stone-100",
    copyBtnHover: "hover:bg-[#009B4D]/10",
    copyBtnText: "text-stone-700",
    copyBtnBorder: "border-stone-300",
    bankCardBg: "bg-gradient-to-br from-amber-50 to-orange-50",
    bankCardBorder: "border-amber-200",
    bankCardTitle: "text-amber-800",
    bankCardText: "text-stone-700",
    bankCardMono: "text-stone-900",
    valeCollapsedBg: "bg-stone-50",
    valeCollapsedBorder: "border-stone-300",
    valeExpandedBg: "bg-white",
    valeExpandedBorder: "border-stone-200",
    valeNumBg: "bg-red-100",
    valeNumText: "text-[#E52427]",
    valeAddBtn: "border-[#E52427]/40 text-[#E52427] hover:bg-[#E52427]/5",
    valeExpandLink: "text-[#E52427] hover:text-[#c41f22]",
    dropZoneBg: "bg-stone-50",
    dropZoneBorder: "border-stone-300",
    dropZoneHover: "hover:border-[#009B4D] hover:bg-green-50/50",
    dropZoneText: "text-stone-600",
    dropZoneAccent: "text-[#009B4D]",
    successAccent: "text-[#009B4D]",
    footerText: "text-stone-500",
    headerSubtitle: "text-amber-700",
  },

  dark: {
    pageBg: "bg-[#0B0F17]",
    cardBg: "bg-[#151B28]",
    cardBorder: "border border-slate-800",
    cardShadow: "shadow-2xl shadow-black/60",
    cardRounded: "rounded-3xl",
    sectionHeading: "text-slate-100",
    labelText: "text-slate-300",
    bodyText: "text-slate-200",
    mutedText: "text-slate-500",
    inputBg: "bg-[#1E2635]",
    inputBorder: "border-slate-700",
    inputText: "text-slate-100",
    inputPlaceholder: "placeholder-slate-600",
    inputFocus: "focus:border-emerald-500 focus:ring-emerald-500/20",
    inputDisabled: "disabled:bg-[#1a2030]",
    btnPrimary: "bg-emerald-600",
    btnPrimaryHover: "hover:bg-emerald-500",
    btnPrimaryText: "text-white",
    copyBtn: "bg-slate-800",
    copyBtnHover: "hover:bg-emerald-900/50",
    copyBtnText: "text-slate-300",
    copyBtnBorder: "border-slate-700",
    bankCardBg: "bg-gradient-to-br from-slate-800 to-slate-900",
    bankCardBorder: "border-slate-700",
    bankCardTitle: "text-emerald-400",
    bankCardText: "text-slate-300",
    bankCardMono: "text-slate-100",
    valeCollapsedBg: "bg-[#1E2635]",
    valeCollapsedBorder: "border-slate-700",
    valeExpandedBg: "bg-[#1E2635]",
    valeExpandedBorder: "border-slate-700",
    valeNumBg: "bg-emerald-900/50",
    valeNumText: "text-emerald-400",
    valeAddBtn: "border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/30",
    valeExpandLink: "text-emerald-400 hover:text-emerald-300",
    dropZoneBg: "bg-[#1E2635]",
    dropZoneBorder: "border-slate-700",
    dropZoneHover: "hover:border-emerald-600 hover:bg-emerald-900/20",
    dropZoneText: "text-slate-400",
    dropZoneAccent: "text-emerald-400",
    successAccent: "text-emerald-400",
    footerText: "text-slate-600",
    headerSubtitle: "text-slate-400",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatARS(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({
  value,
  label,
  t,
  highlight,
}: {
  value: string;
  label: string;
  t: ThemeTokens;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
        ${copied ? "border-green-400 bg-green-500/10 text-green-600" : `${t.copyBtn} ${t.copyBtnHover} ${t.copyBtnText} ${t.copyBtnBorder}`}
        ${highlight ? "font-semibold" : ""}
      `}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "¡Copiado!" : `Copiar ${label}`}
    </button>
  );
}

// ─── BankCard ─────────────────────────────────────────────────────────────────

function BankCard({ t }: { t: ThemeTokens }) {
  return (
    <div className={`rounded-2xl border p-5 ${t.bankCardBg} ${t.bankCardBorder}`}>
      <h2 className={`mb-4 text-sm font-bold uppercase tracking-wider ${t.bankCardTitle}`}>
        💳 Datos para transferencia
      </h2>
      <div className={`space-y-2.5 text-sm ${t.bankCardText}`}>
        <p>
          <span className={`font-semibold ${t.bankCardMono}`}>Banco:</span>{" "}
          {DATOS_BANCARIOS.banco}
        </p>
        <p>
          <span className={`font-semibold ${t.bankCardMono}`}>Titular:</span>{" "}
          {DATOS_BANCARIOS.titular}
        </p>
        <p>
          <span className={`font-semibold ${t.bankCardMono}`}>CUIT:</span>{" "}
          {DATOS_BANCARIOS.cuit}
        </p>

        {/* CBU row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
          <div className="flex flex-col">
            <span className={`text-xs font-semibold uppercase tracking-wide ${t.bankCardTitle}`}>
              CBU
            </span>
            <span className={`font-mono text-xs ${t.bankCardMono}`}>{DATOS_BANCARIOS.cbu}</span>
          </div>
          <CopyButton value={DATOS_BANCARIOS.cbu} label="CBU" t={t} />
        </div>

        {/* Alias row — highlighted */}
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 ${t.bankCardBg} ${t.bankCardBorder}`}>
          <div className="flex flex-col">
            <span className={`text-xs font-bold uppercase tracking-wide ${t.bankCardTitle}`}>
              🏷️ Alias (recomendado)
            </span>
            <span className={`font-mono text-lg font-extrabold tracking-widest ${t.bankCardMono}`}>
              {DATOS_BANCARIOS.alias}
            </span>
          </div>
          <CopyButton value={DATOS_BANCARIOS.alias} label="Alias" t={t} highlight />
        </div>
      </div>
    </div>
  );
}

// ─── Vale distributor ─────────────────────────────────────────────────────────

interface ValeRow {
  id: string;
  cantidad_pollos: number;
  destinatario: string;
}

function ValesDistributor({
  totalPollos,
  nombreComprador,
  vales,
  onChange,
  t,
  isBusy,
}: {
  totalPollos: number;
  nombreComprador: string;
  vales: ValeRow[];
  onChange: (v: ValeRow[]) => void;
  t: ThemeTokens;
  isBusy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const sumaActual = vales.reduce((s, v) => s + (v.cantidad_pollos || 0), 0);
  const diferencia = totalPollos - sumaActual;

  const addVale = () => {
    onChange([
      ...vales,
      { id: nanoid(6), cantidad_pollos: Math.max(diferencia, 1), destinatario: "" },
    ]);
  };

  const removeVale = (id: string) => {
    onChange(vales.filter((v) => v.id !== id));
  };

  const updateVale = (id: string, field: keyof Omit<ValeRow, "id">, value: string | number) => {
    onChange(vales.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const inputCls = `w-full rounded-lg border px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2
    ${t.inputBg} ${t.inputBorder} ${t.inputText} ${t.inputFocus} ${t.inputDisabled}`;

  if (!expanded) {
    return (
      <div
        className={`rounded-xl border border-dashed p-4 text-center ${t.valeCollapsedBg} ${t.valeCollapsedBorder}`}
      >
        <p className={`mb-2 text-sm ${t.bodyText}`}>
          Se generará <strong>1 vale</strong> por los {totalPollos} pollo
          {totalPollos !== 1 ? "s" : ""} a nombre de{" "}
          <strong>{nombreComprador || "vos"}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${t.valeExpandLink}`}
        >
          <Plus className="h-4 w-4" />
          Dividir en varios vales / QRs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${t.sectionHeading}`}>Distribución de vales</h3>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            onChange([
              {
                id: nanoid(6),
                cantidad_pollos: totalPollos,
                destinatario: nombreComprador,
              },
            ]);
          }}
          className={`text-xs underline ${t.mutedText} hover:${t.bodyText}`}
        >
          Volver a 1 solo vale
        </button>
      </div>

      {/* Balance indicator */}
      {diferencia !== 0 && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            diferencia > 0
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {diferencia > 0
            ? `Faltan asignar ${diferencia} pollo${diferencia !== 1 ? "s" : ""}`
            : `Asignaste ${Math.abs(diferencia)} pollo${Math.abs(diferencia) !== 1 ? "s" : ""} de más`}
        </div>
      )}
      {diferencia === 0 && sumaActual > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          <Check className="h-4 w-4 flex-shrink-0" />
          ¡La distribución está completa!
        </div>
      )}

      <div className="space-y-2">
        {vales.map((vale, idx) => (
          <div
            key={vale.id}
            className={`flex gap-2 rounded-xl border p-3 ${t.valeExpandedBg} ${t.valeExpandedBorder}`}
          >
            <span
              className={`mt-2.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.valeNumBg} ${t.valeNumText}`}
            >
              {idx + 1}
            </span>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-medium ${t.labelText}`}>Pollos</label>
                <input
                  type="number"
                  min={1}
                  value={vale.cantidad_pollos}
                  onChange={(e) =>
                    updateVale(vale.id, "cantidad_pollos", Math.max(1, parseInt(e.target.value) || 1))
                  }
                  disabled={isBusy}
                  className={`${inputCls} w-20 text-center`}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className={`text-xs font-medium ${t.labelText}`}>
                  ¿A nombre de quién retira?
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tío Juan"
                  value={vale.destinatario}
                  onChange={(e) => updateVale(vale.id, "destinatario", e.target.value)}
                  disabled={isBusy}
                  className={inputCls}
                />
              </div>
            </div>
            {vales.length > 1 && (
              <button
                type="button"
                onClick={() => removeVale(vale.id)}
                className="mt-2 self-start rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addVale}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-sm font-medium transition-colors ${t.valeAddBtn}`}
      >
        <Plus className="h-4 w-4" />
        Agregar otro vale
      </button>
    </div>
  );
}

// ─── File preview ─────────────────────────────────────────────────────────────

function FilePreview({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, i) => {
        const isImage = file.type.startsWith("image/");
        const url = isImage ? URL.createObjectURL(file) : null;

        return (
          <div
            key={i}
            className="relative flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={file.name}
                className="h-full w-full object-cover"
                onLoad={() => URL.revokeObjectURL(url)}
              />
            ) : (
              <div className="flex flex-col items-center p-1 text-center">
                <span className="text-2xl">📄</span>
                <span className="mt-1 line-clamp-2 text-[10px] text-slate-600">{file.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 text-slate-600 backdrop-blur hover:text-red-500 shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  vales,
  email,
  t,
}: {
  vales: ValeCreado[];
  email: string;
  t: ThemeTokens;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h2 className={`text-2xl font-bold ${t.sectionHeading}`}>¡Pedido recibido con éxito!</h2>
        <p className={`mt-2 max-w-md mx-auto ${t.bodyText}`}>
          Estamos revisando tu transferencia. Apenas la confirmemos, te enviaremos los vales
          definitivos a{" "}
          <span className={`font-medium ${t.successAccent}`}>{email}</span>.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <h3 className={`text-left text-sm font-semibold uppercase tracking-wide ${t.mutedText}`}>
          Tus vales generados
        </h3>
        {vales.map((vale) => {
          const valeUrl = `${appUrl}/vale/${vale.codigo}`;
          const waText = encodeURIComponent(
            `¡Hola! 🐔 Te comparto tu vale para retirar ${vale.cantidad_pollos} pollo${
              vale.cantidad_pollos !== 1 ? "s" : ""
            } de Camrevoc.\n\n` +
              (vale.destinatario ? `Retira: *${vale.destinatario}*\n` : "") +
              `Código: *${vale.codigo}*\n\nVer vale: ${valeUrl}`,
          );

          return (
            <div
              key={vale.codigo}
              className="rounded-xl border border-green-200 bg-green-50 p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-bold tracking-wider text-green-800">
                    {vale.codigo}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{vale.cantidad_pollos}</span> pollo
                    {vale.cantidad_pollos !== 1 ? "s" : ""}
                    {vale.destinatario && (
                      <>
                        {" "}· Retira{" "}
                        <span className="font-medium">{vale.destinatario}</span>
                      </>
                    )}
                  </p>
                </div>
                <a
                  href={`https://wa.me/?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Compartir
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  t,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  t: ThemeTokens;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className={`text-sm font-medium ${t.labelText}`}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ emoji, label, t }: { emoji: string; label: string; t: ThemeTokens }) {
  return (
    <h2 className={`flex items-center gap-2 text-base font-bold ${t.sectionHeading}`}>
      <span>{emoji}</span>
      {label}
    </h2>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider({ t }: { t: ThemeTokens }) {
  return <hr className={`border-t ${t.cardBorder}`} />;
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface FormErrors {
  nombre_comprador?: string;
  whatsapp?: string;
  email?: string;
  etapa?: string;
  animador_vendedor?: string;
  cantidad_total?: string;
  comprobantes?: string;
}

export default function OrderForm({ theme }: { theme: Theme }) {
  const t = THEMES[theme];

  // Fields
  const [nombreComprador, setNombreComprador] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [etapa, setEtapa] = useState("");
  const [animadorVendedor, setAnimadorVendedor] = useState("");
  const [cantidadTotal, setCantidadTotal] = useState(1);

  // Vales distribution
  const [vales, setVales] = useState<ValeRow[]>([
    { id: nanoid(6), cantidad_pollos: 1, destinatario: "" },
  ]);

  // File upload
  const [archivos, setArchivos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    vales: ValeCreado[];
    email: string;
  } | null>(null);

  // ── Sync single vale ───────────────────────────────────────────────────────
  const syncSingleVale = useCallback(
    (qty: number, nombre: string) => {
      if (vales.length === 1) {
        setVales([{ ...vales[0], cantidad_pollos: qty, destinatario: nombre }]);
      }
    },
    [vales],
  );

  const handleCantidadChange = (qty: number) => {
    const safeQty = Math.max(1, qty);
    setCantidadTotal(safeQty);
    syncSingleVale(safeQty, nombreComprador);
  };

  const handleNombreChange = (nombre: string) => {
    setNombreComprador(nombre);
    syncSingleVale(cantidadTotal, nombre);
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevos = Array.from(e.target.files ?? []);
    const combined = [...archivos, ...nuevos].slice(0, 4);
    setArchivos(combined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!nombreComprador.trim()) errs.nombre_comprador = "El nombre es obligatorio.";
    if (!whatsapp.trim()) {
      errs.whatsapp = "El teléfono es obligatorio.";
    } else if (!/^\+?[\d\s\-()]{7,20}$/.test(whatsapp.trim())) {
      errs.whatsapp = "Ingresá un número de teléfono válido.";
    }
    if (!email.trim()) {
      errs.email = "El email es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Ingresá un email válido.";
    }
    if (!etapa) errs.etapa = "La etapa es obligatoria.";
    if (!animadorVendedor.trim()) errs.animador_vendedor = "El animador/vendedor es obligatorio.";
    if (cantidadTotal < 1) errs.cantidad_total = "Mínimo 1 pollo.";
    if (archivos.length === 0)
      errs.comprobantes = "Adjuntá al menos un comprobante de pago.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Vale validation ────────────────────────────────────────────────────────
  const sumaVales = vales.reduce((s, v) => s + (v.cantidad_pollos || 0), 0);
  const valesBalanced = sumaVales === cantidadTotal;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) return;
    if (!valesBalanced) {
      setGlobalError("La distribución de vales no coincide con el total de pollos.");
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();

      const urls: string[] = [];
      for (const archivo of archivos) {
        const ext = archivo.name.split(".").pop() ?? "jpg";
        const fileName = `${nanoid()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("comprobantes")
          .upload(fileName, archivo, { upsert: false });

        if (uploadError) {
          throw new Error(`Error al subir ${archivo.name}: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from("comprobantes")
          .getPublicUrl(fileName);

        urls.push(publicData.publicUrl);
      }
      setUploading(false);

      setSubmitting(true);
      const valesInput: ValeInput[] = vales.map((v) => ({
        cantidad_pollos: v.cantidad_pollos,
        destinatario: v.destinatario || nombreComprador,
      }));

      const result = await createOrder({
        nombre_comprador: nombreComprador,
        whatsapp,
        email,
        etapa,
        animador_vendedor: animadorVendedor,
        cantidad_total: cantidadTotal,
        comprobantes_urls: urls,
        vales: valesInput,
      });

      if (!result.ok) throw new Error(result.error);

      setSuccessData({ vales: result.vales, email });
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  const isBusy = uploading || submitting;

  // Shared input class built from theme tokens
  const inputCls = `w-full rounded-xl border px-4 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2
    ${t.inputBg} ${t.inputBorder} ${t.inputText} ${t.inputPlaceholder} ${t.inputFocus} ${t.inputDisabled}`;

  // ─── Success screen ────────────────────────────────────────────────────────
  if (successData) {
    return <SuccessScreen vales={successData.vales} email={successData.email} t={t} />;
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ① TUS DATOS ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading emoji="🧑" label="Tus datos" t={t} />

        <Field label="Nombre y Apellido" required t={t} error={errors.nombre_comprador}>
          <input
            type="text"
            placeholder="Ej: María González"
            value={nombreComprador}
            onChange={(e) => handleNombreChange(e.target.value)}
            disabled={isBusy}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Teléfono / WhatsApp" required t={t} error={errors.whatsapp}>
            <input
              type="tel"
              placeholder="Ej: +54 299 4123456"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={isBusy}
              className={inputCls}
            />
          </Field>
          <Field label="Email" required t={t} error={errors.email}>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isBusy}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Etapa — select cerrado */}
          <Field label="Etapa" required t={t} error={errors.etapa}>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              disabled={isBusy}
              className={inputCls}
            >
              <option value="" disabled>
                Seleccioná tu etapa…
              </option>
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Animador / Vendedor" required t={t} error={errors.animador_vendedor}>
            <input
              type="text"
              placeholder="Nombre de quien te vendió"
              value={animadorVendedor}
              onChange={(e) => setAnimadorVendedor(e.target.value)}
              disabled={isBusy}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      <Divider t={t} />

      {/* ② TU PEDIDO Y VALES ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading emoji="🐔" label="Tu pedido y vales" t={t} />

        <Field label="Cantidad de pollos" required t={t} error={errors.cantidad_total}>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              value={cantidadTotal}
              onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 1)}
              disabled={isBusy}
              className={`${inputCls} w-28 text-center`}
            />
            <div className="flex flex-col">
              <span className={`text-2xl font-extrabold tabular-nums ${t.successAccent}`}>
                {formatARS(cantidadTotal * PRECIO_POLLO)}
              </span>
              <span className={`text-xs ${t.mutedText}`}>{formatARS(PRECIO_POLLO)} c/u</span>
            </div>
          </div>
        </Field>

        <ValesDistributor
          totalPollos={cantidadTotal}
          nombreComprador={nombreComprador}
          vales={vales}
          onChange={setVales}
          t={t}
          isBusy={isBusy}
        />
      </section>

      <Divider t={t} />

      {/* ③ DATOS PARA TRANSFERENCIA ────────────────────────────────────────── */}
      <section>
        <BankCard t={t} />
      </section>

      <Divider t={t} />

      {/* ④ COMPROBANTE DE PAGO ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading emoji="📎" label="Comprobante de pago" t={t} />
        <p className={`text-xs ${t.mutedText}`}>
          Adjuntá hasta 4 archivos (imagen PNG, JPG, WEBP o PDF).
        </p>

        <Field label="" t={t} error={errors.comprobantes}>
          <div
            className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${t.dropZoneBg} ${t.dropZoneBorder} ${t.dropZoneHover}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className={`text-sm ${t.dropZoneText}`}>
              <span className={`font-semibold ${t.dropZoneAccent}`}>Seleccioná archivos</span> o
              arrastralos acá
            </p>
            <p className={`mt-1 text-xs ${t.mutedText}`}>
              {archivos.length}/4 archivos seleccionados
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={archivos.length >= 4 || isBusy}
            />
          </div>
        </Field>

        <FilePreview files={archivos} onRemove={removeFile} />
      </section>

      {/* Global error */}
      {globalError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {globalError}
        </div>
      )}

      {/* ⑤ SUBMIT ─────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isBusy || !valesBalanced}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold shadow-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
          ${t.btnPrimary} ${t.btnPrimaryHover} ${t.btnPrimaryText}`}
      >
        {isBusy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {uploading ? "Subiendo comprobante…" : "Registrando pedido…"}
          </>
        ) : (
          "Enviar pedido →"
        )}
      </button>

      {!valesBalanced && !isBusy && (
        <p className="text-center text-xs text-amber-600">
          Corregí la distribución de vales antes de enviar.
        </p>
      )}
    </form>
  );
}
