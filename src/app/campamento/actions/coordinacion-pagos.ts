"use server";

import { revalidatePath } from "next/cache";
import { createCampamentoClient } from "@/lib/supabase/campamento";
import { getCampaSession } from "./coordinacion-auth";
import { COORDINADORES_POR_ETAPA } from "@/config/campamento-coordinadores";
import type {
  InscriptoCampamento,
  PagoCampamento,
  InscriptoConPagos,
  MetricasEtapa,
  PagoPendienteRevision,
  PagoRechazadoRevision,
} from "@/types/campamento";

function crearMetricasVacias(): MetricasEtapa {
  return {
    totalInscriptos: 0,
    totalRecaudado: 0,
    totalPresupuestado: 0,
    porcentajeCobranza: 0,
    pagosPendientesCount: 0,
    pagosRechazadosCount: 0,
  };
}

/**
 * Valida estrictamente un identificador de etapa ("1".."7", "1ra".."7ma", "1ra Etapa".."7ma Etapa")
 * rechazando cadenas ambiguas o manipuladas antes de ejecutar cualquier consulta.
 */
function validarEtapaParam(etapaParam: unknown): string | null {
  if (typeof etapaParam !== "string") return null;
  const trimmed = etapaParam.trim();
  const match = trimmed.match(/^([1-7])(?:(?:ra|da|ta|ma)(?:\s+etapa)?)?$/i);
  if (!match) return null;
  const etapaNum = match[1];
  return COORDINADORES_POR_ETAPA[etapaNum] ? etapaNum : null;
}

/**
 * Comprueba en el servidor que un inscripto existe y pertenece exactamente a la etapa autorizada.
 */
async function verificarInscriptoPerteneceAEtapa(
  supabase: ReturnType<typeof createCampamentoClient>,
  inscriptoIdRaw: unknown,
  etapaAutorizada: string,
): Promise<{ ok: true; inscriptoId: string } | { ok: false; error: string }> {
  if (typeof inscriptoIdRaw !== "string" || !inscriptoIdRaw.trim()) {
    return { ok: false, error: "Identificador de inscripto inválido." };
  }
  const inscriptoId = inscriptoIdRaw.trim();

  const { data: inscripto, error: inscriptoError } = await supabase
    .from("inscriptos")
    .select("id, etapa")
    .eq("id", inscriptoId)
    .maybeSingle();

  if (inscriptoError || !inscripto || !inscripto.id) {
    return {
      ok: false,
      error: "No se pudo verificar el inscripto para la etapa autorizada.",
    };
  }

  const etapaInscripto = validarEtapaParam(inscripto.etapa);
  if (!etapaInscripto || etapaInscripto !== etapaAutorizada) {
    return {
      ok: false,
      error: "No se pudo verificar el inscripto para la etapa autorizada.",
    };
  }

  return { ok: true, inscriptoId: inscripto.id };
}

/**
 * Comprueba en el servidor que tanto el pago como su inscripto asociado existen
 * y pertenecen exactamente a la etapa de la sesión autenticada.
 */
