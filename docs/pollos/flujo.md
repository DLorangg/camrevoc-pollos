# Circuito y Flujo Operativo — Gran Pollada Solidaria

Este documento detalla el ciclo de vida completo de una venta en el módulo **Pollos**, desde el encargo inicial hasta el canje físico en la parrilla.

---

## 1. Diagrama del Circuito

```mermaid
flowchart TD
    %% Actores
    ANIM(["🧑 Animador / Crvquista"])
    COMP(["👤 Comprador / Tercero"])
    ADMIN(["🏦 Mesa de Finanzas\n(/pollos/admin)"])
    DEST(["🍗 Destinatario del vale"])
    MESA(["📋 Mesa de Entrega\n(Día del retiro: 10/10)"])

    %% Paso 1: Carga
    subgraph P1["PASO 1 — Venta y Registro"]
        A1["Animador concreta la venta"]
        A2["Ingresa a camrevoc.com.ar/pollos"]
        A3["Carga sus datos:\nnombre y apellido · WhatsApp · email · etapa"]
        A4["Define cantidad de pollos ($40.000 c/u)"]
        A5["Distribuye en 1 o varios vales con destinatarios"]
        A6["Adjunta captura de transferencia bancaria"]
        A7["Envía el formulario web"]
    end

    %% Paso 2: Persistencia Inmediata
    subgraph P2["PASO 2 — Registro y Generación"]
        B1["Comprobante sube al bucket 'comprobantes'"]
        B2["Se inserta pedido en estado 'Pendiente'"]
        B3["Se generan e insertan vales 'CRV-XXXX'\nen estado 'Pendiente'"]
        B4["Pantalla de éxito inmediata con botones de WhatsApp"]
    end

    %% Paso 3: Validación Administrativa
    subgraph P3["PASO 3 — Conciliación Bancaria"]
        C1["Operador ingresa a /pollos/admin"]
        C2["Filtra por pestaña 'Pendientes'"]
        C3["Inspecciona comprobante bancario"]
        C4{"¿Pago acreditado?"}
        C5["✅ Aprobar Pedido"]
        C6["❌ Rechazar Pedido (con motivo)"]
    end

    %% Paso 4: Notificación
    subgraph P4["PASO 4 — Notificación Automática"]
        D1["Disparo automático vía Resend"]
        D2["Email desde pollada@camrevoc.com.ar\ncon enlaces directos a cada vale"]
        D3["Animador/Comprador reenvía QR por WhatsApp"]
    end

    %% Paso 5: Retiro Físico (10 de Octubre)
    subgraph P5["PASO 5 — Día del Retiro (10 de Octubre)"]
        E1["Destinatario muestra QR en su celular"]
        E2{"¿Cómo se valida?"}
        E3["Opción A: Escaneo de QR web\nPresiona 'Confirmar Entrega' (sin login)"]
        E4["Opción B: Mesa busca en /pollos/admin\ny marca 'Entregado' en el acordeón"]
        E5["Vale pasa a 'Entregado' con timestamp"]
        E6["Si todos los vales se canjearon:\nPedido pasa a 'Entregados'"]
    end

    ANIM --> A1 --> A2 --> A3 --> A4 --> A5 --> A6 --> A7
    A7 --> B1 --> B2 --> B3 --> B4
    B4 -.->|"Comparte vale"| COMP
    B2 --> C1 --> C2 --> C3 --> C4
    C4 -->|Sí| C5
    C4 -->|No| C6
    C5 --> D1 --> D2 --> D3
    D3 --> DEST
    DEST --> E1 --> E2
    E2 --> E3 --> E5
    E2 --> E4 --> E5
    E5 --> E6
```

---

## 2. Detalle de los Pasos Operativos

### Paso 1: Venta y Carga del Pedido
- El animador o crvquista vende los pollos. El pago se realiza por transferencia al alias `GRUPOSDBNQN` o en **efectivo en mano**.
- El animador entra a `/pollos`.
- Carga su nombre como responsable de la venta, su contacto, email y etapa para acreditar sus puntos en el ranking.
- Especifica la cantidad de pollos y la distribución en vales con los nombres de quienes retirarán.
- **Medio de Pago:**
  - **Transferencia (por defecto):** Realiza la transferencia al Santander y adjunta comprobante bancario.
  - **Efectivo:** Marca "¿Es pago en efectivo?", especifica obligatoriamente quién cobró el dinero en mano (`recibido_por`) y adjunta foto del recibo físico en papel.
