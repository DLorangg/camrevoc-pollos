# Base de Datos y Persistencia (Supabase)

CAMREVOC utiliza dos proyectos independientes de **Supabase (PostgreSQL + Storage)** para respetar los límites del plan gratuito y mantener los dominios de datos aislados.

---

## 1. Proyecto: `camrevoc-pollos`

- **Propósito:** Gestión de pedidos de la pollada, vales digitales, canjes y ranking.
- **Acceso:**
  - Cliente anónimo browser (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) utilizado en [src/components/OrderForm.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/OrderForm.tsx) exclusivamente para subir comprobantes.
  - Cliente servidor con privilegios (`SUPABASE_SERVICE_ROLE_KEY`) en [src/lib/supabase/server.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/lib/supabase/server.ts) para todas las Server Actions.
- **Nota Histórica:** No existía ningún archivo `.sql` previo en el repositorio para este proyecto. El esquema se formaliza a continuación a partir del código TypeScript y las consultas activas.

### Tablas

#### 1. `pedidos`
Almacena la cabecera de la compra realizada y atribuida al animador/vendedor.

| Columna | Tipo PostgreSQL | TypeScript | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | `string` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único del pedido. |
| `created_at` | `TIMESTAMPTZ` | `string` | `DEFAULT now() NOT NULL` | Fecha y hora de creación. |
| `nombre_comprador` | `TEXT` | `string` | `NOT NULL` | Nombre cargado en el formulario (unificado con el animador vendedor). |
| `whatsapp` | `TEXT` | `string` | `NOT NULL` | Teléfono de contacto / WhatsApp. |
| `email` | `TEXT` | `string` | `NOT NULL` | Correo electrónico para el envío de vales (normalizado en minúsculas). |
| `etapa` | `TEXT` | `string` | `NOT NULL` | Etapa seleccionada (ej. `"3ra Etapa"`, `"Animadores"`). |
| `animador_vendedor` | `TEXT` | `string` | `NOT NULL` | Nombre del vendedor para el cómputo en el ranking (idéntico a `nombre_comprador`). |
| `cantidad_total` | `INTEGER` | `number` | `NOT NULL CHECK (cantidad_total > 0)` | Cantidad total de pollos adquiridos. |
| `comprobantes_urls` | `TEXT[]` | `string[]` | `NOT NULL` | Array de URLs públicas de los comprobantes adjuntos en Storage. |
| `estado_pago` | `TEXT` | `"Pendiente" \| "Aprobado" \| "Rechazado"` | `DEFAULT 'Pendiente' NOT NULL` | Estado de conciliación del pago. |
| `aprobado_por` | `TEXT` | `string \| null` | `NULL` | Operador que aprobó, o detalle con motivo en caso de rechazo. |
| `revisado_at` | `TIMESTAMPTZ` | `string \| null` | `NULL` | Fecha y hora en que se auditó el pedido. |
| `es_efectivo` | `BOOLEAN` | `boolean` | `DEFAULT false NOT NULL` | `true` si el pago se realizó en efectivo en mano; `false` si fue transferencia bancaria. |
| `recibido_por` | `TEXT` | `string \| null` | `NULL` | Nombre/apodo de la persona que cobró el dinero en mano (obligatorio si `es_efectivo` es `true`). |

> **Nota sobre `estado_entrega` en `pedidos`:** En [src/app/pollos/actions/vale-actions.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/pollos/actions/vale-actions.ts) el código intenta actualizar condicionalmente una columna `estado_entrega` en `pedidos` cuando se retiran todos los vales. Sin embargo, dicha columna no forma parte de la interfaz en [src/types/database.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/types/database.ts) y su ausencia en base de datos es capturada de forma defensiva sin interrumpir la ejecución.

#### 2. `vales`
Almacena los vales individuales emitidos para cada pedido.

| Columna | Tipo PostgreSQL | TypeScript | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | `string` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único del vale. |
| `pedido_id` | `UUID` | `string` | `NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE` | Clave foránea hacia el pedido cabecera. |
| `codigo` | `TEXT` | `string` | `UNIQUE NOT NULL` | Código único público (ej: `"CRV-A89F"`, 4 caracteres nanoid). |
| `cantidad_pollos` | `INTEGER` | `number` | `NOT NULL CHECK (cantidad_pollos > 0)` | Pollos habilitados para retirar con este vale. |
| `destinatario` | `TEXT` | `string \| null` | `NULL` | Nombre de la persona autorizada a retirar. |
| `estado_entrega` | `TEXT` | `"Pendiente" \| "Entregado"` | `DEFAULT 'Pendiente' NOT NULL` | Estado del vale en la mesa de retiro. |
| `entregado_at` | `TIMESTAMPTZ` | `string \| null` | `NULL` | Timestamp exacto en que se canjeó físicamente. |

