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

export interface MetricasEtapa {
  totalInscriptos: number;
  totalRecaudado: number;
  totalPresupuestado: number;
  porcentajeCobranza: number;
  pagosPendientesCount: number;
}

