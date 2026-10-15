"use server";

import * as XLSX from "xlsx";
import { createCampamentoClient } from "@/lib/supabase/campamento";
import { verificarAdminGeneralSession } from "./admin-general-auth";
import { normalizarEtapa } from "@/config/campamento-coordinadores";
import type {
  InscriptoCampamento,
  PagoCampamento,
  InscriptoAdminGeneral,
  MetricasAdminGeneral,
  OtroInscriptoComprobante,
  TelefonoInformado,
  DesgloseMetricasCampamento,
} from "@/types/campamento";

function formatFecha(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(d);
  } catch {
    return isoStr;
  }
}

function inicializarDesglose(): DesgloseMetricasCampamento {
  return {
    totalInscriptos: 0,
    totalRecaudado: 0,
    totalPresupuestado: 0,
    totalSaldoPendiente: 0,
    porcentajeCobranza: 0,
    conteoPagados: 0,
    conteoParciales: 0,
    conteoPendientes: 0,
  };
}

/**
 * Determina la tarifa base del inscripto.
 * Si en la base de datos la tarifa es nula o 0, aplica un fallback coherente
 * con el destino (Junín $550.000 / Regina $200.000) o con el número de etapa.
 */
function resolverTarifaInscripto(ins: InscriptoCampamento): number {
  const tarifaCargada = Number(ins.tarifa);
  if (tarifaCargada && tarifaCargada > 0) {
    return tarifaCargada;
  }
  if (ins.destino === "Regina") return 200_000;
  if (ins.destino === "Junín") return 550_000;
  const numEtapa = normalizarEtapa(ins.etapa);
  if (numEtapa === "4" || numEtapa === "5") return 200_000;
  return 550_000;
}

// ─── Consulta Principal de Solo Lectura ──────────────────────────────────────

