# Módulo Convivencia Familiar 2026

Inscripción **por familia** a la *Convivencia Familiar CAMREVOC 2026* (sábado 17 de octubre de 2026, 10:00 a 18:00, Planta de Campamentos N.º 1, Intendente Linares 1980, Neuquén). Módulo independiente de Pollos, Campamentos y Buzos: no comparte datos, reglas ni flujos con ellos.

> **La web NO gestiona pagos.** Solo informa el costo (tarifa escalonada: 1 integrante $5.000, 2 $10.000, 3 o más $15.000 en total) y que el pago es en efectivo el día de la actividad.

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/convivencia` | Público | Información de la actividad, qué llevar y formulario de inscripción. Dinámica (`force-dynamic`): evalúa el cierre en cada request. |
| `/convivencia/admin/login` | Público | Login con contraseña de coordinación. |
| `/convivencia/admin` | Protegido | Panel de inscripciones (búsqueda, filtros, detalle). Redirige al login si no hay sesión válida. |

El Hub (`/`) incluye una tarjeta hacia `/convivencia` y un enlace discreto a `/convivencia/admin`.

## Archivos

- Config única: `src/config/convivencia.ts` (datos de la actividad, fecha de cierre, etapas, lista de qué llevar, estado de la autorización de menores).
- Validación pura compartida cliente/servidor: `src/lib/convivencia/validation.ts`.
- Cliente Supabase (Service Role, solo servidor): `src/lib/supabase/convivencia.ts`.
- Server Actions: `src/app/convivencia/actions/inscripcion.ts` (inscribir) y `admin-actions.ts` (login/logout/consulta).
- UI: `src/components/convivencia/` (`InscripcionForm`, `ActividadInfo`, `AdminDashboard`).
- Tipos: `src/types/convivencia.ts`.
- SQL: [`schema.sql`](./schema.sql).

## Base de datos

Proyecto Supabase **`camrevoc-pollos`** (base principal), tablas propias `convivencia_inscripciones` y `convivencia_integrantes` y la función `convivencia_registrar_inscripcion`. Ver `docs/database.md` y [`schema.sql`](./schema.sql).

## Habilitación manual (pendiente de quien administra Supabase)

1. Ejecutar [`docs/convivencia/schema.sql`](./schema.sql) en el **SQL Editor del proyecto `camrevoc-pollos`** (es idempotente). **Si ya habías ejecutado la versión anterior, volvé a ejecutar el archivo completo**: agrega `es_celiaco` por integrante, hace opcional `hay_celiaco` (sin borrar datos) y reemplaza la función de registro. Hasta ejecutarlo, el código nuevo no puede registrar inscripciones.
2. Verificar que existan las variables de entorno del servidor `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (ya usadas por Pollos/Buzos).
3. Definir la contraseña del panel: `CONVIVENCIA_ADMIN_PASSWORD` (opcional; si falta se usa `ADMIN_PASSWORD`). Sin ninguna de las dos, el login rechaza el acceso.
4. Redesplegar si se agregó una variable de entorno.

Hasta ejecutar el paso 1, enviar el formulario devuelve un error (nunca un falso éxito) y el panel muestra un aviso de consulta fallida.

## Pendiente: autorización para menores

El documento de autorización firmada para menores sin adulto de su familia **aún no existe**. El formulario muestra un aviso informativo y está preparado: al tener el archivo/enlace, completar `CONVIVENCIA_AUTORIZACION_MENORES` en `src/config/convivencia.ts` (`disponible: true`, `url`). No se reutiliza el documento de 2024.
