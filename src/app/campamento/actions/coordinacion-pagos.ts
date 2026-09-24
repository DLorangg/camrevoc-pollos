"use server";

import { revalidatePath } from "next/cache";
import { createCampamentoClient } from "@/lib/supabase/campamento";
import { getCampaSession } from "./coordinacion-auth";
import { normalizarEtapa, COORDINADORES_POR_ETAPA } from "@/config/campamento-coordinadores";
import type {
  InscriptoCampamento,
  PagoCampamento,
  InscriptoConPagos,
  MetricasEtapa,
} from "@/types/campamento";

/**
 * Obtiene los inscriptos de una etapa junto con sus pagos registrados y las métricas acumuladas.
 */
export async function getInscriptosEtapa(etapaParam: string): Promise<{
  ok: boolean;
  error?: string;
  inscriptos: InscriptoConPagos[];
  metricas: MetricasEtapa;
  etapaConfig?: typeof COORDINADORES_POR_ETAPA[string];
}> {
  const etapaNum = normalizarEtapa(etapaParam);
  if (!etapaNum) {
    return {
      ok: false,
      error: "Etapa no válida",
      inscriptos: [],
      metricas: { totalInscriptos: 0, totalRecaudado: 0, totalPresupuestado: 0, porcentajeCobranza: 0 },
    };
  }

  const etapaConfig = COORDINADORES_POR_ETAPA[etapaNum];
  const supabase = createCampamentoClient();

  // Traer inscriptos de la etapa. En la BD se guardan como "1ra Etapa", "2da Etapa", etc.
  // Buscamos con ilike o con el prefijo numérico para mayor robustez
  const { data: inscriptosRaw, error: inscriptosError } = await supabase
    .from("inscriptos")
    .select("*")
    .ilike("etapa", `${etapaNum}%`)
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  if (inscriptosError) {
    console.error("[getInscriptosEtapa] Error al obtener inscriptos:", inscriptosError);
    return {
      ok: false,
      error: "Error al consultar la base de datos de inscriptos.",
      inscriptos: [],
      metricas: { totalInscriptos: 0, totalRecaudado: 0, totalPresupuestado: 0, porcentajeCobranza: 0 },
    };
  }

  const inscriptosList = (inscriptosRaw || []) as InscriptoCampamento[];

  // Si no hay inscriptos, retornamos vacío
  if (inscriptosList.length === 0) {
    return {
      ok: true,
      inscriptos: [],
      metricas: {
        totalInscriptos: 0,
        totalRecaudado: 0,
        totalPresupuestado: 0,
        porcentajeCobranza: 0,
      },
      etapaConfig,
    };
  }

  const inscriptoIds = inscriptosList.map((i) => i.id);

  // Traer pagos asociados a estos inscriptos
  const { data: pagosRaw, error: pagosError } = await supabase
    .from("pagos")
    .select("*")
    .in("inscripto_id", inscriptoIds)
    .order("created_at", { ascending: true });

  if (pagosError) {
    // Si la tabla pagos aún no tiene registros o da error de consulta, procesamos sin pagos
    console.warn("[getInscriptosEtapa] Advertencia al obtener pagos:", pagosError);
  }

  const pagosList = (pagosRaw || []) as PagoCampamento[];

  // Mapear pagos por inscripto_id
  const pagosPorInscripto = new Map<string, PagoCampamento[]>();
  for (const pago of pagosList) {
    const arr = pagosPorInscripto.get(pago.inscripto_id) || [];
    arr.push(pago);
    pagosPorInscripto.set(pago.inscripto_id, arr);
  }

  let totalRecaudado = 0;
  let totalPresupuestado = 0;

  const inscriptosConPagos: InscriptoConPagos[] = inscriptosList.map((inscripto) => {
    const pagos = pagosPorInscripto.get(inscripto.id) || [];
    const pagado = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
    const tarifa = inscripto.tarifa || etapaConfig?.tarifa || 0;
    const saldo = Math.max(0, tarifa - pagado);

    let estadoPago: InscriptoConPagos["estadoPago"] = "PENDIENTE";
    if (pagado >= tarifa && tarifa > 0) {
      estadoPago = "PAGADO";
    } else if (pagado > 0) {
      estadoPago = "PARCIAL";
    }

    totalRecaudado += pagado;
    totalPresupuestado += tarifa;

    return {
      ...inscripto,
      pagos,
      totalPagado: pagado,
      saldoRestante: saldo,
      estadoPago,
    };
  });

  const porcentajeCobranza =
    totalPresupuestado > 0
      ? Math.round((totalRecaudado / totalPresupuestado) * 100)
      : 0;

  return {
    ok: true,
    inscriptos: inscriptosConPagos,
    metricas: {
      totalInscriptos: inscriptosConPagos.length,
      totalRecaudado,
      totalPresupuestado,
      porcentajeCobranza,
    },
    etapaConfig,
  };
}

/**
 * Server Action para registrar un nuevo pago de un participante y opcionalmente subir el comprobante.
 */
export async function registrarPagoCampamento(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getCampaSession();
  if (!session) {
    return { ok: false, error: "Sesión no válida o expirada. Por favor iniciá sesión nuevamente." };
  }

  const inscriptoId = formData.get("inscriptoId") as string;
  const montoStr = formData.get("monto") as string;
  const observaciones = (formData.get("observaciones") as string) || "";
  const etapa = formData.get("etapa") as string;
  const comprobanteFile = formData.get("comprobante") as File | null;

  const monto = Number(montoStr);
  if (!inscriptoId || isNaN(monto) || monto <= 0) {
    return { ok: false, error: "El monto ingresado debe ser mayor a 0." };
  }

  const supabase = createCampamentoClient();
  let comprobanteUrl: string | null = null;

  // Subir archivo al bucket comprobantes-campa si se adjuntó
  if (comprobanteFile && comprobanteFile.size > 0) {
    try {
      const ext = comprobanteFile.name.split(".").pop() || "jpg";
      const sanitizedName = comprobanteFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${session.etapaNum}/${inscriptoId}/${Date.now()}-${sanitizedName}`;

      const arrayBuffer = await comprobanteFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("comprobantes-campa")
        .upload(filePath, buffer, {
          contentType: comprobanteFile.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        console.error("[registrarPagoCampamento] Error al subir comprobante:", uploadError);
        // Si el bucket no existe o falla la subida, informamos o permitimos continuar guardando el pago
        // Pero intentamos obtener URL pública
      } else if (uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("comprobantes-campa")
          .getPublicUrl(uploadData.path);
        comprobanteUrl = publicUrlData.publicUrl;
      }
    } catch (fileErr) {
      console.error("[registrarPagoCampamento] Excepción al procesar archivo:", fileErr);
    }
  }

  // Insertar en la tabla 'pagos'
  const { error: insertError } = await supabase.from("pagos").insert({
    inscripto_id: inscriptoId,
    monto,
    comprobante_url: comprobanteUrl,
    observaciones: observaciones.trim() || null,
    registrado_por: session.coordinador,
  });

  if (insertError) {
    console.error("[registrarPagoCampamento] Error al insertar pago:", insertError);
    return {
      ok: false,
      error: `Error al registrar el pago: ${insertError.message || "Intentá nuevamente."}`,
    };
  }

  // Revalidar la vista de la etapa
  if (etapa) {
    revalidatePath(`/campamento/etapa/${etapa}`);
  }

  return { ok: true };
}
