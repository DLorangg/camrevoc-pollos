"use client";

import { useState, useCallback, useRef } from "react";
import { PRECIO_POLLO, DATOS_BANCARIOS, ETAPAS_SUGERIDAS } from "@/config/constants";
import { createClient } from "@/lib/supabase/client";
import { createOrder, type ValeInput, type ValeCreado } from "@/app/actions/create-order";
import { nanoid } from "nanoid";
import { CheckCircle, Copy, Check, Loader2, Plus, Trash2, X, Share2, AlertCircle } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatARS(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
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
      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:bg-navy-100 border border-navy-200"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "¡Copiado!" : `Copiar ${label}`}
    </button>
  );
}

function BankCard() {
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
        💳 Datos para transferencia
      </h2>
      <div className="space-y-2 text-sm text-gray-700">
        <p>
          <span className="font-medium text-gray-900">Banco:</span>{" "}
          {DATOS_BANCARIOS.banco}
        </p>
        <p>
          <span className="font-medium text-gray-900">Titular:</span>{" "}
          {DATOS_BANCARIOS.titular}
        </p>
        <p>
          <span className="font-medium text-gray-900">CUIT:</span>{" "}
          {DATOS_BANCARIOS.cuit}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div>
            <span className="font-medium text-gray-900">CBU:</span>{" "}
            <span className="font-mono text-xs">{DATOS_BANCARIOS.cbu}</span>
          </div>
          <CopyButton value={DATOS_BANCARIOS.cbu} label="CBU" />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div>
            <span className="font-medium text-gray-900">Alias:</span>{" "}
            <span className="font-mono">{DATOS_BANCARIOS.alias}</span>
          </div>
          <CopyButton value={DATOS_BANCARIOS.alias} label="Alias" />
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
}: {
  totalPollos: number;
  nombreComprador: string;
  vales: ValeRow[];
  onChange: (v: ValeRow[]) => void;
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

  if (!expanded) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
        <p className="mb-2 text-sm text-gray-600">
          Se generará <strong>1 vale</strong> por los {totalPollos} pollo
          {totalPollos !== 1 ? "s" : ""} a nombre de{" "}
          <strong>{nombreComprador || "vos"}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
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
        <h3 className="text-sm font-semibold text-gray-800">Distribución de vales</h3>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            // Reset to single vale
            onChange([
              {
                id: nanoid(6),
                cantidad_pollos: totalPollos,
                destinatario: nombreComprador,
              },
            ]);
          }}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Volver a 1 solo vale
        </button>
      </div>

      {/* Balance indicator */}
      {diferencia !== 0 && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            diferencia > 0
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {diferencia > 0
            ? `Faltan asignar ${diferencia} pollo${diferencia !== 1 ? "s" : ""}`
            : `Asignaste ${Math.abs(diferencia)} pollo${Math.abs(diferencia) !== 1 ? "s" : ""} de más`}
        </div>
      )}
      {diferencia === 0 && sumaActual > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <Check className="h-4 w-4 flex-shrink-0" />
          ¡La distribución está completa!
        </div>
      )}

      <div className="space-y-2">
        {vales.map((vale, idx) => (
          <div key={vale.id} className="flex gap-2 rounded-xl border border-gray-200 bg-white p-3">
            <span className="mt-2.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {idx + 1}
            </span>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Pollos</label>
                <input
                  type="number"
                  min={1}
                  value={vale.cantidad_pollos}
                  onChange={(e) =>
                    updateVale(vale.id, "cantidad_pollos", Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  ¿A nombre de quién retira?
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tío Juan"
                  value={vale.destinatario}
                  onChange={(e) => updateVale(vale.id, "destinatario", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            {vales.length > 1 && (
              <button
                type="button"
                onClick={() => removeVale(vale.id)}
                className="mt-2 self-start rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
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
            className="relative flex h-20 w-20 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
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
                <span className="mt-1 line-clamp-2 text-[10px] text-gray-600">{file.name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-0.5 top-0.5 rounded-full bg-white/80 p-0.5 text-gray-600 backdrop-blur hover:text-red-500 shadow"
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
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">¡Pedido recibido con éxito!</h2>
        <p className="mt-2 text-gray-600 max-w-md mx-auto">
          Estamos revisando tu transferencia. Apenas la confirmemos, te enviaremos los vales
          definitivos a{" "}
          <span className="font-medium text-blue-700">{email}</span>.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <h3 className="text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
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
                  <p className="text-sm text-gray-700">
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

// ─── Input + Label helper ─────────────────────────────────────────────────────

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
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100";

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

  // ── Sync single vale when cantidad changes (if not expanded) ────────────────
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

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevos = Array.from(e.target.files ?? []);
    const combined = [...archivos, ...nuevos].slice(0, 4);
    setArchivos(combined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ────────────────────────────────────────────────────────────────
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
    if (!etapa.trim()) errs.etapa = "La etapa es obligatoria.";
    if (!animadorVendedor.trim()) errs.animador_vendedor = "El animador/vendedor es obligatorio.";
    if (cantidadTotal < 1) errs.cantidad_total = "Mínimo 1 pollo.";
    if (archivos.length === 0)
      errs.comprobantes = "Adjuntá al menos un comprobante de pago.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Vale validation ───────────────────────────────────────────────────────────
  const sumaVales = vales.reduce((s, v) => s + (v.cantidad_pollos || 0), 0);
  const valesBalanced = sumaVales === cantidadTotal;

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) return;
    if (!valesBalanced) {
      setGlobalError(
        "La distribución de vales no coincide con el total de pollos.",
      );
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();

      // Upload comprobantes
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

      // Submit order
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

      if (!result.ok) {
        throw new Error(result.error);
      }

      setSuccessData({ vales: result.vales, email });
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado.",
      );
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  const isBusy = uploading || submitting;

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (successData) {
    return <SuccessScreen vales={successData.vales} email={successData.email} />;
  }

  // ─── Form ────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Bank data */}
      <BankCard />

      {/* Buyer data */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">🧑 Tus datos</h2>

        <Field label="Nombre y Apellido" required error={errors.nombre_comprador}>
          <input
            type="text"
            placeholder="Ej: María González"
            value={nombreComprador}
            onChange={(e) => handleNombreChange(e.target.value)}
            disabled={isBusy}
            className={inputClass}
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
              className={inputClass}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isBusy}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Etapa" required error={errors.etapa}>
            <input
              type="text"
              placeholder="Ej: Caminantes"
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              list="etapas-list"
              disabled={isBusy}
              className={inputClass}
            />
            <datalist id="etapas-list">
              {ETAPAS_SUGERIDAS.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </Field>
          <Field label="Animador / Vendedor" required error={errors.animador_vendedor}>
            <input
              type="text"
              placeholder="Nombre de quien te vendió"
              value={animadorVendedor}
              onChange={(e) => setAnimadorVendedor(e.target.value)}
              disabled={isBusy}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Quantity */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">🐔 Tu pedido</h2>

        <Field label="Cantidad de pollos" required error={errors.cantidad_total}>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={cantidadTotal}
              onChange={(e) => handleCantidadChange(parseInt(e.target.value) || 1)}
              disabled={isBusy}
              className={`${inputClass} w-28 text-center`}
            />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-blue-800">
                {formatARS(cantidadTotal * PRECIO_POLLO)}
              </span>
              <span className="text-xs text-gray-500">
                {formatARS(PRECIO_POLLO)} c/u
              </span>
            </div>
          </div>
        </Field>
      </section>

      {/* Vales distributor */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">🎟️ Distribución de vales</h2>
        <ValesDistributor
          totalPollos={cantidadTotal}
          nombreComprador={nombreComprador}
          vales={vales}
          onChange={setVales}
        />
      </section>

      {/* File upload */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">📎 Comprobante de pago</h2>
        <p className="text-xs text-gray-500">
          Adjuntá hasta 4 archivos (imagen PNG, JPG, WEBP o PDF).
        </p>

        <Field label="" error={errors.comprobantes}>
          <div
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Seleccioná archivos</span> o arrastralos
              acá
            </p>
            <p className="mt-1 text-xs text-gray-400">
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
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {globalError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isBusy || !valesBalanced}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-base font-semibold text-white shadow-md transition-all hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