async function verificarPagoPerteneceAEtapa(
  supabase: ReturnType<typeof createCampamentoClient>,
  pagoIdRaw: unknown,
  etapaAutorizada: string,
): Promise<{ ok: true; pagoId: string; inscriptoId: string } | { ok: false; error: string }> {
  if (typeof pagoIdRaw !== "string" || !pagoIdRaw.trim()) {
    return { ok: false, error: "Identificador de pago inválido." };
  }
  const pagoId = pagoIdRaw.trim();

  const { data: pago, error: pagoError } = await supabase
    .from("pagos")
    .select("id, inscripto_id")
    .eq("id", pagoId)
    .maybeSingle();

  if (pagoError || !pago || !pago.id || !pago.inscripto_id) {
    return {
      ok: false,
      error: "No se pudo verificar el pago para la etapa autorizada.",
    };
  }

  const checkInscripto = await verificarInscriptoPerteneceAEtapa(
    supabase,
    pago.inscripto_id,
    etapaAutorizada,
  );

  if (!checkInscripto.ok) {
    return {
      ok: false,
      error: "No se pudo verificar el pago para la etapa autorizada.",
    };
  }

  return { ok: true, pagoId: pago.id, inscriptoId: checkInscripto.inscriptoId };
}

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
  // 1. Validar parámetro de etapa antes de ejecutar consultas
  const etapaNum = validarEtapaParam(etapaParam);
  if (!etapaNum) {
    return {
      ok: false,
      error: "Etapa no válida.",
      inscriptos: [],
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: crearMetricasVacias(),
    };
  }

  // 2. Verificar sesión activa y firmada del coordinador
  const session = await getCampaSession();
  if (!session) {
    return {
      ok: false,
      error: "Sesión no válida o expirada. Por favor iniciá sesión nuevamente.",
      inscriptos: [],
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: crearMetricasVacias(),
    };
  }

  // 3. Comprobar que session.etapaNum coincida exactamente con etapaNum solicitado
  const sessionEtapaNum = validarEtapaParam(session.etapaNum);
  if (!sessionEtapaNum || sessionEtapaNum !== etapaNum) {
    return {
      ok: false,
      error: "No tenés permisos para consultar los inscriptos de otra etapa.",
      inscriptos: [],
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: crearMetricasVacias(),
    };
  }

  const etapaConfig = COORDINADORES_POR_ETAPA[sessionEtapaNum];
  const supabase = createCampamentoClient();

  // Traer inscriptos de la etapa autorizada. En la BD se guardan como "1ra Etapa", "2da Etapa", etc.
  const { data: inscriptosRaw, error: inscriptosError } = await supabase
    .from("inscriptos")
    .select("*")
    .ilike("etapa", `${sessionEtapaNum}%`)
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true });

  if (inscriptosError) {
    console.error("[getInscriptosEtapa] Error al consultar inscriptos en la base de datos.");
    return {
      ok: false,
      error: "Error al consultar la base de datos de inscriptos.",
      inscriptos: [],
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: crearMetricasVacias(),
    };
  }

  const inscriptosList = ((inscriptosRaw || []) as InscriptoCampamento[]).filter((ins) => {
    const numIns = validarEtapaParam(ins.etapa);
    return numIns === sessionEtapaNum;
  });

  if (inscriptosList.length === 0) {
    return {
      ok: true,
      inscriptos: [],
      pagosPendientes: [],
      pagosRechazados: [],
      metricas: crearMetricasVacias(),
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
    console.warn("[getInscriptosEtapa] Advertencia al obtener pagos de la etapa.");
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
  const etapaAutorizada = session ? validarEtapaParam(session.etapaNum) : null;
  if (!session || !etapaAutorizada) {
    return { ok: false, error: "Sesión no válida o expirada. Por favor iniciá sesión nuevamente." };
  }

  const etapaForm = formData.get("etapa");
  if (etapaForm !== null && etapaForm !== "") {
    const etapaSolicitada = validarEtapaParam(etapaForm);
    if (!etapaSolicitada || etapaSolicitada !== etapaAutorizada) {
      return { ok: false, error: "No tenés permisos para registrar pagos en otra etapa." };
    }
  }

  const inscriptoIdRaw = formData.get("inscriptoId");
  const montoStr = formData.get("monto") as string;
  const observaciones = (formData.get("observaciones") as string) || "";
  const comprobanteFile = formData.get("comprobante") as File | null;

  const monto = Number(montoStr);
  if (typeof inscriptoIdRaw !== "string" || !inscriptoIdRaw.trim()) {
    return { ok: false, error: "Identificador de inscripto inválido." };
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    return { ok: false, error: "El monto ingresado debe ser mayor a 0." };
  }

  const supabase = createCampamentoClient();

  // Verificar en base de datos que el inscripto existe y pertenece a la etapa de la sesión
  const checkInscripto = await verificarInscriptoPerteneceAEtapa(
    supabase,
    inscriptoIdRaw,
    etapaAutorizada,
  );
  if (!checkInscripto.ok) {
    return { ok: false, error: checkInscripto.error };
  }

  const inscriptoId = checkInscripto.inscriptoId;
  let comprobanteUrl: string | null = null;

  // Subir archivo al bucket comprobantes-campa si se adjuntó
  if (comprobanteFile && comprobanteFile.size > 0) {
    try {
      const sanitizedName = comprobanteFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${etapaAutorizada}/${inscriptoId}/${Date.now()}-${sanitizedName}`;

      const arrayBuffer = await comprobanteFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("comprobantes-campa")
        .upload(filePath, buffer, {
          contentType: comprobanteFile.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError || !uploadData?.path) {
        console.error("[registrarPagoCampamento] Error al subir comprobante al almacenamiento.");
        return {
          ok: false,
          error: "No se pudo subir el comprobante adjunto. El pago no fue registrado.",
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from("comprobantes-campa")
        .getPublicUrl(uploadData.path);

      if (!publicUrlData?.publicUrl) {
        console.error("[registrarPagoCampamento] No se pudo obtener URL pública del comprobante.");
        return {
          ok: false,
          error: "No se pudo subir el comprobante adjunto. El pago no fue registrado.",
        };
      }

      comprobanteUrl = publicUrlData.publicUrl;
    } catch {
      console.error("[registrarPagoCampamento] Excepción al procesar archivo de comprobante.");
      return {
        ok: false,
        error: "No se pudo procesar el comprobante adjunto. El pago no fue registrado.",
      };
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
    console.error("[registrarPagoCampamento] Error al insertar pago en la base de datos.");
    return {
      ok: false,
      error: "No se pudo registrar el pago. Intentá nuevamente.",
    };
  }

  revalidatePath(`/campamento/etapa/${etapaAutorizada}`);

  return { ok: true };
}

/**
 * Server Action para modificar los datos de pago (efectivo y recibido_por) por parte de coordinación.
 */
export async function actualizarPagoCampamento(
  pagoId: string,
  data: { es_efectivo: boolean; recibido_por: string | null; observaciones?: string | null },
  etapaNum: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getCampaSession();
  const etapaAutorizada = session ? validarEtapaParam(session.etapaNum) : null;
  if (!session || !etapaAutorizada) {
    return { ok: false, error: "Sesión no válida o expirada." };
  }

  const etapaSolicitada = validarEtapaParam(etapaNum);
  if (!etapaSolicitada || etapaSolicitada !== etapaAutorizada) {
    return { ok: false, error: "No tenés permisos para modificar pagos de otra etapa." };
  }

  const esEfectivo = Boolean(data.es_efectivo);
  const recibidoPor = esEfectivo ? (data.recibido_por || "").trim() : null;

  if (esEfectivo && !recibidoPor) {
    return { ok: false, error: "Para pagos en efectivo, debés indicar quién recibió el dinero." };
  }

  const supabase = createCampamentoClient();

  // Comprobar en el servidor que tanto el pago como el inscripto pertenecen a la etapa autorizada
  const checkPago = await verificarPagoPerteneceAEtapa(supabase, pagoId, etapaAutorizada);
  if (!checkPago.ok) {
    return { ok: false, error: checkPago.error };
  }

  const updateData: Record<string, unknown> = {
    es_efectivo: esEfectivo,
    recibido_por: recibidoPor,
  };

  if (data.observaciones !== undefined) {
    updateData.observaciones = data.observaciones?.trim() || null;
  }

  const { data: updatedPago, error } = await supabase
    .from("pagos")
    .update(updateData)
    .eq("id", checkPago.pagoId)
    .eq("inscripto_id", checkPago.inscriptoId)
    .select("id")
    .maybeSingle();

  if (error || !updatedPago?.id) {
    console.error("[actualizarPagoCampamento] Error o registro no encontrado al actualizar pago.");
    return { ok: false, error: "No se pudo actualizar el pago solicitado." };
  }

  revalidatePath(`/campamento/etapa/${etapaAutorizada}`);
  return { ok: true };
}

/**
 * Server Action para aprobar un pago enviado por una familia.
 * Permite registrar opcionalmente una observación de coordinación (ej: pago conjunto de hermanos).
 */
export async function aprobarPagoCampamento(
  pagoId: string,
  etapaNum: string,
  datosPago?: { es_efectivo?: boolean; recibido_por?: string | null; observaciones?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const session = await getCampaSession();
  const etapaAutorizada = session ? validarEtapaParam(session.etapaNum) : null;
  if (!session || !etapaAutorizada) {
    return { ok: false, error: "Sesión no válida o expirada." };
  }

  const etapaSolicitada = validarEtapaParam(etapaNum);
  if (!etapaSolicitada || etapaSolicitada !== etapaAutorizada) {
    return { ok: false, error: "No tenés permisos para aprobar pagos de otra etapa." };
  }

  const updateData: Record<string, unknown> = {
    estado: "APROBADO",
    verificado_por: session.coordinador,
    verificado_at: new Date().toISOString(),
    motivo_rechazo: null,
  };

  if (datosPago) {
    if (datosPago.es_efectivo !== undefined) {
      const esEfectivo = Boolean(datosPago.es_efectivo);
      const recibidoPor = esEfectivo ? (datosPago.recibido_por || "").trim() : null;
      if (esEfectivo && !recibidoPor) {
        return { ok: false, error: "Para pagos en efectivo, debés indicar quién recibió el dinero." };
      }
      updateData.es_efectivo = esEfectivo;
      updateData.recibido_por = recibidoPor;
    }

    if (datosPago.observaciones !== undefined) {
      const obsTrimmed = datosPago.observaciones?.trim();
      if (obsTrimmed && obsTrimmed.length > 0) {
        updateData.observaciones = obsTrimmed;
      }
    }
  }

  const supabase = createCampamentoClient();

  // Comprobar en el servidor que tanto el pago como el inscripto pertenecen a la etapa autorizada
  const checkPago = await verificarPagoPerteneceAEtapa(supabase, pagoId, etapaAutorizada);
  if (!checkPago.ok) {
    return { ok: false, error: checkPago.error };
  }

  const { data: updatedPago, error } = await supabase
    .from("pagos")
    .update(updateData)
    .eq("id", checkPago.pagoId)
    .eq("inscripto_id", checkPago.inscriptoId)
    .select("id")
    .maybeSingle();

  if (error || !updatedPago?.id) {
    console.error("[aprobarPagoCampamento] Error o registro no encontrado al aprobar pago.");
    return { ok: false, error: "No se pudo aprobar el pago solicitado." };
  }

  revalidatePath(`/campamento/etapa/${etapaAutorizada}`);
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
  const etapaAutorizada = session ? validarEtapaParam(session.etapaNum) : null;
  if (!session || !etapaAutorizada) {
    return { ok: false, error: "Sesión no válida o expirada." };
  }

  const etapaSolicitada = validarEtapaParam(etapaNum);
  if (!etapaSolicitada || etapaSolicitada !== etapaAutorizada) {
    return { ok: false, error: "No tenés permisos para observar o rechazar pagos de otra etapa." };
  }

  const supabase = createCampamentoClient();

  // Comprobar en el servidor que tanto el pago como el inscripto pertenecen a la etapa autorizada
  const checkPago = await verificarPagoPerteneceAEtapa(supabase, pagoId, etapaAutorizada);
  if (!checkPago.ok) {
    return { ok: false, error: checkPago.error };
  }

  const motivoLimpio = typeof motivo === "string" ? motivo.trim() : "";

  const { data: updatedPago, error } = await supabase
    .from("pagos")
    .update({
      estado: "RECHAZADO",
      motivo_rechazo: motivoLimpio || "Pago observado o rechazado por coordinación.",
      verificado_por: session.coordinador,
      verificado_at: new Date().toISOString(),
    })
    .eq("id", checkPago.pagoId)
    .eq("inscripto_id", checkPago.inscriptoId)
    .select("id")
    .maybeSingle();

  if (error || !updatedPago?.id) {
    console.error("[observarPagoCampamento] Error o registro no encontrado al observar pago.");
    return { ok: false, error: "No se pudo observar o rechazar el pago solicitado." };
  }

  revalidatePath(`/campamento/etapa/${etapaAutorizada}`);
  return { ok: true };
}

