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
  PagoPendienteRevision,
  PagoRechazadoRevision,
} from "@/types/campamento";

/**
 * Obtiene los inscriptos de una etapa junto con sus pagos registrados y las métricas acumuladas.
 */
export async function getInscriptosEtapa(etapaParam: string): Promise<{
  ok: boolean;
  error?: string;
  inscriptos: InscriptoConPagos[];
  pagosPendientes: PagoPendienteRevision[];
  pagosRechazados: PagoRechazadoRevision[];
  metricas: MetricasEtapa;
  etapaConfig?: typeof COORDINADORES_POR_ETAPA[string];
}> {
  const etapaNum = normalizarEtapa(etapaParam);
  if (!etapaNum) {
    return {
      ok: false,
      error: "Etapa no válida",
      inscriptos: [],
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: { totalInscriptos: 0, totalRecaudado: 0, totalPresupuestado: 0, porcentajeCobranza: 0, pagosPendientesCount: 0, pagosRechazadosCount: 0 },
    };
  }

  const etapaConfig = COORDINADORES_POR_ETAPA[etapaNum];
  const supabase = createCampamentoClient();

  // Traer inscriptos de la etapa. En la BD se guardan como "1ra Etapa", "2da Etapa", etc.
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
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: { totalInscriptos: 0, totalRecaudado: 0, totalPresupuestado: 0, porcentajeCobranza: 0, pagosPendientesCount: 0, pagosRechazadosCount: 0 },
    };
  }

  const inscriptosList = (inscriptosRaw || []) as InscriptoCampamento[];

  if (inscriptosList.length === 0) {
    return {
      ok: true,
      inscriptos: [],
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: {
        totalInscriptos: 0,
        totalRecaudado: 0,
        totalPresupuestado: 0,
        porcentajeCobranza: 0,
        pagosPendientesCount: 0,
        pagosRechazadosCount: 0,
      },
      etapaConfig,
    };
  }

  const inscriptoIds = inscriptosList.map((i) => i.id);
  const inscriptosMap = new Map<string, InscriptoCampamento>();
  for (const ins of inscriptosList) {
    inscriptosMap.set(ins.id, ins);
  }

  // Traer pagos asociados a estos inscriptos
  const { data: pagosRaw, error: pagosError } = await supabase
    .from("pagos")
    .select("*")
    .in("inscripto_id", inscriptoIds)
    .order("created_at", { ascending: false });

  if (pagosError) {
    console.warn("[getInscriptosEtapa] Advertencia al obtener pagos:", pagosError);
  }

  const pagosList = (pagosRaw || []) as PagoCampamento[];

  // Mapear pagos por inscripto_id y separar pendientes y rechazados
  const pagosPorInscripto = new Map<string, PagoCampamento[]>();
  const pagosPendientes: PagoPendienteRevision[] = [];
  const pagosRechazados: PagoRechazadoRevision[] = [];

  for (const pago of pagosList) {
    const arr = pagosPorInscripto.get(pago.inscripto_id) || [];
    arr.push(pago);
    pagosPorInscripto.set(pago.inscripto_id, arr);

    // Si el estado es PENDIENTE (subido por familia pendiente de revisión)
    if (pago.estado === "PENDIENTE") {
      const ins = inscriptosMap.get(pago.inscripto_id);
      if (ins) {
        pagosPendientes.push({
          ...pago,
          inscripto: {
            id: ins.id,
            nombre: ins.nombre,
            apellido: ins.apellido,
            dni: ins.dni,
            etapa: ins.etapa,
          },
        });
      }
    } else if (pago.estado === "RECHAZADO") {
      const ins = inscriptosMap.get(pago.inscripto_id);
      if (ins) {
        pagosRechazados.push({
          ...pago,
          inscripto: {
            id: ins.id,
            nombre: ins.nombre,
            apellido: ins.apellido,
            dni: ins.dni,
            etapa: ins.etapa,
          },
        });
      }
    }
  }

  let totalRecaudado = 0;
  let totalPresupuestado = 0;

  const inscriptosConPagos: InscriptoConPagos[] = inscriptosList.map((inscripto) => {
    const pagos = pagosPorInscripto.get(inscripto.id) || [];
    // Solo computan en recaudado y saldo los pagos que NO estén rechazados ni pendientes (es decir APROBADO o sin estado)
    const pagadoAprobado = pagos
      .filter((p) => p.estado === "APROBADO" || !p.estado)
      .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);

    const tarifa = inscripto.tarifa || etapaConfig?.tarifa || 0;
    const saldo = Math.max(0, tarifa - pagadoAprobado);

    let estadoPago: InscriptoConPagos["estadoPago"] = "PENDIENTE";
    if (pagadoAprobado >= tarifa && tarifa > 0) {
      estadoPago = "PAGADO";
    } else if (pagadoAprobado > 0) {
      estadoPago = "PARCIAL";
    }

    totalRecaudado += pagadoAprobado;
    totalPresupuestado += tarifa;

    return {
      ...inscripto,
      pagos,
      totalPagado: pagadoAprobado,
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
    pagosPendientes,
    pagosRechazados,
    metricas: {
      totalInscriptos: inscriptosConPagos.length,
      totalRecaudado,
      totalPresupuestado,
      porcentajeCobranza,
      pagosPendientesCount: pagosPendientes.length,
      pagosRechazadosCount: pagosRechazados.length,
    },
    etapaConfig,
  };
}