#### 3. `buzos_votos`
Almacena los votos individuales de los animadores y coordinadores para la elección del diseño único de Buzos 2027.

| Columna | Tipo PostgreSQL | TypeScript | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | `string` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único del voto. |
| `dni` | `TEXT` | `string` | `UNIQUE NOT NULL` | DNI del votante (un solo voto activo por DNI). |
| `frente` | `TEXT` | `string` | `NOT NULL` | ID del diseño de frente seleccionado. |
| `atras` | `TEXT` | `string \| null` | `NULL` | ID del diseño de espalda (NULL si frente tiene frase). |
| `crv_manga` | `BOOLEAN` | `boolean` | `DEFAULT false NOT NULL` | Elección de incluir el logo CRV en la manga. |
| `color` | `TEXT` | `string` | `NOT NULL` | ID del color oficial seleccionado (PETROLEO, MALBEC, etc.). |
| `created_at` | `TIMESTAMPTZ` | `string` | `DEFAULT now() NOT NULL` | Fecha de creación del primer voto. |
| `updated_at` | `TIMESTAMPTZ` | `string` | `DEFAULT now() NOT NULL` | Fecha de última modificación del voto. |

> Script DDL de creación disponible en [`docs/buzos/schema.sql`](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/buzos/schema.sql).

#### 4. `convivencia_inscripciones`
Cabecera de la inscripción familiar a la Convivencia Familiar 2026. **Requiere ejecución manual** de [`docs/convivencia/schema.sql`](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/convivencia/schema.sql) en este proyecto.

