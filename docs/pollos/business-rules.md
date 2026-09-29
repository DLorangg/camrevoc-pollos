# Reglas de Negocio — Módulo Pollos

Este documento compila las reglas comerciales, operativas y de validación que gobiernan la Gran Pollada Solidaria.

---

## 1. Carga de Ventas y Vendedores

1. **Responsable de la Carga:** El formulario de ventas es completado siempre por un **animador o crvquista**, quien vuelca las ventas que ha conseguido para colaborar con la recaudación comunitaria.
2. **Identidad del Comprador:** El pollo puede ser adquirido por el propio animador o por un tercero (amigos, familiares, vecinos). En el formulario se solicita un único nombre (`"Tu Nombre y Apellido (Vendedor / Responsable)"`), el cual se asigna tanto al campo `nombre_comprador` como a `animador_vendedor` en la base de datos para acreditar el puntaje.
3. **Catálogo de Etapas:** El formulario restringe la selección a 8 categorías cerradas:
   - `1ra Etapa`
   - `2da Etapa`
   - `3ra Etapa`
   - `4ta Etapa`
   - `5ta Etapa`
   - `6ta Etapa`
   - `7ma Etapa`
   - `Animadores` *(nota: la opción histórica "Guía" fue discontinuada y renombrada a "Animadores")*.

---

## 2. Precios, Montos y Comprobantes

1. **Precio Unitario:** Fijado de forma estricta en **\$40.000 ARS** por pollo (`PRECIO_POLLO` en [src/config/constants.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/config/constants.ts)). Todos los cálculos de importes y totales en el panel administrativo multiplican la cantidad de unidades por esta constante.
2. **Cantidad Mínima:** La compra mínima es de 1 pollo.
3. **Comprobante 100% Obligatorio:**
   - En el frontend, el botón de envío permanece inhabilitado o alerta visualmente si no hay un archivo de comprobante seleccionado.
   - En el backend ([src/app/pollos/actions/create-order.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/pollos/actions/create-order.ts)), se valida que el arreglo `comprobantes_urls` contenga al menos una URL válida; de lo contrario, la transacción se cancela antes de insertar en la base de datos.
4. **Datos Bancarios de Destino:** La transferencia debe realizarse a la cuenta del Banco Santander de la institución:
   - Alias: `GRUPOSDBNQN`
   - Motivo sugerido: `POLLADACRV`

---

## 3. Emisión y Distribución de Vales

1. **Balance de Vales:** El comprador/animador puede optar por emitir 1 solo vale por el total o fragmentar el pedido en múltiples vales asignando destinatarios distintos (ej: 1 pollo para sí mismo, 2 pollos para el tío). La sumatoria de pollos de todos los vales debe coincidir **exactamente** con la cantidad total del pedido.
2. **Generación al Crear Pedido:** Los vales se crean e insertan en la tabla `vales` de manera inmediata junto al pedido en estado `Pendiente`.
3. **Identificador Único:** Cada vale genera un código alfanumérico con formato `CRV-XXXX` (alfabeto sin caracteres visualmente ambiguos: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).

---

## 4. Estados del Sistema

### Estados del Pedido (`pedidos.estado_pago`)
- **`Pendiente`:** El pedido fue registrado con comprobante adjunto. Espera conciliación bancaria en `/pollos/admin`. Los vales no están habilitados para retiro aún.
- **`Aprobado`:** La administración verificó el ingreso del dinero en el banco. Habilita los vales para su retiro físico, suma los pollos al ranking y envía el correo transaccional de confirmación.
- **`Rechazado`:** Comprobante inválido, ilegible o pago no acreditado. Requiere ingresar un motivo que se almacena en `aprobado_por`. Los vales quedan inhabilitados.

### Estados del Vale (`vales.estado_entrega`)
- **`Pendiente`:** Vale habilitado pero aún no presentado en la parrilla.
- **`Entregado`:** Vale canjeado físicamente en la mesa de entrega; almacena la fecha y hora exacta en `entregado_at`.

---

## 5. Retiro y Canje de Vales el Día del Evento

1. **Fecha Oficial de Retiro:** **10 de octubre**.
2. **Canje Mediante QR sin Login (Decisión Operativa Intencional):**
   - El código QR del vale funciona como **mecanismo práctico de autorización para el retiro**.
   - Cualquier persona que disponga del QR (el destinatario o el colaborador en la mesa) puede acceder a `/pollos/vale/[codigo]` y confirmar la entrega.
   - **No se exige inicio de sesión ni permisos de administrador** para realizar el canje en la página del vale. Esto permite que voluntarios sin acceso al panel administrativo agilicen la entrega en la parrilla.
   - La acción de entrega cuenta con un modal de confirmación en dos pasos para prevenir clics accidentales.
3. **Canje desde el Panel Administrativo:** Los operadores autenticados en `/pollos/admin` también pueden canjear cualquier vale manualmente desplegando el acordeón de vales de cada fila.

---

## 6. Ranking y Leaderboard de Vendedores

1. **Condición de Cómputo:** Solo los pedidos en estado **`Aprobado`** acumulan pollos vendidos y dinero recaudado para el ranking.
2. **Normalización Algorítmica de Nombres:**
   - Dado que los vendedores se ingresan en texto libre, el sistema unifica ventas bajo una clave calculada mediante `normalizeSellerKey`: eliminación de espacios en los extremos, conversión a minúsculas (`toLowerCase`), remoción de tildes/acentos diacríticos (`normalize('NFD')`) y colapso de espacios intermedios.
   - Ejemplo: `"Damián Lorang"`, `"damian lorang"` y `"DAMIAN  LORANG"` acumulan en la misma posición.
3. **Selección del Nombre Visible:** Para mostrar la versión más prolija en la tabla, el algoritmo evalúa la puntuación del string (`scoreNameFormat`): prioriza nombres en Title Case con tildes correctamente escritas sobre textos en mayúsculas o minúsculas sostenidas.
