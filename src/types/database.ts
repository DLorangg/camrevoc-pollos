/**
 * Interfaces de TypeScript para las tablas de Supabase.
 * Reflejan exactamente el esquema definido en la base de datos.
 */

// ---------- Pedidos ----------

export type EstadoPago = "Pendiente" | "Aprobado" | "Rechazado";

export interface Pedido {
  id: string; // uuid
  created_at: string; // timestamptz (ISO-8601)
  nombre_comprador: string;
  whatsapp: string;
  email: string;
  etapa: string; // ej. "Huellas", "Caminantes", etc.
  animador_vendedor: string;
  cantidad_total: number;
  comprobantes_urls: string[];
  estado_pago: EstadoPago;
  aprobado_por: string | null;
  revisado_at: string | null; // timestamptz (ISO-8601) o null
}

/** Campos requeridos al crear un nuevo pedido (el resto lo genera Supabase). */
export type PedidoInsert = Omit<Pedido, "id" | "created_at" | "aprobado_por" | "revisado_at"> & {
  id?: string;
  created_at?: string;
  aprobado_por?: string | null;
  revisado_at?: string | null;
};

/** Campos que se pueden actualizar en un pedido existente. */
export type PedidoUpdate = Partial<Omit<Pedido, "id" | "created_at">>;

// ---------- Vales ----------

export type EstadoEntrega = "Pendiente" | "Entregado";

export interface Vale {
  id: string; // uuid
  pedido_id: string; // FK a pedidos.id
  codigo: string; // único, ej. "CRV-A89F"
  cantidad_pollos: number;
  destinatario: string | null;
  estado_entrega: EstadoEntrega;
  entregado_at: string | null; // timestamptz (ISO-8601) o null
}

/** Campos requeridos al crear un nuevo vale. */
export type ValeInsert = Omit<Vale, "id" | "entregado_at"> & {
  id?: string;
  entregado_at?: string | null;
};

/** Campos que se pueden actualizar en un vale existente. */
export type ValeUpdate = Partial<Omit<Vale, "id" | "pedido_id">>;

// ---------- Relaciones ----------

/** Pedido con sus vales asociados (para consultas con join). */
export interface PedidoConVales extends Pedido {
  vales: Vale[];
}
