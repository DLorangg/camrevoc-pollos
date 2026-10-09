# Registro de Decisiones de Arquitectura y Negocio (ADR)

Este documento registra las decisiones fundamentales de arquitectura, reglas de negocio y compromisos técnicos tomados a lo largo de la evolución de CAMREVOC, incluyendo las **decisiones humanas definitivas** que rigen el repositorio.

---

## 1. Decisiones Arquitectónicas y Estructurales

### ADR-01: Separación de Supabase en Dos Proyectos
- **Categoría:** Arquitectura / Infraestructura.
- **Contexto:** La institución opera con el plan gratuito de Supabase, el cual impone límites de cuota (500 MB en base de datos y 1 GB en storage), además de pausar proyectos inactivos. Mezclar la pollada con los campamentos generaba riesgo de agotar el almacenamiento de comprobantes y acoplaba dos ciclos de vida institucionales diferentes.
- **Decisión:** Desacoplar la persistencia en dos proyectos Supabase dedicados: `camrevoc-pollos` y `camrevoc-campa`.
- **Estado Actual:** Implementado. `src/lib/supabase/server.ts` gestiona Pollos y `src/lib/supabase/campamento.ts` gestiona Campamentos.
- **Deuda Técnica:** Ninguna. Requiere mantener dos juegos de variables de entorno en producción.

### ADR-02: Eliminación del `basePath: '/pollos'`
- **Categoría:** Enrutamiento / App Router.
- **Contexto:** Inicialmente, el repositorio se construyó exclusivamente para la pollada configurando `basePath: '/pollos'` en `next.config.ts`. Al incorporar Campamentos 2027 bajo el mismo dominio (`camrevoc.com.ar`), el `basePath` global impedía tener rutas en `/campamento/*` y una landing institucional en `/`.
- **Decisión:** Remover `basePath` de `next.config.ts`, trasladar las páginas de la pollada a la subcarpeta `src/app/pollos/` e implementar redirecciones históricas de cortesía (`/admin` → `/pollos/admin`, `/vale/*` → `/pollos/vale/*`).
- **Estado Actual:** Implementado y verificado en `next.config.ts`.
- **Deuda Técnica:** Algunas llamadas a `revalidatePath` en Server Actions de Pollos conservaban la ruta legacy `"/admin"` en lugar de `"/pollos/admin"`.

### ADR-03: Subida de Comprobantes: Cliente Directo (Pollos) vs. Server Action (Campamentos)
- **Categoría:** Integración de Storage.
- **Contexto:** En Pollos se implementó primero la subida directa desde el navegador mediante `@supabase/ssr` con la clave anónima pública (`anon key`), enviando solo las URLs al Server Action. En Campamentos, para no exponer credenciales públicas adicionales en el cliente, se canalizó la subida como `FormData` mediante Server Actions con la `service_role` key.
- **Decisión:** Mantener ambas estrategias según su módulo por estabilidad operativa.
- **Estado Actual:** Coexisten de forma asimétrica pero funcional.
- **Deuda Técnica:** Asimetría arquitectónica entre módulos.

---

## 2. Decisiones del Módulo Pollos

### ADR-04: Modelo de Carga por Animador/Crvquista
- **Categoría:** Regla de Negocio / Formulario.
- **Contexto:** Históricamente se proyectó que el comprador completaría el formulario indicando a qué animador correspondía la venta. En la práctica real del grupo, son los propios animadores y crvquistas quienes venden y cargan los pedidos directamente para acreditar sus puntos.
- **Decisión Humana Definitiva:** El formulario siempre lo completa un **animador/crvquista**, porque registra las ventas que realizó. El pollo puede ser comprado por el propio animador o por un tercero (familiares, amigos). En el formulario se unificó el campo como `"Tu Nombre y Apellido (Vendedor / Responsable)"`, mapeando el valor a `nombre_comprador` y `animador_vendedor`.
- **Estado Actual:** Implementado en `src/components/OrderForm.tsx` (commit `8aa6316`).

### ADR-05: Canje de Vales mediante QR sin Login
- **Categoría:** Seguridad / Operatoria de Retiro.
- **Contexto:** El día del evento en la parrilla y mesa de entrega participan colaboradores, padres y animadores que no tienen credenciales de administrador ni acceso al panel `/pollos/admin`. Exigir autenticación administrativa para escanear y marcar un vale entregado bloquearía el flujo de retiro físico.
- **Decisión Humana Definitiva:** El código QR y su enlace público asociado (`/pollos/vale/[codigo]`) funcionan como **mecanismo práctico de autorización para el retiro**. Cualquier persona con el QR puede visualizar el vale y confirmar la entrega físicamente en dos pasos. **No es una vulnerabilidad a corregir**, sino una decisión operativa deliberada.
- **Estado Actual:** Implementado en `src/app/pollos/vale/[codigo]/page.tsx` con el componente `ConfirmarEntregaButton`.