- El comprobante es 100% obligatorio en ambos casos.

### Paso 2: Generación Inmediata de Vales
- El archivo se almacena en el bucket `comprobantes` de Supabase.
- Se ejecuta el Server Action `createOrder`:
  - Se registra el pedido en estado `Pendiente` (incluyendo `es_efectivo` y `recibido_por`).
  - Se generan los vales con códigos únicos `CRV-XXXX` en estado `Pendiente`.
- La pantalla muestra la confirmación inmediata con botones de WhatsApp preconfigurados para compartir cada vale al destinatario antes de que el pago sea revisado.

### Paso 3: Validación Administrativa (/pollos/admin)
- El equipo de finanzas inicia sesión con la contraseña maestra y selecciona su nombre de operador.
- En la pestaña **Pendientes**, revisa el comprobante y coteja con la cuenta bancaria (o con el cobrador indicado si fue en efectivo).
- **Indicador de Cobro:** Cada tarjeta/fila muestra visualmente `💵 Efectivo · Recibió: [nombre]` o `🏦 Transferencia`.
- **Edición Previa / Corrección:** El operador cuenta con el botón **Editar** para corregir la **etapa asignada a la venta** (pudiendo reasignar a la categoría especial `"Animadores"` o viceversa), el cobrador en mano o la modalidad de pago antes de aprobar, o utilizar el atajo **Guardar y Aprobar**.
- **Aprobación:** Al aprobar, el pedido cambia a `Aprobado`. Los vales quedan oficialmente habilitados para su canje.
- **Rechazo:** Si el comprobante es ilegible, no coincide el monto o el cobrador desconoce el pago, se rechaza indicando el motivo.

### Paso 4: Notificación por Email y WhatsApp
- Al aprobar, el sistema dispara automáticamente un correo electrónico transaccional vía Resend (`pollada@camrevoc.com.ar`) a la casilla informada en el pedido.
- El correo contiene los enlaces hacia `/pollos/vale/[codigo]`.
- El animador o comprador también puede compartir el enlace individual del vale por WhatsApp a cada destinatario.

### Paso 5: El Día del Retiro (10 de Octubre)
- El sábado **10 de octubre**, el destinatario se presenta en el puesto de entrega mostrando la pantalla del vale con el código QR.
- **Canje Autónomo por QR (Sin Login):** Cualquier persona puede abrir el enlace del vale desde su dispositivo y confirmar la entrega presionando el botón *"✅ CONFIRMAR ENTREGA DE POLLOS"* con confirmación en modal. Esto permite que los colaboradores de la parrilla entreguen sin necesitar claves de administración.
- **Canje desde el Panel:** Alternativamente, un operador en `/pollos/admin` puede buscar el pedido por nombre, vendedor o código y marcar el vale individual como entregado.
- Al canjearse todos los vales de un pedido, este cambia su estado visual a **Entregado** y se traslada a la pestaña correspondiente en el panel.

---

## 3. Discrepancias con Documentación Histórica

| Aspecto | Documentación Histórica / Previa | Realidad del Código Actual |
|---|---|---|
| **Momento de emisión de vales** | Se indicaba que los vales se generaban tras la aprobación administrativa. | Los vales se generan e insertan **al momento de crear el pedido** en estado `Pendiente`. |
| **Separación Comprador/Vendedor** | Se describían campos independientes para quién compra y quién vende. | El formulario unificó los datos en el vendedor responsable (`nombre_comprador` = `animador_vendedor`). |
| **Autenticación en la entrega** | Se especulaba si el canje requería cookies de administrador. | El canje web es **público y sin login**, operando el QR como autorización práctica deliberada. |
| **Fecha de retiro** | En algunas plantillas figuraba 11 de octubre de 2025. | La fecha definitiva fijada por decisión humana es el **10 de octubre**. |
