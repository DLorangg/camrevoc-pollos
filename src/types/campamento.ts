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

export interface PagoCampamento {
  id: string;
  created_at: string;
  inscripto_id: string;
  monto: number;
  comprobante_url: string | null;
  observaciones: string | null;
  registrado_por: string;
}

export type EstadoPagoParticipante = "PENDIENTE" | "PARCIAL" | "PAGADO";

export interface InscriptoConPagos extends InscriptoCampamento {
  pagos: PagoCampamento[];
  totalPagado: number;
  saldoRestante: number;
  estadoPago: EstadoPagoParticipante;
}

export interface MetricasEtapa {
  totalInscriptos: number;
  totalRecaudado: number;
  totalPresupuestado: number;
  porcentajeCobranza: number;
}