### ADR-06: Fecha Oficial de la Pollada
- **Categoría:** Regla de Negocio / Comunicación.
- **Contexto:** Existía una discrepancia entre la plantilla de correo de Resend (que mencionaba el sábado 11 de octubre de 2025) y la pantalla web del vale (que mencionaba el sábado 10 de octubre).
- **Decisión Humana Definitiva:** La fecha oficial de retiro de los pollos es el **10 de octubre**.
- **Estado Actual:** Definida como regla de negocio vinculante. La plantilla de correo debe ajustarse cuando se modifique código funcional.

### ADR-07: Comprobante de Transferencia 100% Obligatorio
- **Categoría:** Finanzas / Validación.
- **Contexto:** En eventos anteriores, reservas sin comprobante generaban desfasajes de stock y pollos encargados que nunca se abonaban.
- **Decisión:** Exigir obligatoriamente la carga del archivo de comprobante de transferencia bancaria antes de crear el pedido, bloqueando en el cliente y validando en el Server Action.
- **Estado Actual:** Implementado en `OrderForm.tsx` y `create-order.ts`.

### ADR-08: Normalización Algorítmica del Leaderboard
- **Categoría:** Lógica de Negocio / Ranking.
- **Contexto:** Para no demorar el lanzamiento precargando un padrón rígido de animadores, se permitió texto libre. Esto generaba que `"Juan Pérez"`, `"juan perez"` y `"JUAN PEREZ"` dividieran sus ventas.
- **Decisión:** Crear un motor de normalización en `src/lib/services/leaderboard.ts` que remueve tildes, convierte a minúsculas y colapsa espacios para agrupar puntos, seleccionando la variante con mejor puntuación tipográfica (Title Case) para la vista pública.
- **Estado Actual:** Implementado y operativo.

### ADR-09: Generación Inmediata de Vales
- **Categoría:** Flujo de Datos.
- **Contexto:** Algunos borradores planteaban generar los vales recién al aprobar el pedido.
- **Decisión:** Generar los vales e insertarlos en la tabla `vales` en el mismo momento en que se inserta el `pedido` (con estado inicial `Pendiente`). Esto permite mostrar los códigos y enlaces de WhatsApp al comprador en la pantalla de éxito inmediata, quedando inhabilitados para canje hasta que finanzas apruebe el pago.
- **Estado Actual:** Implementado en `createOrder`.

---

## 3. Decisiones del Módulo Campamentos

### ADR-10: Autogestión Familiar de Pagos por DNI
- **Categoría:** Operatoria / Experiencia de Usuario.
- **Contexto:** Anteriormente los coordinadores recibían cientos de capturas de WhatsApp desordenadas.
- **Decisión:** Crear el portal `/campamento/pagos` donde las familias buscan la ficha del participante usando únicamente su DNI, consultan su saldo en tiempo real, ven observaciones de rechazo previo y suben los comprobantes de transferencia.
- **Estado Actual:** Implementado y operativo.

### ADR-11: PIN Dinámico por Etapa y Auto-Registro de Coordinadores
- **Categoría:** Seguridad / Autenticación.
- **Contexto:** Cada una de las 7 etapas tiene su propio equipo de coordinación y no se deseaba mantener una lista estática en código de los nombres de los coordinadores.
- **Decisión:** Cada etapa tiene un PIN propio en la tabla `etapas_pines`. Los coordinadores escriben su nombre al entrar por primera vez (quedando guardado en `coordinadores_etapa` para selección rápida futura). Se incluye un banner de advertencia si la etapa usa el PIN por defecto y un modal para cambiar el PIN.
- **Estado Actual:** Implementado en `src/app/campamento/actions/coordinacion-auth.ts`.

### ADR-12: Almacenamiento de PINs en Texto Plano (Deuda Técnica Aceptada)
- **Categoría:** Seguridad / Deuda Técnica.
- **Contexto:** Los PINs se almacenan en texto plano en la tabla `etapas_pines` de Supabase sin funciones hash (como bcrypt o argon2).
- **Decisión Humana Definitiva:** Se mantiene el almacenamiento actual de PINs tal como está por ahora para no introducir cambios ni complejidades en esta etapa del proyecto.
- **Clasificación:** **Deuda técnica de seguridad aceptada temporalmente**.