export async function obtenerDatosAdminGeneral(): Promise<{
  ok: boolean;
  error?: string;
  inscriptos?: InscriptoAdminGeneral[];
  metricas?: MetricasAdminGeneral;
}> {
  const isAuth = await verificarAdminGeneralSession();
  if (!isAuth) {
    return { ok: false, error: "No autorizado. Iniciá sesión en el panel general." };
  }

  try {
    const supabase = createCampamentoClient();

    // Consultar todos los inscriptos y todos los pagos en paralelo
    const [inscriptosRes, pagosRes] = await Promise.all([
      supabase
        .from("inscriptos")
        .select("*")
        .order("apellido", { ascending: true })
        .order("nombre", { ascending: true }),
      supabase
        .from("pagos")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
    ]);

    if (inscriptosRes.error) {
      console.error("[obtenerDatosAdminGeneral] Error inscriptos:", inscriptosRes.error);
      return {
        ok: false,
        error: "Error al consultar los inscriptos en la base de datos de campamentos.",
      };
    }

    if (pagosRes.error) {
      console.error("[obtenerDatosAdminGeneral] Error pagos:", pagosRes.error);
      return {
        ok: false,
        error: "Error al consultar los pagos en la base de datos de campamentos.",
      };
    }

    const inscriptosRaw = (inscriptosRes.data || []) as InscriptoCampamento[];
    const pagosRaw = (pagosRes.data || []) as PagoCampamento[];

    // 1. Mapeo rápido de inscriptos por ID para lookup
    const inscriptosMap = new Map<string, InscriptoCampamento>();
    for (const ins of inscriptosRaw) {
      inscriptosMap.set(ins.id, ins);
    }

    // 2. Agrupar pagos por inscripto_id (conservando orden created_at desc)
    const pagosPorInscripto = new Map<string, PagoCampamento[]>();
    for (const p of pagosRaw) {
      const arr = pagosPorInscripto.get(p.inscripto_id) || [];
      arr.push(p);
      pagosPorInscripto.set(p.inscripto_id, arr);
    }

    // 3. Detectar comprobantes compartidos indexando por comprobante_url
    // Mapa: comprobante_url -> Map<inscriptoId, OtroInscriptoComprobante>
    const comprobantesIndex = new Map<string, Map<string, OtroInscriptoComprobante>>();

    for (const p of pagosRaw) {
      const url = p.comprobante_url?.trim();
      if (!url) continue;

      const ins = inscriptosMap.get(p.inscripto_id);
      if (!ins) continue;

      let mapaUrl = comprobantesIndex.get(url);
      if (!mapaUrl) {
        mapaUrl = new Map<string, OtroInscriptoComprobante>();
        comprobantesIndex.set(url, mapaUrl);
      }

      const existente = mapaUrl.get(ins.id);
      const montoTotalIns = (existente ? existente.monto : 0) + (Number(p.monto) || 0);

      mapaUrl.set(ins.id, {
        inscriptoId: ins.id,
        nombre: ins.nombre,
        apellido: ins.apellido,
        dni: ins.dni,
        etapa: ins.etapa,
        destino: ins.destino,
        monto: montoTotalIns,
      });
    }

    // URLs que tienen más de 1 inscripto asociado
    const urlsCompartidas = new Set<string>();
    for (const [url, participantes] of comprobantesIndex.entries()) {
      if (participantes.size > 1) {
        urlsCompartidas.add(url);
      }
    }

    // 4. Transformar cada inscripto con sus datos contables, teléfonos y vínculos
    const inscriptosProcesados: InscriptoAdminGeneral[] = inscriptosRaw.map((ins) => {
      const pagos = pagosPorInscripto.get(ins.id) || [];

      // Pagos aprobados (impactan en recaudación y saldo)
      const totalPagado = pagos
        .filter((p) => p.estado === "APROBADO" || !p.estado)
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

      // Pagos pendientes de revisión
      const montoPendienteRevision = pagos
        .filter((p) => p.estado === "PENDIENTE")
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

      const tarifa = resolverTarifaInscripto(ins);
      const saldoRestante = Math.max(0, tarifa - totalPagado);

      let estadoPago: InscriptoAdminGeneral["estadoPago"] = "PENDIENTE";
      if (totalPagado >= tarifa && tarifa > 0) {
        estadoPago = "PAGADO";
      } else if (totalPagado > 0) {
        estadoPago = "PARCIAL";
      }

      // Historial de teléfonos informados (ordenados temporalmente created_at desc)
      const historialTelefonos: TelefonoInformado[] = [];
      for (const p of pagos) {
        const tel = p.contacto_telefono?.trim();
        if (tel && tel.length > 0) {
          historialTelefonos.push({
            telefono: tel,
            fecha: p.created_at,
            pagoId: p.id,
          });
        }
      }

      // Último teléfono disponible (o null si ningún pago informó teléfono)
      const ultimoTelefono =
        historialTelefonos.length > 0
          ? {
              telefono: historialTelefonos[0].telefono,
              fecha: historialTelefonos[0].fecha,
            }
          : null;

      // Comprobantes compartidos de este inscripto
      let tieneComprobanteCompartido = false;
      const comprobantesCompartidosDetalle: Record<string, OtroInscriptoComprobante[]> = {};

      for (const p of pagos) {
        const url = p.comprobante_url?.trim();
        if (url && urlsCompartidas.has(url)) {
          tieneComprobanteCompartido = true;
          const mapaParticipantes = comprobantesIndex.get(url);
          if (mapaParticipantes) {
            // Filtrar a los otros inscriptos (excluyendo al actual)
            const otros = Array.from(mapaParticipantes.values()).filter(
              (o) => o.inscriptoId !== ins.id
            );
            comprobantesCompartidosDetalle[url] = otros;
          }
        }
      }

      return {
        ...ins,
        tarifa,
        pagos,
        totalPagado,
        saldoRestante,
        estadoPago,
        montoPendienteRevision,
        ultimoTelefono,
        historialTelefonos,
        tieneComprobanteCompartido,
        comprobantesCompartidosDetalle,
      };
    });

    // 5. Cálculo de métricas agregadas globales y desglosadas
    const porDestino: Record<string, DesgloseMetricasCampamento> = {
      Junín: inicializarDesglose(),
      Regina: inicializarDesglose(),
    };

    const porEtapa: Record<string, DesgloseMetricasCampamento> = {};
    for (let e = 1; e <= 7; e++) {
      porEtapa[`${e}`] = inicializarDesglose();
    }

    let totalRecaudadoGlobal = 0;
    let totalPresupuestadoGlobal = 0;
    let totalSaldoPendienteGlobal = 0;
    let conteoPagados = 0;
    let conteoParciales = 0;
    let conteoPendientes = 0;
    let conteoDificultad = 0;
    let conteoConPagosRevision = 0;
    let totalMontoRevision = 0;

    for (const item of inscriptosProcesados) {
      totalRecaudadoGlobal += item.totalPagado;
      totalPresupuestadoGlobal += item.tarifa;
      totalSaldoPendienteGlobal += item.saldoRestante;

      if (item.estadoPago === "PAGADO") conteoPagados++;
      else if (item.estadoPago === "PARCIAL") conteoParciales++;
      else conteoPendientes++;

      if (item.dificultad_pago) conteoDificultad++;
      if (item.montoPendienteRevision > 0) {
        conteoConPagosRevision++;
        totalMontoRevision += item.montoPendienteRevision;
      }

      // Desglose por Destino
      const dKey = item.destino === "Regina" ? "Regina" : "Junín";
      const dest = porDestino[dKey];
      dest.totalInscriptos++;
      dest.totalRecaudado += item.totalPagado;
      dest.totalPresupuestado += item.tarifa;
      dest.totalSaldoPendiente += item.saldoRestante;
      if (item.estadoPago === "PAGADO") dest.conteoPagados++;
      else if (item.estadoPago === "PARCIAL") dest.conteoParciales++;
      else dest.conteoPendientes++;

      // Desglose por Etapa (1 a 7)
      const numEtapa = normalizarEtapa(item.etapa);
      if (numEtapa && porEtapa[numEtapa]) {
        const et = porEtapa[numEtapa];
        et.totalInscriptos++;
        et.totalRecaudado += item.totalPagado;
        et.totalPresupuestado += item.tarifa;
        et.totalSaldoPendiente += item.saldoRestante;
        if (item.estadoPago === "PAGADO") et.conteoPagados++;
        else if (item.estadoPago === "PARCIAL") et.conteoParciales++;
        else et.conteoPendientes++;
      }
    }

    // Calcular porcentajes de cobranza
    const calcPorcentaje = (rec: number, pres: number) =>
      pres > 0 ? Math.round((rec / pres) * 100) : 0;

    const porcentajeCobranzaGlobal = calcPorcentaje(
      totalRecaudadoGlobal,
      totalPresupuestadoGlobal
    );

    for (const dKey of Object.keys(porDestino)) {
      porDestino[dKey].porcentajeCobranza = calcPorcentaje(
        porDestino[dKey].totalRecaudado,
        porDestino[dKey].totalPresupuestado
      );
    }

    for (const eKey of Object.keys(porEtapa)) {
      porEtapa[eKey].porcentajeCobranza = calcPorcentaje(
        porEtapa[eKey].totalRecaudado,
        porEtapa[eKey].totalPresupuestado
      );
    }

    const metricas: MetricasAdminGeneral = {
      totalInscriptos: inscriptosProcesados.length,
      totalRecaudado: totalRecaudadoGlobal,
      totalPresupuestado: totalPresupuestadoGlobal,
      totalSaldoPendiente: totalSaldoPendienteGlobal,
      porcentajeCobranza: porcentajeCobranzaGlobal,
      conteoPagados,
      conteoParciales,
      conteoPendientes,
      conteoDificultad,
      conteoConPagosRevision,
      totalMontoRevision,
      porDestino,
      porEtapa,
    };

    return {
      ok: true,
      inscriptos: inscriptosProcesados,
      metricas,
    };
  } catch (err) {
    console.error(
      "[obtenerDatosAdminGeneral] Error inesperado:",
      err instanceof Error ? err.message : err
    );
    return {
      ok: false,
      error: "Ocurrió un error inesperado al procesar los datos de campamentos.",
    };
  }
}

