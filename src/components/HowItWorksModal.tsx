"use client";

import { useState, useEffect, useCallback } from "react";
import { Info, X, Check, ArrowRight } from "lucide-react";

export default function HowItWorksModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = useCallback(() => setIsOpen(false), []);

  // Cerrar con Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Botón disparador sutil y elegante */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-xs transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-95 sm:text-sm"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[#009B4D]">
          <Info className="h-3.5 w-3.5" />
        </span>
        <span>¿Cómo funciona? / Instrucciones</span>
      </button>

      {/* Modal / Backdrop */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={handleClose}
        >
          {/* Contenedor del Modal */}
          <div
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  🍗 Gran Pollada Digital
                </span>
                <h2
                  id="modal-title"
                  className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
                >
                  ¿Cómo funciona la venta de pollos?
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-slate-700">
              {/* Bajada */}
              <p className="leading-relaxed text-slate-600">
                ¡Hola! Se viene la Gran Pollada de CamReVoc. Este año modernizamos la
                entrega: <strong className="text-slate-900">cero papeles, todo digital</strong> mediante vales con código QR.
              </p>

              {/* Meta / Objetivo destacado */}
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Objetivo comunitario
                  </p>
                  <p className="font-semibold text-emerald-950">
                    Cada camrevoquista y animador tiene como objetivo vender al menos 2 pollos.
                  </p>
                </div>
              </div>

              {/* Pasos explicativos */}
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Paso a paso para vender y cargar
                </h3>

                {/* Paso 1 */}
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white font-bold text-slate-900 shadow-xs border border-slate-200/80">
                    1️⃣
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Vendé los pollos</h4>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      Ofrecele a familiares, vecinos y amigos. ¡Ahora podés cargar varios pollos en una sola compra!
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white font-bold text-slate-900 shadow-xs border border-slate-200/80">
                    2️⃣
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Transferí</h4>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      Hacé la transferencia bancaria por el monto total a la cuenta oficial de Don Bosco (Alias: <strong className="font-mono text-slate-900">GRUPOSDBNQN</strong>). Si la app te permite poner motivo, poné: <strong className="font-mono text-slate-900">POLLADACRV</strong>.
                    </p>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white font-bold text-slate-900 shadow-xs border border-slate-200/80">
                    3️⃣
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Cargá el formulario</h4>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      Completá los datos del comprador y adjuntá el o los comprobantes. Si le vendiste a varias personas, usá la opción <strong className="text-slate-900">&quot;Dividir en varios vales / QRs&quot;</strong> para que cada uno tenga su propio código para retirar.
                    </p>
                  </div>
                </div>

                {/* Paso 4 */}
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white font-bold text-slate-900 shadow-xs border border-slate-200/80">
                    4️⃣
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Revisión y envío de QRs</h4>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      En un lapso no mayor a 24 hs revisamos el pago. Te va a llegar un mail con los vales y vas a poder compartirlos directo por WhatsApp a cada comprador.
                    </p>
                  </div>
                </div>

                {/* Paso 5 */}
                <div className="flex gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white font-bold text-slate-900 shadow-xs border border-slate-200/80">
                    5️⃣
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Retiro el Sábado 10 de Octubre</h4>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      En el puesto de entrega escaneamos el QR directamente desde el celular y entregamos los pollos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensaje de cierre */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold">
                  ⚠️ Si tenés alguna duda, comunicate con el coordinador de tu etapa.
                </p>
                <p className="mt-1 font-medium text-amber-950">
                  ¡Gracias por sumarte y darnos una mano!
                </p>
              </div>
            </div>

            {/* Footer con CTA de cierre */}
            <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#009B4D] py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-[#007a3d] active:scale-[0.98]"
              >
                <span>¡Entendido, vamos!</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