### ADR-13: Soporte para 3 o más Hermanos en Transferencias
- **Categoría:** Flujo Familiar / Pagos.
- **Contexto:** Muchas familias tienen 3 hijos en el grupo y realizan una única transferencia bancaria familiar. El formulario anterior `/campamento/pagos` solo ofrecía desglosar montos para un máximo de 2 participantes.
- **Decisión Humana Definitiva:** El sistema debe soportar **3 o más hermanos** en una misma transferencia/comprobante de manera dinámica.
- **Estado Actual:** Implementado en `src/components/campamento/pagos/FamiliaPagosForm.tsx`.

### ADR-14: Votación Unificada de Diseño para Buzos 2027 sin Padrón Previo
- **Categoría:** Producto / Módulo Buzos.
- **Contexto:** Se requiere definir urgentemente un único diseño colectivo de buzos para animadores y coordinadores para cotizarlo y presupuestarlo. No se cuenta con un padrón digital previo de animadores cargado en el sistema ni se desean vincular cuentas en esta etapa.
- **Decisión Humana Definitiva:** 
  1. La votación se identifica mediante DNI (7 a 9 dígitos numéricos) sin validación contra inscriptos de Campamentos.
  2. Un único voto por DNI (con posibilidad de modificarlo mientras la votación permanezca abierta mediante `upsert`).
  3. Los buzos y campamentos se mantienen desacoplados por ahora (no vincular saldos a favor ni pedidos).
  4. La votación tiene fecha de cierre estricta configurable y panel administrativo `/buzos/admin` protegido por contraseña.
  5. Si el diseño de frente elegido posee frase, el dorso se inhabilita automáticamente (`atras = null`). Si no posee frase, se vota el dorso. CRV en manga y color se votan de forma independiente.
- **Estado Actual:** Implementado en `/buzos` y `/buzos/admin`. Persistencia en tabla `buzos_votos` (`camrevoc-pollos`).

### ADR-15: Soporte Transversal para Pagos en Efectivo en Pollos y Campamentos
- **Categoría:** Pagos / Transversal (Pollos y Campamentos).
- **Contexto:** Las operaciones contemplaban exclusivamente transferencias bancarias directas con comprobante bancario. En la práctica comunitaria, es habitual que familias o compradores abonen en efectivo en mano a coordinadores o animadores específicos.
- **Decisión:**
  1. Preservar intactos los flujos preexistentes (transferencia bancaria por defecto).
  2. Agregar la opción "¿Es pago en efectivo?" en los formularios de Pollos (`OrderForm`) y Campamentos (`FamiliaPagosForm`, `GestionPagosModal`).
  3. Exigir obligatoriamente el campo libre "¿Quién recibió el dinero?" (`recibido_por`) cuando se marca efectivo, sin relaciones rígidas a tablas de usuarios.
  4. Mantener la obligatoriedad estricta del comprobante: para efectivo se exige foto del recibo de papel o talón firmado.
  5. Los pagos en efectivo ingresan siempre en estado `PENDIENTE` y no impactan en saldos o vales hasta ser auditados por coordinación (sin auto-aprobación).
  6. Destacar visualmente los pagos en efectivo en los paneles de administración y permitir que coordinación edite el medio de pago o el cobrador antes de aprobar.
- **Estado Actual:** Resuelto / Implementado. Columnas `es_efectivo` (boolean, default false) y `recibido_por` (text, nullable) en tablas `pedidos` y `pagos`.

### ADR-16: Cierre Automático de Venta de Pollos por Fecha Límite
- **Categoría:** Regla de Negocio / Pollos.
- **Contexto:** La preventa de la Gran Pollada requería una fecha límite estricta de cierre para congelar encargos y coordinar los insumos con la parrilla.
- **Decisión:**
  1. Cierre automático programado para el **martes 27 de octubre de 2026 a las 23:59:59 (`America/Argentina/Buenos_Aires`)**.
  2. Centralizado en `src/config/constants.ts` mediante `FECHA_CIERRE_VENTA_POLLOS_ISO` y la función `isVentaPollosCerrada()`.
  3. Doble bloqueo: la página `/pollos` sustituye dinámicamente el formulario por el mensaje institucional de agradecimiento, y la Server Action `createOrder` valida la fecha en el servidor impidiendo cualquier inserción extemporánea.
  4. El panel administrativo (`/pollos/admin`) y el canje físico de vales por QR (`/pollos/vale/[codigo]`) continúan funcionando con posterioridad a la fecha límite sin alteraciones.
