"use server";

import { createCampamentoClient } from "@/lib/supabase/campamento";
import type { InscriptoCampamento } from "@/types/campamento";

export interface BuscarInscriptoPagoResult {
  ok: boolean;
  error?: string;
  inscripto?: InscriptoCampamento & {
    totalAbonado: number;
    saldoPendiente: number;
  };
}

/**
 * Busca a un inscripto por DNI y calcula su total abonado (solo pagos aprobados) y saldo pendiente.
 */
export async function buscarInscriptoPorDni(dniInput: string): Promise<BuscarInscriptoPagoResult> {
  const dni = dniInput.replace(/\D/g, "").trim();
  if (!dni || dni.length < 7 || dni.length > 9) {
    return { ok: false, error: "Ingresá un DNI válido (entre 7 y 9 dígitos, sin puntos)." };
  }

  const supabase = createCampamentoClient();

  const { data: inscripto, error: insError } = await supabase
    .from("inscriptos")
    .select("*")
    .eq("dni", dni)
    .maybeSingle();

  if (insError) {
    console.error("[buscarInscriptoPorDni] Error consultando inscriptos:", insError);
    return { ok: false, error: "Ocurrió un error al consultar el sistema. Intentá nuevamente." };
  }

  if (!inscripto) {
    return {
      ok: false,
      error: "No encontramos ninguna inscripción con este DNI. Verificá el número o completá la inscripción primero.",
    };
  }

  // Consultar pagos aprobados del inscripto
  const { data: pagos, error: pagosError } = await supabase
    .from("pagos")
    .select("monto, estado")
    .eq("inscripto_id", inscripto.id);

  if (pagosError) {
    console.warn("[buscarInscriptoPorDni] Error consultando pagos:", pagosError);
  }

  const totalAbonado = (pagos || [])
    .filter((p) => p.estado === "APROBADO" || !p.estado)
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

  const tarifa = Number(inscripto.tarifa) || 0;
  const saldoPendiente = Math.max(0, tarifa - totalAbonado);

  return {
    ok: true,
    inscripto: {
      ...(inscripto as InscriptoCampamento),
      totalAbonado,
      saldoPendiente,
    },
  };
}

export interface SubirPagoItem {
  inscriptoId: string;
  monto: number;
}

/**
 * Server Action para subir el comprobante de pago enviado por una familia
 * (puede abarcar a 1 o 2 hermanos).
 */
export async function subirPagoFamilia(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const comprobanteFile = formData.get("comprobante") as File | null;
  const rawTelefono = formData.get("telefono") as string | null;
  const telefono = rawTelefono?.trim() || null;
  const observaciones = ((formData.get("observaciones") as string) || "").trim();
  const itemsJson = formData.get("items") as string; // JSON de SubirPagoItem[]

  if (!comprobanteFile || comprobanteFile.size === 0) {
    return { ok: false, error: "El archivo de comprobante de transferencia es obligatorio." };
  }

  let items: SubirPagoItem[] = [];
  try {
    items = JSON.parse(itemsJson) as SubirPagoItem[];
  } catch {
    return { ok: false, error: "Información de montos o participantes no válida." };
  }

  if (!items || items.length === 0) {
    return { ok: false, error: "No se especificaron participantes para este pago." };
  }

  for (const it of items) {
    if (!it.inscriptoId || !it.monto || Number(it.monto) <= 0) {
      return { ok: false, error: "El monto correspondiente a cada participante debe ser mayor a 0." };
    }
  }

  // Cliente Supabase con Service Role Key (elude RLS para storage e insert)
  const supabase = createCampamentoClient();
  let comprobanteUrl: string | null = null;

  // Subir archivo a Supabase Storage bucket: comprobantes-campa
  try {
    const ext = comprobanteFile.name.split(".").pop() || "jpg";
    const sanitizedName = comprobanteFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `familias/${Date.now()}-${sanitizedName}`;

    const arrayBuffer = await comprobanteFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("comprobantes-campa")
      .upload(filePath, buffer, {
        contentType: comprobanteFile.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error exacto Supabase al subir comprobante:", uploadError);
      return {
        ok: false,
        error: uploadError.message || "Error al subir el archivo de comprobante. Intentá nuevamente.",
      };
    }

    if (uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from("comprobantes-campa")
        .getPublicUrl(uploadData.path);
      comprobanteUrl = publicUrlData.publicUrl;
    }
  } catch (err) {
    console.error("[subirPagoFamilia] Excepción al procesar archivo:", err);
    return { ok: false, error: "Error al procesar el archivo adjunto." };
  }

  // Insertar cada pago en la tabla 'pagos' con estado PENDIENTE y subido_por FAMILIA
  const rowsToInsert = items.map((it) => ({
    inscripto_id: it.inscriptoId,
    monto: Number(it.monto),
    comprobante_url: comprobanteUrl,
    observaciones: observaciones || null,
    registrado_por: null,
    estado: "PENDIENTE",
    subido_por: "FAMILIA",
    contacto_telefono: telefono || null,
  }));

  const { error: insertError } = await supabase.from("pagos").insert(rowsToInsert);

  if (insertError) {
    console.error("Error exacto Supabase al insertar pago:", insertError);
    console.error("Detalles del error:", {
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      code: insertError.code,
    });
    return {
      ok: false,
      error: insertError.message || "Error al registrar el pago en la base de datos.",
    };
  }

  return { ok: true };
}