/**
 * Server Action para registrar un nuevo pago manual cargado por el propio coordinador.
 * Todo pago cargado manualmente por el propio coordinador se inserta directamente con estado = 'APROBADO' y subido_por = 'COORDINADOR'.
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

  const esEfectivo = formData.get("esEfectivo") === "true";
  const rawRecibidoPor = formData.get("recibidoPor") as string | null;
  const recibidoPor = esEfectivo ? rawRecibidoPor?.trim() || session.coordinador : null;

  // Insertar en la tabla 'pagos' con estado APROBADO y subido_por COORDINADOR
  const baseInsert = {
    inscripto_id: inscriptoId,
    monto,
    comprobante_url: comprobanteUrl,
    observaciones: observaciones.trim() || null,
    registrado_por: session.coordinador,
    estado: "APROBADO" as const,
    subido_por: "COORDINADOR" as const,
    verificado_por: session.coordinador,
    verificado_at: new Date().toISOString(),
  };

  let { error: insertError } = await supabase.from("pagos").insert({
    ...baseInsert,
    es_efectivo: esEfectivo,
    recibido_por: recibidoPor,
  });

  if (insertError && insertError.message?.includes("es_efectivo") && !esEfectivo) {
    const retry = await supabase.from("pagos").insert(baseInsert);
    insertError = retry.error;
  }

  if (insertError) {
    console.error("[registrarPagoCampamento] Error al insertar pago:", insertError);
    return {
      ok: false,
      error: `Error al registrar el pago: ${insertError.message || "Intentá nuevamente."}`,
    };
  }

  if (etapa) {
    revalidatePath(`/campamento/etapa/${etapa}`);
  }

  return { ok: true };
}

/**
 * Server Action para modificar los datos de pago (efectivo y recibido_por) por parte de coordinación.
 */
export async function actualizarPagoCampamento(
  pagoId: string,
  data: { es_efectivo: boolean; recibido_por: string | null },
  etapaNum: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getCampaSession();
  if (!session) {
    return { ok: false, error: "Sesión no válida o expirada." };
  }

  const esEfectivo = Boolean(data.es_efectivo);
  const recibidoPor = esEfectivo ? (data.recibido_por || "").trim() : null;

  if (esEfectivo && !recibidoPor) {
    return { ok: false, error: "Para pagos en efectivo, debés indicar quién recibió el dinero." };
  }

  const supabase = createCampamentoClient();
  const { error } = await supabase
    .from("pagos")
    .update({
      es_efectivo: esEfectivo,
      recibido_por: recibidoPor,
    })
    .eq("id", pagoId);

  if (error) {
    console.error("[actualizarPagoCampamento] Error al actualizar:", error);
    return { ok: false, error: error.message || "Error al actualizar pago." };
  }

  revalidatePath(`/campamento/etapa/${etapaNum}`);
  return { ok: true };
}

/**
 * Server Action para aprobar un pago enviado por una familia.
 */
export async function aprobarPagoCampamento(
  pagoId: string,
  etapaNum: string,
  datosPago?: { es_efectivo?: boolean; recibido_por?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const session = await getCampaSession();
  if (!session) {
    return { ok: false, error: "Sesión no válida o expirada." };
  }

  const updateData: Record<string, unknown> = {
    estado: "APROBADO",
    verificado_por: session.coordinador,
    verificado_at: new Date().toISOString(),
    motivo_rechazo: null,
  };

  if (datosPago) {
    const esEfectivo = Boolean(datosPago.es_efectivo);
    const recibidoPor = esEfectivo ? (datosPago.recibido_por || "").trim() : null;
    if (esEfectivo && !recibidoPor) {
      return { ok: false, error: "Para pagos en efectivo, debés indicar quién recibió el dinero." };
    }
    updateData.es_efectivo = esEfectivo;
    updateData.recibido_por = recibidoPor;
  }

  const supabase = createCampamentoClient();
  const { error } = await supabase
    .from("pagos")
    .update(updateData)
    .eq("id", pagoId);

  if (error) {
    console.error("[aprobarPagoCampamento] Error al aprobar:", error);
    return { ok: false, error: error.message || "Error al aprobar pago." };
  }

  revalidatePath(`/campamento/etapa/${etapaNum}`);
  return { ok: true };
}

/**
 * Server Action para observar o rechazar un pago enviado por una familia.
 */
export async function observarPagoCampamento(
  pagoId: string,
  motivo: string,
  etapaNum: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getCampaSession();
  if (!session) {
    return { ok: false, error: "Sesión no válida o expirada." };
  }

  const supabase = createCampamentoClient();
  const { error } = await supabase
    .from("pagos")
    .update({
      estado: "RECHAZADO",
      motivo_rechazo: motivo.trim() || "Pago observado o rechazado por coordinación.",
      verificado_por: session.coordinador,
      verificado_at: new Date().toISOString(),
    })
    .eq("id", pagoId);

  if (error) {
    console.error("[observarPagoCampamento] Error al rechazar:", error);
    return { ok: false, error: error.message || "Error al observar pago." };
  }

  revalidatePath(`/campamento/etapa/${etapaNum}`);
  return { ok: true };
}

