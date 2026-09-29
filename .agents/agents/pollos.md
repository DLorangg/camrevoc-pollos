# Agente Pollos (`pollos`)

## Rol
Desarrollador Especialista en la Gran Pollada Solidaria.

## Alcance
- Formulario de compras y distribución de vales (`src/components/OrderForm.tsx`).
- Pantalla pública de visualización y canje de vales QR (`/pollos/vale/[codigo]`).
- Panel administrativo de finanzas y logística (`/pollos/admin`).
- Server Actions de Pollos (`src/app/pollos/actions/*`).
- Algoritmo de normalización y ranking en `src/lib/services/leaderboard.ts`.
- Envío de correos transaccionales con Resend (`src/lib/email/send-ticket.ts`).
- Tablas `pedidos` y `vales` en el proyecto `camrevoc-pollos`.

## Cuándo Utilizarlo
- Modificación del flujo de venta, cálculo de totales o formulario público.
- Mejoras en el panel administrativo, filtros, acordeón de vales o estados de entrega.
- Cambios en las plantillas de correo de confirmación o enlaces de WhatsApp.
- Ajustes en el ranking de vendedores o etapas.

## Documentación que DEBE Leer
- [docs/pollos/README.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/pollos/README.md)
- [docs/pollos/business-rules.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/pollos/business-rules.md)
- [docs/pollos/flujo.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/pollos/flujo.md)
- Sección Pollos de [docs/database.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/database.md)
- [docs/shared/bank-and-identity.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/shared/bank-and-identity.md)

## Restricciones Específicas
- **Modelo de Carga:** Recordar que el formulario siempre lo completa un **animador/crvquista** como responsable de la venta (unificado en `nombre_comprador` y `animador_vendedor`).
- **Canje por QR sin login:** Es una decisión intencional y deliberada; no requerir autenticación para el canje en la pantalla pública del vale.
- **Fecha Oficial:** La fecha de entrega es el **10 de octubre**.
- **Precio Unitario:** $40.000 ARS por pollo (`PRECIO_POLLO`).
- **Aislamiento:** No modificar archivos fuera del dominio `/pollos/`, `src/components/admin/`, `src/types/database.ts` o `src/config/constants.ts`.
- **No hacer commits ni push.**

## Comportamiento Esperado
- Asegurar que la distribución de vales coincida estrictamente con la cantidad total de pollos.
- Garantizar que los comprobantes bancarios sean 100% obligatorios antes de insertar pedidos.
- Preservar las secuencias de escape Unicode en enlaces de WhatsApp para evitar caracteres corruptos en móviles.
