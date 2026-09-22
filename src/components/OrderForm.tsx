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
  highlight,
}: {
  value: string;
  label: string;
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
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        copied
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
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

// ─── BankCard ─────────────────────────────────────────────────────────────────

function BankCard() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-800">
        💳 Datos para transferencia
      </h2>
      <div className="space-y-3 text-sm text-slate-700">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <p>
            <span className="font-semibold text-slate-900">Banco:</span>{" "}
            {DATOS_BANCARIOS.banco}
          </p>
          <p className="sm:col-span-2">
            <span className="font-semibold text-slate-900">Titular:</span>{" "}
            {DATOS_BANCARIOS.titular}
          </p>
        </div>
        <p>
          <span className="font-semibold text-slate-900">CUIT:</span>{" "}
          {DATOS_BANCARIOS.cuit}
        </p>

        {/* CBU row */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-white/70 px-3.5 py-2.5">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              CBU
            </span>
            <span className="font-mono text-xs text-slate-900 sm:text-sm">
              {DATOS_BANCARIOS.cbu}
            </span>
          </div>
          <CopyButton value={DATOS_BANCARIOS.cbu} label="CBU" />
        </div>

        {/* Alias row — destacado */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-white px-3.5 py-3 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              🏷️ Alias (recomendado)
            </span>
            <span className="font-mono text-base font-extrabold tracking-wider text-emerald-950 sm:text-lg">
              {DATOS_BANCARIOS.alias}
            </span>
          </div>
          <CopyButton value={DATOS_BANCARIOS.alias} label="Alias" highlight />
        </div>

        {/* Motivo sugerido */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-white/70 px-3.5 py-2.5">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              Motivo / Referencia (opcional)
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 sm:text-sm">
              {DATOS_BANCARIOS.motivo}
            </span>
          </div>
          <CopyButton value={DATOS_BANCARIOS.motivo} label="Motivo" />
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
  isBusy,
}: {
  totalPollos: number;
  nombreComprador: string;
  vales: ValeRow[];
  onChange: (v: ValeRow[]) => void;
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

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder-slate-400 focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50";

  if (!expanded) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
        <p className="mb-2 text-sm text-slate-700">
          Se generará <strong>1 vale</strong> por los {totalPollos} pollo
          {totalPollos !== 1 ? "s" : ""} a nombre de{" "}
          <strong>{nombreComprador || "vos"}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#009B4D] hover:text-[#007a3d]"
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
        <h3 className="text-sm font-semibold text-slate-900">Distribución de vales</h3>
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
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          Volver a 1 solo vale
        </button>
      </div>

      {/* Balance indicator */}
      {diferencia !== 0 && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm ${
            diferencia > 0
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {diferencia > 0
            ? `Faltan asignar ${diferencia} pollo${diferencia !== 1 ? "s" : ""}`
            : `Asignaste ${Math.abs(diferencia)} pollo${Math.abs(diferencia) !== 1 ? "s" : ""} de más`}
        </div>
      )}
      {diferencia === 0 && sumaActual > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm text-emerald-800">
          <Check className="h-4 w-4 flex-shrink-0" />
          ¡La distribución está completa!
        </div>
      )}

      <div className="space-y-2">
        {vales.map((vale, idx) => (
          <div
            key={vale.id}
            className="flex gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
          >
            <span className="mt-2.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
              {idx + 1}
            </span>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Pollos</label>
                <input
                  type="number"
                  min={1}
                  value={vale.cantidad_pollos}
                  onChange={(e) =>
                    updateVale(vale.id, "cantidad_pollos", Math.max(1, parseInt(e.target.value) || 1))
                  }
                  disabled={isBusy}
                  className={`${inputCls} w-20 text-center font-semibold`}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
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
                className="mt-2 self-start rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                title="Eliminar vale"
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 py-2.5 text-sm font-semibold text-[#009B4D] hover:bg-emerald-50/50 transition-colors"
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
    <div className="flex flex-wrap gap-2 pt-1">
      {files.map((file, i) => {
        const isImage = file.type.startsWith("image/");
        const url = isImage ? URL.createObjectURL(file) : null;

        return (
          <div
            key={i}
            className="relative flex h-20 w-20 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs"
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
              className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-slate-600 backdrop-blur hover:text-rose-600 shadow"
              title="Quitar comprobante"
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
}: {
  vales: ValeCreado[];
  email: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-xs">
        <CheckCircle className="h-10 w-10 text-[#009B4D]" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">¡Pedido recibido con éxito!</h2>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Estamos revisando tu transferencia. Apenas la confirmemos, te enviaremos los vales
          definitivos a{" "}
          <span className="font-semibold text-slate-900">{email}</span>.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3 pt-2">
        <h3 className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
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
              className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-left shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-extrabold tracking-wider text-emerald-900">
                    {vale.codigo}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold text-slate-900">{vale.cantidad_pollos}</span> pollo
                    {vale.cantidad_pollos !== 1 ? "s" : ""}
                    {vale.destinatario && (
                      <>
                        {" "}· Retira{" "}
                        <span className="font-semibold text-slate-900">{vale.destinatario}</span>
                      </>
                    )}
                  </p>
                </div>
                <a
                  href={`https://wa.me/?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-[#009B4D] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#007a3d] transition-colors"
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
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ emoji, label }: { emoji: string; label: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
      <span>{emoji}</span>
      {label}
    </h2>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function Divider() {
  return <hr className="border-t border-slate-200" />;
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

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-xs placeholder-slate-400 transition-colors focus:border-[#009B4D] focus:outline-none focus:ring-2 focus:ring-[#009B4D]/20 disabled:bg-slate-50";

export default function OrderForm() {
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

  // ─── Success screen ────────────────────────────────────────────────────────
  if (successData) {
    return <SuccessScreen vales={successData.vales} email={successData.email} />;
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ① TUS DATOS ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading emoji="🧑" label="Tus datos" />

        <Field label="Nombre y Apellido" required error={errors.nombre_comprador}>
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
          <Field label="Teléfono / WhatsApp" required error={errors.whatsapp}>
            <input
              type="tel"
              placeholder="Ej: +54 299 4123456"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={isBusy}
              className={inputCls}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
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
          <Field label="Etapa" required error={errors.etapa}>
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

          <Field label="Animador / Vendedor" required error={errors.animador_vendedor}>
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

      <Divider />

      {/* ② TU PEDIDO Y VALES ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeading emoji="🐔" label="Tu pedido y vales" />

        <Field label="Cantidad de pollos" required error={errors.cantidad_total}>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              value={cantidadTotal}
              onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 1)}
              disabled={isBusy}
              className={`${inputCls} w-28 text-center text-base font-bold`}
            />
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tabular-nums text-slate-900">
                {formatARS(cantidadTotal * PRECIO_POLLO)}
              </span>
              <span className="text-xs text-slate-500">{formatARS(PRECIO_POLLO)} c/u</span>
            </div>
          </div>
        </Field>

        <ValesDistributor
          totalPollos={cantidadTotal}
          nombreComprador={nombreComprador}
          vales={vales}
          onChange={setVales}
          isBusy={isBusy}
        />
      </section>

      <Divider />

      {/* ③ DATOS PARA TRANSFERENCIA ────────────────────────────────────────── */}
      <section>
        <BankCard />
      </section>

      <Divider />

      {/* ④ COMPROBANTE DE PAGO ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeading emoji="📎" label="Comprobante de pago" />
        <p className="text-xs text-slate-500">
          Adjuntá hasta 4 archivos (imagen PNG, JPG, WEBP o PDF).
        </p>

        <Field label="" error={errors.comprobantes}>
          <div
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-[#009B4D] hover:bg-emerald-50/40"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-[#009B4D]">Seleccioná archivos</span> o
              arrastralos acá
            </p>
            <p className="mt-1 text-xs text-slate-400">
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
        <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {globalError}
        </div>
      )}

      {/* ⑤ SUBMIT ─────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isBusy || !valesBalanced}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009B4D] px-6 py-4 text-base font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-[#007a3d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
        <p className="text-center text-xs text-amber-700">
          Corregí la distribución de vales antes de enviar.
        </p>
      )}
    </form>
  );
}