- **Estado Actual:** Resuelto / Implementado.

### ADR-17: Convivencia Familiar 2026 como módulo independiente
- **Categoría:** Arquitectura / Producto / Seguridad.
- **Contexto:** Se necesitaba inscribir familias a la Convivencia del 17/10/2026 con integrantes múltiples, datos de salud y menores, sin pagos en la web.
- **Decisión:**
  1. Nuevo módulo `/convivencia` aislado de Pollos, Campamentos y Buzos, en el proyecto Supabase `camrevoc-pollos` con tablas propias `convivencia_inscripciones` / `convivencia_integrantes` (no se reutiliza ninguna tabla existente).
  2. Persistencia atómica e idempotente mediante la función SQL `convivencia_registrar_inscripcion` (clave `envio_id`); el éxito solo se informa si la base lo confirma.
  3. Cierre automático el 16/10/2026 23:59:59 ART, centralizado en `src/config/convivencia.ts` y validado con el reloj del servidor en la página y en la Server Action. La consulta administrativa no se restringe por fecha.
  4. Datos personales (DNI, salud, menores) protegidos: RLS sin políticas y sin permisos para `anon`/`authenticated`; acceso solo vía Service Role en servidor. Sin consultas públicas.
  5. Panel `/convivencia/admin` con contraseña propia (`CONVIVENCIA_ADMIN_PASSWORD`, o `ADMIN_PASSWORD` como fallback). La cookie `convivencia_admin_session` contiene un HMAC-SHA256 derivado de la contraseña (no un valor fijo), por lo que no puede falsificarse sin conocerla y cambiar la contraseña invalida las sesiones.
  6. No se gestionan pagos: solo se informa $15.000 por familia, en efectivo el día del evento.
- **Limitaciones conocidas (sin roles nuevos):** contraseña compartida única (sin usuarios individuales ni auditoría por persona) y sin límite de intentos de login.
- **Pendiente (`REQUIERE DECISIÓN` / contenido externo):** documento de autorización firmada para menores sin adulto de su familia; al disponerse, completar `CONVIVENCIA_AUTORIZACION_MENORES` en `src/config/convivencia.ts`.
- **Estado Actual:** Implementado en código; **la migración `docs/convivencia/schema.sql` debe ejecutarse manualmente en `camrevoc-pollos`** para operar.

---

## 4. Matriz de Estado de Decisiones

| Código | Asunto | Módulo | Estado |
|---|---|---|---|
| ADR-01 | Supabase desacoplado en dos proyectos | General | Resuelto / Implementado |
| ADR-02 | Eliminación de basePath global | General | Resuelto / Implementado |
| ADR-03 | Estrategia de subida de Storage asimétrica | General | Resuelto / Operativo |
| ADR-04 | Carga de ventas por animador/crvquista | Pollos | Decisión definitiva / Implementado |
| ADR-05 | Canje por QR sin login (autorización práctica) | Pollos | Decisión definitiva / Implementado |
| ADR-06 | Fecha oficial de retiro: 10 de octubre | Pollos | Decisión definitiva (pendiente update email) |
| ADR-07 | Comprobante 100% obligatorio | Pollos / Campa | Resuelto / Implementado |
| ADR-08 | Normalización algorítmica de ranking | Pollos | Resuelto / Implementado |
| ADR-09 | Generación inmediata de vales en Pendiente | Pollos | Resuelto / Implementado |
| ADR-10 | Autogestión familiar por DNI | Campamentos | Resuelto / Implementado |
| ADR-11 | PIN dinámico y auto-registro de coordinadores | Campamentos | Resuelto / Implementado |
| ADR-12 | PINs en texto plano | Campamentos | **Deuda técnica aceptada** |
| ADR-13 | Soporte para 3 o más hermanos | Campamentos | Resuelto / Implementado |
| ADR-14 | Votación unificada de diseño sin padrón para Buzos 2027 | Buzos | Resuelto / Implementado |
| ADR-15 | Soporte transversal para pagos en efectivo | Transversal | Resuelto / Implementado |
| ADR-16 | Cierre automático de venta de pollos por fecha límite | Pollos | Resuelto / Implementado |
| ADR-17 | Convivencia Familiar 2026 como módulo independiente | Convivencia | Implementado (migración SQL pendiente de ejecución manual) |
