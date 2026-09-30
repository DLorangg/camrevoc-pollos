"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  OPCIONES_FRENTE,
  OPCIONES_ATRAS,
  OPCIONES_COLOR,
  getFrenteById,
  getAtrasById,
  getColorById,
} from "@/config/buzos";
import {
  obtenerVotoPorDni,
  registrarVoto,
} from "@/app/buzos/actions/voto-actions";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Maximize2,
  X,
  Vote,
  Clock,
  Sparkles,
  Shirt,
  Info,
} from "lucide-react";

interface VotacionWizardProps {
  votacionAbierta: boolean;
  fechaCierreTexto: string;
}

type PasoVotacion = "DNI" | "FRENTE" | "ATRAS" | "CRV_MANGA" | "COLOR" | "CONFIRMACION" | "EXITO";

export default function VotacionWizard({
  votacionAbierta,
  fechaCierreTexto,
}: VotacionWizardProps) {
  // Estado de navegación
  const [paso, setPaso] = useState<PasoVotacion>("DNI");

  // Estado del formulario
  const [dni, setDni] = useState("");
  const [frenteSeleccionado, setFrenteSeleccionado] = useState<string>("");
  const [atrasSeleccionado, setAtrasSeleccionado] = useState<string>("");
  const [crvManga, setCrvManga] = useState<boolean | null>(null);
  const [colorSeleccionado, setColorSeleccionado] = useState<string>("");

  // Estado de voto previo recuperado
  const [esModificacion, setEsModificacion] = useState(false);

  // Estados de carga y error
  const [isPendingDni, startDniTransition] = useTransition();
  const [isPendingSubmit, startSubmitTransition] = useTransition();
  const [errorDni, setErrorDni] = useState<string | null>(null);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

  // Modal para ver imagen ampliada
  const [imagenModal, setImagenModal] = useState<{ src: string; titulo: string } | null>(null);

  // ─── Helpers de Lógica ───────────────────────────────────────────────────────
  const frenteActual = getFrenteById(frenteSeleccionado);
  const atrasActual = atrasSeleccionado ? getAtrasById(atrasSeleccionado) : undefined;
  const colorActual = getColorById(colorSeleccionado);

  const frenteTieneFrase = frenteActual?.tieneFrase ?? false;

  // ─── Paso DNI: Buscar o Inicializar ──────────────────────────────────────────
  const handleConsultarDni = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDni(null);

    const cleanDni = dni.replace(/\D/g, "").trim();
    if (!cleanDni || cleanDni.length < 7 || cleanDni.length > 9) {
      setErrorDni("Por favor ingresá un DNI válido (entre 7 y 9 números).");
      return;
    }

    startDniTransition(async () => {
      const res = await obtenerVotoPorDni(cleanDni);
      if (!res.ok) {
        setErrorDni(res.error || "Error al consultar el DNI.");
        return;
      }

      if (res.existe && res.voto) {
        setEsModificacion(true);
        setFrenteSeleccionado(res.voto.frente);
        setAtrasSeleccionado(res.voto.atras || "");
        setCrvManga(res.voto.crv_manga);
        setColorSeleccionado(res.voto.color);
      } else {
        setEsModificacion(false);
        // Si no existe voto previo, mantener lo que haya ingresado o limpiar
      }

      setPaso("FRENTE");
    });
  };

  // ─── Navegación entre Pasos ─────────────────────────────────────────────────
  const handleAvanzarDesdeFrente = () => {
    if (!frenteSeleccionado) return;
    if (frenteTieneFrase) {
      // Si el frente tiene frase, se omite el paso de espalda
      setAtrasSeleccionado("");
      setPaso("CRV_MANGA");
    } else {
      setPaso("ATRAS");
    }
  };

  const handleVolverDesdeCrvManga = () => {
    if (frenteTieneFrase) {
      setPaso("FRENTE");
    } else {
      setPaso("ATRAS");
    }
  };

  // ─── Envío Final del Voto ───────────────────────────────────────────────────
  const handleConfirmarVoto = () => {
    setErrorSubmit(null);

    if (!dni || !frenteSeleccionado || crvManga === null || !colorSeleccionado) {
      setErrorSubmit("Por favor completá todas las opciones antes de confirmar.");
      return;
    }

    if (!frenteTieneFrase && !atrasSeleccionado) {
      setErrorSubmit("Debés seleccionar una propuesta para la espalda del buzo.");
      return;
    }

    startSubmitTransition(async () => {
      const res = await registrarVoto({
        dni,
        frente: frenteSeleccionado,
        atras: frenteTieneFrase ? null : atrasSeleccionado,
        crv_manga: crvManga,
        color: colorSeleccionado,
      });

      if (res.ok && res.voto) {
        setPaso("EXITO");
      } else {
        setErrorSubmit(res.error || "Ocurrió un error al registrar el voto.");
      }
    });
  };

  // ─── Si la votación está cerrada ───────────────────────────────────────────
  if (!votacionAbierta) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/50 space-y-4 max-w-xl mx-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <Clock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Votación Finalizada</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          El período de votación oficial para los Buzos 2027 ha concluido.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          Los resultados están siendo procesados por coordinación para enviar a presupuestar el diseño ganador.
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // ─── Render: Pantalla de Éxito ──────────────────────────────────────────────
  if (paso === "EXITO") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-9 text-center shadow-xl shadow-emerald-500/5 space-y-6 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
            {esModificacion ? "¡Voto Actualizado!" : "¡Voto Registrado!"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            ¡Muchas gracias por participar!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Tu voto fue guardado correctamente para el DNI <strong>{dni}</strong>.
          </p>
        </div>

        {/* Resumen de la elección */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 text-left space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resumen de tu elección
          </h3>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Frente:</span>
              <strong className="text-slate-900 text-right">{frenteActual?.nombre}</strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Espalda:</span>
              <strong className="text-slate-900 text-right">
                {frenteTieneFrase ? "No corresponde (frente con frase)" : atrasActual?.nombre}
              </strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">CRV en Manga:</span>
              <strong className="text-slate-900">{crvManga ? "Sí" : "No"}</strong>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Color:</span>
              <strong className="text-slate-900 flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: colorActual?.hex }}
                />
                {colorActual?.nombre}
              </strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900 text-left flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            Podés volver a ingresar con tu DNI para modificar tu voto en cualquier momento antes del cierre oficial ({fechaCierreTexto}).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setPaso("FRENTE")}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Modificar mi voto
          </button>
          <Link
            href="/"
            className="flex-1 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-bold text-white hover:bg-slate-800 text-center cursor-pointer shadow-xs"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // ─── Modal Imagen Ampliada ──────────────────────────────────────────────────
  const renderModalImagen = () => {
    if (!imagenModal) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => setImagenModal(null)}
      >
        <div
          className="relative max-h-[90vh] max-w-2xl w-full bg-slate-900 rounded-3xl p-4 shadow-2xl overflow-hidden flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white truncate">{imagenModal.titulo}</h4>
            <button
              type="button"
              onClick={() => setImagenModal(null)}
              className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative w-full h-[65vh] mt-2">
            <Image
              src={imagenModal.src}
              alt={imagenModal.titulo}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        </div>
      </div>
    );
  };

  // ─── Indicador de Pasos Superior ────────────────────────────────────────────
  const pasosTotal = frenteTieneFrase ? 4 : 5;
  let pasoNumero = 1;
  if (paso === "DNI") pasoNumero = 1;
  else if (paso === "FRENTE") pasoNumero = 1;
  else if (paso === "ATRAS") pasoNumero = 2;
  else if (paso === "CRV_MANGA") pasoNumero = frenteTieneFrase ? 2 : 3;
  else if (paso === "COLOR") pasoNumero = frenteTieneFrase ? 3 : 4;
  else if (paso === "CONFIRMACION") pasoNumero = frenteTieneFrase ? 4 : 5;

  return (
    <div className="space-y-6">
      {renderModalImagen()}

      {/* Stepper y Alerta de modificación */}
      {paso !== "DNI" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>DNI: {dni}</span>
            <span>
              Paso {pasoNumero} de {pasosTotal}
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${(pasoNumero / pasosTotal) * 100}%` }}
            />
          </div>

          {esModificacion && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs text-sky-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                Voto previo cargado. Podés modificar cualquier paso.
              </span>
              <button
                type="button"
                onClick={() => setPaso("CONFIRMACION")}
                className="font-bold underline hover:text-sky-950 cursor-pointer"
              >
                Ir a confirmar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PASO 0: Ingreso de DNI ── */}
      {paso === "DNI" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6 max-w-md mx-auto">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Vote className="h-7 w-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Identificate para votar
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Ingresá tu número de DNI para comenzar o para recuperar tu voto y modificarlo.
            </p>
          </div>

          <form onSubmit={handleConsultarDni} className="space-y-4">
            <div>
              <label htmlFor="dni-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Número de DNI
              </label>
              <input
                id="dni-input"
                type="text"
                inputMode="numeric"
                required
                maxLength={9}
                placeholder="Ej: 38123456"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                disabled={isPendingDni}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-base font-mono text-slate-900 shadow-2xs focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 disabled:bg-slate-50"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Solo números, sin puntos ni espacios. Un voto activo por DNI.
              </p>
            </div>

            {errorDni && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorDni}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPendingDni || !dni.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 px-4 text-sm font-bold text-white shadow-xs hover:bg-purple-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPendingDni ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <span>Continuar a la votación</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── PASO 1: Frente ── */}
      {paso === "FRENTE" && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                1. Diseño del Frente
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Elegí la propuesta de diseño para el frente del buzo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaso("DNI")}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer self-start sm:self-auto"
            >
              Cambiar DNI ({dni})
            </button>
          </div>

          <div className="rounded-2xl bg-purple-50/70 border border-purple-200/80 p-3.5 text-xs text-purple-950 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
            <p>
              <strong>Atención:</strong> Las propuestas con frase en el frente ya definen el mensaje del buzo, por lo que no requerirán elegir diseño de espalda. Los frentes sin frase habilitarán elegir la espalda en el siguiente paso.
            </p>
          </div>

          {/* Grilla de Opciones de Frente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPCIONES_FRENTE.map((opcion) => {
              const seleccionado = frenteSeleccionado === opcion.id;
              const imageSrc = `/Buzos/Delante/${opcion.archivo}`;

              return (
                <div
                  key={opcion.id}
                  onClick={() => setFrenteSeleccionado(opcion.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl border-2 bg-white p-3.5 transition-all cursor-pointer shadow-xs ${
                    seleccionado
                      ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-600/20"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {/* Badge de tipo */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        opcion.tieneFrase
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {opcion.tieneFrase ? "Con frase" : "Sin frase"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagenModal({ src: imageSrc, titulo: opcion.nombre });
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Ver imagen ampliada"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Imagen */}
                  <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                    <Image
                      src={imageSrc}
                      alt={opcion.nombre}
                      fill
                      className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Descripción y botón de selección */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{opcion.nombre}</h3>
                      {opcion.descripcion && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {opcion.descripcion}
                        </p>
                      )}
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        seleccionado
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-slate-300 text-transparent group-hover:border-slate-400"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPaso("DNI")}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Atrás</span>
            </button>

            <button
              type="button"
              disabled={!frenteSeleccionado}
              onClick={handleAvanzarDesdeFrente}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{frenteTieneFrase ? "Continuar a Manga" : "Continuar a Espalda"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* ── PASO 2: Atrás (Espalda) — Solo si el frente NO tiene frase ── */}
      {paso === "ATRAS" && !frenteTieneFrase && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              2. Diseño de Espalda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Como elegiste un frente sin frase, seleccioná la propuesta para la espalda del buzo.
            </p>
          </div>

          {/* Grilla de Opciones de Espalda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPCIONES_ATRAS.map((opcion) => {
              const seleccionado = atrasSeleccionado === opcion.id;
              const imageSrc = `/Buzos/Atras/${opcion.archivo}`;

              return (
                <div
                  key={opcion.id}
                  onClick={() => setAtrasSeleccionado(opcion.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl border-2 bg-white p-3.5 transition-all cursor-pointer shadow-xs ${
                    seleccionado
                      ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-600/20"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-end mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagenModal({ src: imageSrc, titulo: opcion.nombre });
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Ver imagen ampliada"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                    <Image
                      src={imageSrc}
                      alt={opcion.nombre}
                      fill
                      className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{opcion.nombre}</h3>
                      {opcion.descripcion && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {opcion.descripcion}
                        </p>
                      )}
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        seleccionado
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-slate-300 text-transparent group-hover:border-slate-400"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPaso("FRENTE")}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Volver a Frente</span>
            </button>

            <button
              type="button"
              disabled={!atrasSeleccionado}
              onClick={() => setPaso("CRV_MANGA")}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>Continuar a Manga</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* ── PASO 3: CRV en Manga ── */}
      {paso === "CRV_MANGA" && (
        <section className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-200">
          <div className="text-center space-y-1 border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              ¿Querés agregar el logo CRV en la manga?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Esta opción se vota independientemente del diseño que hayas elegido.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opción Sí */}
            <div
              onClick={() => setCrvManga(true)}
              className={`rounded-2xl border-2 p-5 text-center transition-all cursor-pointer shadow-xs ${
                crvManga === true
                  ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-center mb-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    crvManga === true
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900">Sí</h3>
              <p className="mt-1 text-xs text-slate-500">
                Incluir el logo &ldquo;CRV&rdquo; estampado en una de las mangas.
              </p>
            </div>

            {/* Opción No */}
            <div
              onClick={() => setCrvManga(false)}
              className={`rounded-2xl border-2 p-5 text-center transition-all cursor-pointer shadow-xs ${
                crvManga === false
                  ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-center mb-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    crvManga === false
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <X className="h-6 w-6 stroke-[3]" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900">No</h3>
              <p className="mt-1 text-xs text-slate-500">
                Dejar las mangas lisas sin el logo adicional.
              </p>
            </div>
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleVolverDesdeCrvManga}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Volver</span>
            </button>

            <button
              type="button"
              disabled={crvManga === null}
              onClick={() => setPaso("COLOR")}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>Continuar a Color</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* ── PASO 4: Color ── */}
      {paso === "COLOR" && (
        <section className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-200">
          <div className="text-center space-y-1 border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Color del Buzo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Seleccioná exactamente un color para el buzo institucional 2027.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {OPCIONES_COLOR.map((opcion) => {
              const seleccionado = colorSeleccionado === opcion.id;

              return (
                <div
                  key={opcion.id}
                  onClick={() => setColorSeleccionado(opcion.id)}
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 bg-white p-4 text-center transition-all cursor-pointer shadow-xs ${
                    seleccionado
                      ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Swatch circular generado */}
                  <div className="relative my-2">
                    <div
                      className="h-20 w-20 sm:h-22 sm:w-22 rounded-full border border-black/15 shadow-md transition-transform hover:scale-105"
                      style={{ backgroundColor: opcion.hex }}
                    />
                    {seleccionado && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-xs">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Nombre y Código HEX */}
                  <div className="mt-2 space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900">{opcion.nombre}</h3>
                    <p className="font-mono text-xs font-semibold text-slate-500">
                      {opcion.hex}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPaso("CRV_MANGA")}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Volver a Manga</span>
            </button>

            <button
              type="button"
              disabled={!colorSeleccionado}
              onClick={() => setPaso("CONFIRMACION")}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>Revisar mi voto</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* ── PASO 5: Confirmación ── */}
      {paso === "CONFIRMACION" && (
        <section className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-200">
          <div className="text-center space-y-1 border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Revisá tu elección
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Verificá tus elecciones antes de registrar tu voto definitivo.
            </p>
          </div>

          {/* Tarjeta de Resumen Detallado */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Votante
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-900">
                DNI {dni}
              </span>
            </div>

            {/* Frente */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {frenteActual && (
                  <div className="relative h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <Image
                      src={`/Buzos/Delante/${frenteActual.archivo}`}
                      alt={frenteActual.nombre}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Diseño Frente</p>
                  <p className="text-sm font-bold text-slate-900">{frenteActual?.nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaso("FRENTE")}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Espalda */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {atrasActual ? (
                  <div className="relative h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <Image
                      src={`/Buzos/Atras/${atrasActual.archivo}`}
                      alt={atrasActual.nombre}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 shrink-0">
                    <Shirt className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Diseño Espalda</p>
                  <p className="text-sm font-bold text-slate-900">
                    {frenteTieneFrase
                      ? "No corresponde (frente con frase)"
                      : atrasActual?.nombre || "No seleccionado"}
                  </p>
                </div>
              </div>
              {!frenteTieneFrase && (
                <button
                  type="button"
                  onClick={() => setPaso("ATRAS")}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer"
                >
                  Cambiar
                </button>
              )}
            </div>

            {/* CRV Manga */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500">CRV en Manga</p>
                <p className="text-sm font-bold text-slate-900">
                  {crvManga ? "Sí (Logo incluido)" : "No (Sin logo adicional)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaso("CRV_MANGA")}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Color */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {colorActual && (
                  <div
                    className="h-10 w-10 rounded-full border border-black/10 shadow-xs shrink-0"
                    style={{ backgroundColor: colorActual.hex }}
                  />
                )}
                <div>
                  <p className="text-xs text-slate-500">Color Elegido</p>
                  <p className="text-sm font-bold text-slate-900">
                    {colorActual?.nombre}{" "}
                    <span className="font-mono text-xs text-slate-500 font-medium">
                      ({colorActual?.hex})
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaso("COLOR")}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          </div>

          {/* Textos Institucionales Obligatorios */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 space-y-2 text-xs text-purple-950 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-700" />
              El resultado de esta votación define un único diseño para todos los buzos 2027.
            </p>
            <p className="text-purple-800">
              Podés modificar tu voto mientras la votación esté abierta (hasta {fechaCierreTexto}).
            </p>
          </div>

          {errorSubmit && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorSubmit}</span>
            </div>
          )}

          {/* Botón de Confirmación Definitiva */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPaso("COLOR")}
              className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Volver a editar
            </button>

            <button
              type="button"
              disabled={isPendingSubmit}
              onClick={handleConfirmarVoto}
              className="w-full flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 px-6 text-sm font-bold text-white shadow-md hover:bg-purple-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPendingSubmit ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando voto...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Confirmar voto</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
