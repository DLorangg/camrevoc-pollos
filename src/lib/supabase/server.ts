import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la Service Role Key.
 *
 * ⚠️  SOLO para uso en Server Actions, Route Handlers o scripts del servidor.
 *     Nunca importar este módulo desde un Client Component.
 *
 * Este cliente **no** usa `@supabase/ssr` (no necesita cookies ni sesión
 * del usuario) porque opera con privilegios de servicio — elude las
 * Row Level Security (RLS) policies y tiene acceso completo a la base de datos.
 *
 * Usa `@supabase/supabase-js` directamente, ya que la gestión de sesiones
 * por cookie no aplica cuando usamos la service_role key.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Verificá tu archivo .env.local.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
