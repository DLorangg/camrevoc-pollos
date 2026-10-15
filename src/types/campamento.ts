import type { RolCampamento, RegimenAlimentario } from "@/config/campamento";

export interface InscriptoCampamento {
  id: string;
  created_at: string;
  apellido: string;
  nombre: string;
  dni: string;
  etapa: string;
  rol: RolCampamento;
  destino: string;
  tarifa: number;
  dificultad_pago: boolean;
  regimen_alimentario: RegimenAlimentario;
  detalle_alimentario: string | null;
  quiere_aportar: boolean;
  contacto_donacion: string | null;
}

export type EstadoPagoRegistro = "PENDIENTE" | "APROBADO" | "RECHAZADO";
export type SubidoPor = "FAMILIA" | "COORDINADOR";

export interface PagoCampamento {
  id: string;
  created_at: string;
  inscripto_id: string;
  monto: number;
  comprobante_url: string | null;
  observaciones: string | null;
  registrado_por: string;
  estado?: EstadoPagoRegistro;
  subido_por?: SubidoPor;
  contacto_telefono?: string | null;
  verificado_por?: string | null;
  verificado_at?: string | null;
  motivo_rechazo?: string | null;
  es_efectivo?: boolean;
  recibido_por?: string | null;
}

export type EstadoPagoParticipante = "PENDIENTE" | "PARCIAL" | "PAGADO";

export interface InscriptoConPagos extends InscriptoCampamento {
  pagos: PagoCampamento[];
  totalPagado: number;
  saldoRestante: number;
  estadoPago: EstadoPagoParticipante;
}

export interface PagoPendienteRevision extends PagoCampamento {
  inscripto: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    etapa: string;
  };
}

export type PagoRechazadoRevision = PagoPendienteRevision;

export interface MetricasEtapa {
  totalInscriptos: number;
  totalRecaudado: number;
  totalPresupuestado: number;
  porcentajeCobranza: number;
  pagosPendientesCount: number;
  pagosRechazadosCount: number;
}

// ─── Tipos para el Panel General de Campamentos (/campamento/admin-general) ───

export interface TelefonoInformado {
  telefono: string;
  fecha: string;
  pagoId: string;
}

export interface OtroInscriptoComprobante {
  inscriptoId: string;
  nombre: string;
  apellido: string;
  dni: string;
  etapa: string;
  destino: string;
  monto: number;
}

export interface InscriptoAdminGeneral extends InscriptoConPagos {
  /** Suma de pagos en estado PENDIENTE informados y aún no aprobados. */
  montoPendienteRevision: number;
  /** Último teléfono válido informado en un pago, con su fecha de registro. */
  ultimoTelefono: { telefono: string; fecha: string } | null;
  /** Historial completo de teléfonos informados en sus pagos (ordenados de más reciente a más antiguo). */
  historialTelefonos: TelefonoInformado[];
  /** Indica si alguno de sus comprobantes es compartido con otros inscriptos. */
  tieneComprobanteCompartido: boolean;
  /** Mapa de comprobante_url -> participantes vinculados a esa misma transferencia. */
  comprobantesCompartidosDetalle: Record<string, OtroInscriptoComprobante[]>;
}

export interface DesgloseMetricasCampamento {
  totalInscriptos: number;
  totalRecaudado: number;
  totalPresupuestado: number;
  totalSaldoPendiente: number;
  porcentajeCobranza: number;
  conteoPagados: number;
  conteoParciales: number;
  conteoPendientes: number;
}

export interface MetricasAdminGeneral {
  totalInscriptos: number;
  totalRecaudado: number;
  totalPresupuestado: number;
  totalSaldoPendiente: number;
  porcentajeCobranza: number;
  conteoPagados: number;
  conteoParciales: number;
  conteoPendientes: number;
  conteoDificultad: number;
  conteoConPagosRevision: number;
  totalMontoRevision: number;
  porDestino: Record<string, DesgloseMetricasCampamento>;
  porEtapa: Record<string, DesgloseMetricasCampamento>;
}