// ─── Exportación a Excel (.xlsx) ─────────────────────────────────────────────

export interface FiltrosExportacionCampamento {
  destino?: string; // "Junín" | "Regina" | "" (Todos)
  etapa?: string; // "1".."7" | "" (Todas)
  estadoPago?: string; // "TODOS" | "PAGADOS" | "PARCIALES" | "PENDIENTES" | "DIFICULTAD" | "REVISION" | "COMPARTIDO"
  busqueda?: string;
}

export interface ExportarCampamentoResult {
  ok: boolean;
  base64?: string;
  filename?: string;
  total?: number;
  error?: string;
}

export async function exportarCampamentoExcelAction(
  filtros: FiltrosExportacionCampamento = {}
): Promise<ExportarCampamentoResult> {
  const isAuth = await verificarAdminGeneralSession();
  if (!isAuth) {
    return { ok: false, error: "No autorizado. Iniciá sesión en el panel general." };
  }

  try {
    const dataRes = await obtenerDatosAdminGeneral();
    if (!dataRes.ok || !dataRes.inscriptos) {
      return { ok: false, error: dataRes.error || "No se pudieron obtener los datos." };
    }

    let inscriptos = dataRes.inscriptos;

    // Aplicar filtros
    if (filtros.destino && filtros.destino !== "TODOS") {
      inscriptos = inscriptos.filter((i) => i.destino === filtros.destino);
    }

    if (filtros.etapa && filtros.etapa !== "TODAS") {
      const numEtapa = normalizarEtapa(filtros.etapa);
      if (numEtapa) {
        inscriptos = inscriptos.filter((i) => normalizarEtapa(i.etapa) === numEtapa);
      }
    }

    if (filtros.estadoPago && filtros.estadoPago !== "TODOS") {
      if (filtros.estadoPago === "PAGADOS") {
        inscriptos = inscriptos.filter((i) => i.estadoPago === "PAGADO");
      } else if (filtros.estadoPago === "PARCIALES") {
        inscriptos = inscriptos.filter((i) => i.estadoPago === "PARCIAL");
      } else if (filtros.estadoPago === "PENDIENTES") {
        inscriptos = inscriptos.filter((i) => i.estadoPago === "PENDIENTE");
      } else if (filtros.estadoPago === "DIFICULTAD") {
        inscriptos = inscriptos.filter((i) => i.dificultad_pago);
      } else if (filtros.estadoPago === "REVISION") {
        inscriptos = inscriptos.filter((i) => i.montoPendienteRevision > 0);
      } else if (filtros.estadoPago === "COMPARTIDO") {
        inscriptos = inscriptos.filter((i) => i.tieneComprobanteCompartido);
      }
    }

    if (filtros.busqueda && filtros.busqueda.trim().length > 0) {
      const q = filtros.busqueda.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, "");
      inscriptos = inscriptos.filter((i) => {
        const nom = `${i.nombre} ${i.apellido}`.toLowerCase();
        const ape = `${i.apellido} ${i.nombre}`.toLowerCase();
        const tel = i.ultimoTelefono?.telefono.replace(/\D/g, "") || "";
        return (
          nom.includes(q) ||
          ape.includes(q) ||
          (qDigits.length >= 3 && i.dni.includes(qDigits)) ||
          (qDigits.length >= 4 && tel.includes(qDigits))
        );
      });
    }

    if (inscriptos.length === 0) {
      return { ok: true, total: 0 };
    }

    // Ordenar alfabéticamente por apellido y luego por nombre
    inscriptos.sort((a, b) => {
      const compApe = a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" });
      if (compApe !== 0) return compApe;
      return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
    });

    // Armar filas para Excel con encabezados claros y descriptivos
    const headers = [
      "Apellido",
      "Nombre",
      "DNI",
      "Campamento",
      "Etapa",
      "Rol",
      "Tarifa Base",
      "Total Abonado (Aprobado)",
      "Saldo Pendiente",
      "Estado Contable",
      "Pagos en Revisión ($)",
      "Dificultad de Pago",
      "Régimen Alimentario",
      "Detalle Alimentario",
      "Último Teléfono Informado",
      "Fecha Último Teléfono",
      "Quiere Aportar",
      "Contacto Donación",
    ];

    const rows = [
      headers,
      ...inscriptos.map((i) => [
        i.apellido.trim(),
        i.nombre.trim(),
        String(i.dni).trim(),
        i.destino,
        i.etapa,
        i.rol,
        Number(i.tarifa) || 0,
        i.totalPagado,
        i.saldoRestante,
        i.estadoPago,
        i.montoPendienteRevision,
        i.dificultad_pago ? "Sí" : "No",
        i.regimen_alimentario,
        i.detalle_alimentario ? i.detalle_alimentario.trim() : "Ninguno",
        i.ultimoTelefono ? i.ultimoTelefono.telefono : "Sin teléfono registrado",
        i.ultimoTelefono ? formatFecha(i.ultimoTelefono.fecha) : "-",
        i.quiere_aportar ? "Sí" : "No",
        i.contacto_donacion ? i.contacto_donacion.trim() : "-",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Configurar celdas de DNI (Columna C, index 2) como texto para preservar ceros
    for (let r = 1; r <= inscriptos.length; r++) {
      const cellRef = XLSX.utils.encode_cell({ c: 2, r });
      if (ws[cellRef]) {
        ws[cellRef].t = "s";
        ws[cellRef].z = "@";
      }
    }

    // Configurar anchos sugeridos de columnas
    ws["!cols"] = [
      { wch: 22 }, // Apellido
      { wch: 22 }, // Nombre
      { wch: 14 }, // DNI
      { wch: 14 }, // Campamento
      { wch: 14 }, // Etapa
      { wch: 16 }, // Rol
      { wch: 14 }, // Tarifa
      { wch: 22 }, // Abonado
      { wch: 16 }, // Saldo
      { wch: 16 }, // Estado Contable
      { wch: 20 }, // Revisión
      { wch: 18 }, // Dificultad
      { wch: 20 }, // Régimen
      { wch: 30 }, // Detalle Alimentario
      { wch: 24 }, // Último Teléfono
      { wch: 22 }, // Fecha Teléfono
      { wch: 15 }, // Donación
      { wch: 24 }, // Contacto Donación
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inscriptos Campamentos 2027");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const base64 = Buffer.from(buf).toString("base64");

    // Nombre de archivo descriptivo
    const sufijoDestino = filtros.destino ? `-${filtros.destino.toLowerCase()}` : "";
    const sufijoEtapa = filtros.etapa ? `-etapa-${filtros.etapa}` : "";
    const filename = `campamentos-2027-inscriptos${sufijoDestino}${sufijoEtapa}.xlsx`;

    return {
      ok: true,
      total: inscriptos.length,
      base64,
      filename,
    };
  } catch (err) {
    console.error(
      "[exportarCampamentoExcelAction] Error inesperado:",
      err instanceof Error ? err.message : err
    );
    return {
      ok: false,
      error: "Ocurrió un error inesperado al generar el archivo Excel.",
    };
  }
}
