# Módulo Pollos — Gran Pollada Solidaria

El módulo **Pollos** gestiona de punta a punta la preventa, recaudación, emisión de vales digitales QR y entrega física de la tradicional pollada solidaria comunitaria de CamReVoc.

---

## 1. Propósito y Problemática Resuelta

- **Eliminación de planillas manuales:** Centraliza las ventas en una base de datos en la nube accesible en tiempo real.
- **Validación bancaria respaldada:** Exige un comprobante de transferencia bancaria obligatorio antes de registrar cualquier pedido, evitando encargos impagos.
- **Control anti-duplicados y entregas ágiles:** Cada vale tiene un código único (`CRV-XXXX`) con formato web y QR. El retiro en la parrilla se confirma con dos toques y actualiza el stock entregado al instante.

---

## 2. Relación entre Vendedor (Animador/Crvquista) y Comprador

> 📌 **Regla Fundamental del Formulario:**
> El formulario siempre lo completa un **animador/crvquista**, porque registra las ventas que él o ella realizó para su etapa.
> El pollo puede ser comprado por:
> 1. El propio animador/crvquista.
> 2. Otra persona (familiar, vecino, amigo).
>
> Por esta razón, el campo principal del formulario solicita: `"Tu Nombre y Apellido (Vendedor / Responsable)"`. En la base de datos se guarda este mismo nombre tanto en `nombre_comprador` como en `animador_vendedor` para asegurar la correcta acreditación de puntos en el ranking interno.

---

## 3. Rutas de la Aplicación

| Ruta | Acceso | Propósito | Componente Clave |
|---|---|---|---|
| `/pollos` | Público | Formulario de reserva de pollos, división en vales y carga de comprobante. | [OrderForm.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/OrderForm.tsx) |
| `/pollos/vale/[codigo]` | Público | Visualización del vale con QR, estado del pedido y botón para confirmar la entrega física. | [page.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/pollos/vale/%5Bcodigo%5D/page.tsx) |
| `/pollos/admin/login` | Público | Acceso al panel administrativo mediante contraseña maestra. | [page.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/pollos/admin/login/page.tsx) |
| `/pollos/admin` | Protegido (`proxy.ts`) | Panel de control: validación de pagos, métricas, leaderboard y seguimiento de entregas. | [AdminDashboard.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/admin/AdminDashboard.tsx) |

---

## 4. Actores del Módulo

1. **Animador / Crvquista (Vendedor):** Miembro del grupo que realiza la venta, cobra o coordina la transferencia, y completa el formulario web para acreditar sus ventas en el ranking de su etapa.
2. **Comprador / Destinatario del Vale:** Quien paga o retira los pollos. Puede recibir su vale individual por WhatsApp o correo electrónico para presentarlo en el retiro.
3. **Mesa de Finanzas (Administración):** Usuarios autenticados en `/pollos/admin` que concilian el extracto bancario con los comprobantes adjuntos, aprueban o rechazan pedidos.
4. **Mesa de Entrega (Día del Retiro):** Personas en el puesto de entrega que escanean el QR o buscan el pedido en el panel y marcan los pollos como entregados.

---

## 5. Server Actions

Ubicadas en [src/app/pollos/actions/](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/pollos/actions/):

- **`create-order.ts` (`createOrder`):**
  - Valida que la suma de pollos en los vales coincida con el total.
  - Verifica la presencia obligatoria de URLs de comprobantes.
  - Inserta el registro en `pedidos` (`estado_pago = 'Pendiente'`).
  - Genera e inserta de inmediato los registros en `vales` con código aleatorio `CRV-XXXX`.
- **`admin-pedidos.ts`:**
  - `approvePedido(pedidoId)`: Requiere sesión de administrador. Pasa el pedido a `'Aprobado'`, guarda el operador auditor y dispara el email vía Resend.
  - `rejectPedido(pedidoId, motivo)`: Requiere sesión. Pasa el pedido a `'Rechazado'` guardando el motivo.
  - `getDashboardData()`: Requiere sesión. Obtiene pedidos, vales, métricas y calcula el ranking de vendedores normalizado.
- **`vale-actions.ts`:**
  - `getVale(codigo)`: Obtiene los datos del vale y su pedido asociado para la pantalla web pública.
  - `confirmarEntrega(valeId, codigo)`: Marca el vale individual como `'Entregado'` guardando el timestamp en `entregado_at`. **No requiere login administrativo** (el QR funciona como autorización práctica).
- **`admin-auth.ts`:**
  - `loginAdmin(password)`: Compara con `ADMIN_PASSWORD` y establece la cookie `admin_session`.
  - `logoutAdmin()`: Limpia las cookies de sesión y operador.
  - `setOperator(nombre)` / `getOperator()`: Gestiona el nombre del operador activo (`admin_operator`).

---

## 6. Integración con Supabase, Resend y QR

- **Supabase:** Proyecto `camrevoc-pollos`. Tablas `pedidos` y `vales`. Bucket de Storage `comprobantes`.
- **Resend:** Envío transaccional desde `CamReVoc <pollada@camrevoc.com.ar>` implementado en [src/lib/email/send-ticket.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/lib/email/send-ticket.ts). Se dispara automáticamente cuando un pedido pasa a `'Aprobado'`.
- **QR:** Generado reactivamente en cliente con `qrcode.react` en [src/components/ValeQR.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/ValeQR.tsx), apuntando a la URL pública del vale.