| Columna | Tipo PostgreSQL | Restricciones / Default | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador de la inscripción. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now() NOT NULL` | Fecha de registro (índice descendente). |
| `envio_id` | `UUID` | `UNIQUE NOT NULL` | Clave de idempotencia generada por el navegador (evita duplicados por reintento). |
| `hay_celiaco` | `BOOLEAN` | `NOT NULL` | Si hay algún integrante celíaco en la familia. |

#### 5. `convivencia_integrantes`
Integrantes de cada inscripción (`ON DELETE CASCADE` desde la cabecera).

| Columna | Tipo PostgreSQL | Restricciones / Default | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador. |
| `inscripcion_id` | `UUID` | `NOT NULL REFERENCES convivencia_inscripciones(id) ON DELETE CASCADE` | Familia. |
| `orden` | `INTEGER` | `NOT NULL CHECK (orden >= 1)`, `UNIQUE (inscripcion_id, orden)` | Posición; 1 = titular. |
| `es_titular` | `BOOLEAN` | `NOT NULL`; un único titular por inscripción (índice parcial) | Persona vinculada a CAMREVOC. |
| `nombre`, `apellido` | `TEXT` | `NOT NULL`, no vacíos | Datos personales. |
| `dni` | `TEXT` | `NOT NULL CHECK (dni ~ '^[0-9]{7,9}$')`, `UNIQUE (inscripcion_id, dni)`, índice por `dni` | DNI normalizado. |
| `edad` | `INTEGER` | `NOT NULL CHECK (edad BETWEEN 0 AND 120)` | Edad. |
| `etapa` | `TEXT` | `CHECK` en `1ra Etapa`…`7ma Etapa`, `Animador/a`; obligatoria para el titular | `NULL` = no pertenece a CAMREVOC. |
| `parentesco` | `TEXT` | `NULL` solo para el titular | Parentesco con el titular. |
| `observaciones_salud` | `TEXT` | `NULL` | Observaciones opcionales. |
| `menor_acompanado` | `BOOLEAN` | Solo para `edad < 18`, `NULL` en adultos | Si el menor asiste con un adulto de su familia. |
| `emergencia_nombre`, `emergencia_vinculo`, `emergencia_telefono` | `TEXT` | Los tres `NULL` o los tres completos | Contacto de emergencia. |

**Función `convivencia_registrar_inscripcion(p_envio_id, p_hay_celiaco, p_integrantes jsonb)`:** inserta cabecera + integrantes en una única transacción y es idempotente por `envio_id`. `EXECUTE` solo para `service_role`.

**Seguridad:** RLS habilitado **sin políticas** y `REVOKE ALL` a `anon`/`authenticated` en ambas tablas: solo el Service Role (Server Actions) accede. El módulo no usa Storage ni toca `pedidos`, `vales`, `buzos_votos`.

### Storage
- **Bucket:** `comprobantes`
- **Configuración:** Público.
- **Acceso:** Subida directa desde el navegador mediante cliente Supabase anon (`upload(fileName, file)`), obteniendo la URL pública con `getPublicUrl(fileName)`.

### RLS en `camrevoc-pollos`
- `NO DOCUMENTADO` formalmente en scripts SQL históricos del repositorio. Las Server Actions operan con `SUPABASE_SERVICE_ROLE_KEY` eludiendo RLS en el servidor. La tabla `buzos_votos` cuenta con RLS habilitado de forma defensiva.

---

## 2. Proyecto: `camrevoc-campa`

- **Propósito:** Inscripción a Campamentos 2027, portal familiar de autogestión de pagos por DNI, seguridad por PIN y dashboard de coordinación por etapa.
- **Acceso:** Exclusivamente en el servidor mediante `createCampamentoClient()` en [src/lib/supabase/campamento.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/lib/supabase/campamento.ts) utilizando `CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY`. No existe cliente de navegador público para este proyecto.

### Tablas

#### 1. `inscriptos`
Padrón de participantes de los campamentos de verano 2027.

| Columna | Tipo PostgreSQL | TypeScript | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | `string` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador del participante. |
| `created_at` | `TIMESTAMPTZ` | `string` | `DEFAULT now() NOT NULL` | Fecha de inscripción. |
| `apellido` | `TEXT` | `string` | `NOT NULL` | Apellido según DNI. |
| `nombre` | `TEXT` | `string` | `NOT NULL` | Nombre completo según DNI. |
| `dni` | `TEXT` | `string` | `UNIQUE NOT NULL` | Clave unívoca numérica (7 a 9 dígitos). |
| `etapa` | `TEXT` | `string` | `NOT NULL` | Etapa guardada con formato (ej: `"1ra Etapa"`). |
| `rol` | `TEXT` | `RolCampamento` | `NOT NULL` | `"CRVQUISTA"`, `"ANIMADOR"` o `"COORDINADOR"`. |
| `destino` | `TEXT` | `string` | `NOT NULL` | `"Junín"` o `"Regina"`. |
| `tarifa` | `INTEGER` | `number` | `NOT NULL` | Tarifa base ($550.000 para Junín, $200.000 para Regina). |
| `dificultad_pago` | `BOOLEAN` | `boolean` | `DEFAULT false` | Indicador pastoral/social declarativo. |
| `regimen_alimentario` | `TEXT` | `RegimenAlimentario` | `DEFAULT 'Omnívoro'` | Régimen nutricional. |
| `detalle_alimentario` | `TEXT` | `string \| null` | `NULL` | Alergias o restricciones (obligatorio si régimen es `"Otros"`). |
| `quiere_aportar` | `BOOLEAN` | `boolean` | `DEFAULT false` | Voluntad de donar dinero o insumos. |
| `contacto_donacion` | `TEXT` | `string \| null` | `NULL` | Teléfono / nombre para coordinar la donación. |

#### 2. `pagos`
Registro de transferencias bancarias o cuotas informadas por las familias o cargadas por coordinación.

| Columna | Tipo PostgreSQL | TypeScript | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | `string` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único del pago. |
| `created_at` | `TIMESTAMPTZ` | `string` | `DEFAULT now() NOT NULL` | Timestamp de subida o registro. |
| `inscripto_id` | `UUID` | `string` | `NOT NULL REFERENCES inscriptos(id) ON DELETE CASCADE` | Clave foránea al participante. |
| `monto` | `INTEGER` / `NUMERIC` | `number` | `NOT NULL CHECK (monto > 0)` | Monto imputado al participante. |
| `comprobante_url` | `TEXT` | `string \| null` | `NULL` | URL pública del archivo en Storage. |
| `observaciones` | `TEXT` | `string \| null` | `NULL` | Notas de la familia o del coordinador. |
| `registrado_por` | `TEXT` | `string \| null` | `NULL` | Nombre del coordinador si fue manual. |
| `estado` | `TEXT` | `EstadoPagoRegistro` | `DEFAULT 'APROBADO' NOT NULL` | `"PENDIENTE"`, `"APROBADO"` o `"RECHAZADO"`. |
| `subido_por` | `TEXT` | `SubidoPor` | `DEFAULT 'COORDINADOR' NOT NULL` | `"FAMILIA"` o `"COORDINADOR"`. |
| `contacto_telefono` | `TEXT` | `string \| null` | `NULL` | Teléfono de WhatsApp provisto por la familia al subir. |
| `verificado_por` | `TEXT` | `string \| null` | `NULL` | Nombre del coordinador que aprobó/rechazó. |
| `verificado_at` | `TIMESTAMPTZ` | `string \| null` | `NULL` | Momento de la auditoría. |
| `motivo_rechazo` | `TEXT` | `string \| null` | `NULL` | Explicación requerida en caso de rechazo. |
| `es_efectivo` | `BOOLEAN` | `boolean` | `DEFAULT false NOT NULL` | `true` si el pago fue en mano en efectivo; `false` si fue transferencia bancaria. |
| `recibido_por` | `TEXT` | `string \| null` | `NULL` | Nombre/apodo de la persona que cobró el dinero en mano (obligatorio si `es_efectivo` es `true`). |

#### 3. `etapas_pines`
Control de credenciales de acceso por etapa para coordinadores.

| Columna | Tipo PostgreSQL | TypeScript | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `etapa` | `TEXT` | `string` | `PRIMARY KEY` | Número de etapa como string (`"1"` a `"7"`). |
| `pin` | `TEXT` | `string` | `NOT NULL` | Clave de acceso almacenada en texto plano (*deuda técnica*). |
| `es_default` | `BOOLEAN` | `boolean` | `DEFAULT true NOT NULL` | `true` si mantiene el PIN inicial (`crv2027-e[X]`). |
| `updated_at` | `TIMESTAMPTZ` | `string` | `DEFAULT now() NOT NULL` | Última actualización de la contraseña. |

#### 4. `coordinadores_etapa`
Registro dinámico de nombres de coordinadores que han ingresado a cada etapa para poblar selectores rápidos.

| Columna | Tipo PostgreSQL | TypeScript | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | `string` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador. |
| `created_at` | `TIMESTAMPTZ` | `string` | `DEFAULT now() NOT NULL` | Fecha de primer registro. |
| `etapa` | `TEXT` | `string` | `NOT NULL` | Número de etapa como string (`"1"` a `"7"`). |
| `nombre` | `TEXT` | `string` | `NOT NULL` | Nombre ingresado por el coordinador. |
| **Restricción** | `UNIQUE(etapa, nombre)` | - | Evita duplicar el mismo nombre en la misma etapa. |

### Storage
- **Bucket:** `comprobantes-campa`
- **Configuración:** Público.
- **Acceso:** Subida gestionada en el servidor por el Server Action `subirPagoFamilia` o `registrarPagoCampamento` usando el cliente con Service Role. Los archivos se estructuran en carpetas `familias/{timestamp}-{filename}` o `{etapaNum}/{inscriptoId}/{timestamp}-{filename}`.

---

## 3. Discrepancias Detectadas vs. `docs/campamento-schema.sql`

El archivo [docs/campamento-schema.sql](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/campamento-schema.sql) es un documento histórico y de referencia parcial. Presenta las siguientes diferencias con el código real en producción:

1. **Columna `fecha` en `pagos`:** La documentación histórica mencionaba una columna `fecha`; en base de datos y código TypeScript solo existe `created_at`.
2. **Defaults de `pagos`:** El SQL histórico define `DEFAULT 'APROBADO'` y `DEFAULT 'COORDINADOR'`. Cuando una familia sube un comprobante mediante el Server Action, el código sobreescribe explícitamente `estado: 'PENDIENTE'` y `subido_por: 'FAMILIA'`.
3. **Tipo de datos de `etapa`:** En algunos borradores se asumió `INTEGER CHECK (etapa BETWEEN 1 AND 7)`. En el código real y en el SQL definitivo, `etapa` es `TEXT` tanto en `etapas_pines` como en `coordinadores_etapa`.
4. **Vistas SQL:** La vista mencionada en documentos anteriores `vista_inscriptos_saldos` **no existe** en la base de datos. Todos los cálculos contables (total abonado, saldo restante y estado `PENDIENTE/PARCIAL/PAGADO`) se calculan en memoria en los Server Actions de Next.js.
5. **RLS:** Las políticas de Row Level Security para `camrevoc-campa` no están plasmadas en el archivo SQL y figuran como `NO DOCUMENTADO`.
