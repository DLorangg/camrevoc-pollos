# 🐔 CamReVoc — Circuito completo de la Pollada Solidaria

> Guía visual para animadores, coordinadores y mesa de finanzas.
> Sin tecnicismos: esto es todo lo que necesitás saber para que el día del retiro salga redondo.

---

## Diagrama del circuito

```mermaid
flowchart TD

    %% ── ACTORES ──────────────────────────────────────────────────────────────
    COMP(["🧑 Animador / Comprador"])
    ADMIN(["🏦 Mesa de Finanzas\n/pollos/admin"])
    SIST(["⚙️ Sistema CamReVoc"])
    DEST(["👥 Destinatario(s)\n del vale"])
    MESA(["📋 Mesa de Entrega\n(día del retiro)"])

    %% ── PASO 1: VENTA Y DIVISIÓN ─────────────────────────────────────────────
    subgraph P1["   📝  PASO 1 — Venta y División de Vales   "]
        direction TB
        A1["🌐 Entra a camrevoc.com.ar/pollos"]
        A2["✍️ Completa sus datos:\nnombre · WhatsApp · email · etapa"]
        A3["🐔 Elige cantidad de pollos\ny el monto total"]
        A4{"¿Divide el pedido\nen varios vales?"}
        A5["👤 1 vale único\na su nombre"]
        A6["👥 Múltiples vales\ncon destinatarios distintos\n(ej: 1 para mí, 1 para el tío Carlos)"]
        A7["📎 Adjunta comprobante\nde transferencia bancaria\n(obligatorio)"]
        A8["✅ Envía el pedido"]
    end

    %% ── PASO 2: VALIDACIÓN ───────────────────────────────────────────────────
    subgraph P2["   🏦  PASO 2 — Validación Administrativa   "]
        direction TB
        B1["🔔 Llega notificación\nal panel de finanzas"]
        B2["🖼️ Revisan el comprobante\nde transferencia"]
        B3{"¿El pago\nes correcto?"}
        B4["✅ 1 clic: Aprobar pedido"]
        B5["❌ Rechazar con\nmotivo (WhatsApp)"]
    end

    %% ── PASO 3: NOTIFICACIÓN AUTOMÁTICA ──────────────────────────────────────
    subgraph P3["   📨  PASO 3 — Notificación Automática   "]
        direction TB
        C1["📧 Email con vales QR\ndesde pollada@camrevoc.com.ar"]
        C2["📱 Botón Compartir\npor WhatsApp a cada destinatario"]
        C3["🎟️ Cada vale tiene:\ncódigo único · QR · cantidad · destinatario"]
    end

    %% ── PASO 4: DÍA DEL RETIRO ───────────────────────────────────────────────
    subgraph P4["   🍗  PASO 4 — El Día del Retiro   "]
        direction TB
        D1["📲 La persona llega\ncon el QR en el celular"]
        D2{"¿El vale\nestá en el panel?"}
        D3["✅ Mesa escanea o marca\nEntregado en el panel"]
        D4["🍗 Se entregan los pollos\nRegistro automático con hora"]
        D5["⚠️ Vale no retirado\n→ Botón WA directo al vendedor\npara avisar al destinatario"]
        D6["🔄 Seguimiento\nen tiempo real\ndesde /pollos/admin"]
    end

    %% ── CONEXIONES ENTRE PASOS ───────────────────────────────────────────────
    COMP --> A1
    A1 --> A2 --> A3 --> A4
    A4 -->|"No, es todo\npara mí"| A5
    A4 -->|"Sí, para varias\npersonas"| A6
    A5 --> A7
    A6 --> A7
    A7 --> A8

    A8 -->|"Pedido recibido\nen estado Pendiente"| B1
    ADMIN --> B1
    B1 --> B2 --> B3
    B3 -->|"Sí ✅"| B4
    B3 -->|"No ❌"| B5
    B5 -->|"Comprador\ncorrige y reenvía"| A8

    B4 -->|"Trigger automático"| SIST
    SIST --> C1
    SIST --> C2
    C1 --> C3
    C2 --> C3

    C3 -->|"El día del evento"| D1
    DEST --> D1
    D1 --> D2
    D2 -->|"Sí, está cargado"| D3
    D3 --> D4
    D2 -->|"No llegó\no se olvidó"| D5
    D5 --> D6
    D4 --> D6
    MESA --> D3

    %% ── ESTILOS ──────────────────────────────────────────────────────────────
    classDef actor    fill:#1e293b,stroke:#334155,color:#f8fafc
    classDef paso1    fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef paso2    fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef paso3    fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef paso4    fill:#fce7f3,stroke:#db2777,color:#831843
    classDef decision fill:#f0fdf4,stroke:#22c55e,color:#14532d
    classDef warning  fill:#fff7ed,stroke:#f97316,color:#7c2d12
    classDef sistema  fill:#ede9fe,stroke:#7c3aed,color:#3b0764

    class COMP,ADMIN,DEST,MESA actor
    class SIST sistema
    class A1,A2,A3,A5,A6,A7,A8 paso1
    class B1,B2,B4 paso2
    class C1,C2,C3 paso3
    class D1,D3,D4,D6 paso4
    class A4,B3,D2 decision
    class B5,D5 warning
```

---

## ¿Por qué este sistema? Los beneficios clave

### 📵 Cero planillas confusas de papel o Excel desactualizadas

Todos los datos viven en tiempo real en la nube. No más hojas de cálculo que se desactualizan, mensajes de WhatsApp perdidos ni listas de papel que se mojan o se olvidan en casa. Cualquier coordinador que tenga el link `/pollos/admin` ve exactamente el estado actual de cada pedido, en cualquier momento y desde cualquier dispositivo.

---

### 🎟️ Cada pollo tiene un dueño y un código único anti-duplicados

Cuando un animador vende 3 pollos para 3 personas distintas, el sistema genera **3 vales separados**, cada uno con:

- Un **código único** tipo `CRV-A89F` que no se puede repetir ni falsificar.
- Un **código QR** listo para escanear.
- El **nombre del destinatario** que va a retirar (el tío Carlos, la abuela, etc.).

Así es imposible que alguien retire con el mismo vale dos veces, o que haya confusiones sobre quién retiró y quién no.

---

### 📊 Control en tiempo real: pollos cobrados vs. pollos entregados

El panel de administración (`/pollos/admin`) muestra en todo momento:

| Métrica | Qué significa |
|---|---|
| 🐔 **Pollos confirmados** | Pedidos aprobados con pago verificado |
| 💰 **Recaudación aprobada** | Total en pesos de los pagos confirmados |
| ✅ **Pollos entregados** | Vales ya canjeados en la mesa de retiro |
| ⏳ **Por entregar** | Vales aprobados que aún no fueron a buscar |

Si al final del día quedan pollos sin retirar, el equipo de entrega puede tocar el botón de WhatsApp directo al vendedor para que avise al destinatario antes de que sea demasiado tarde.

---

> 💡 **¿Tenés dudas sobre el sistema?** Escribile a Dami Lorang — es el que armó todo esto con mucho amor para que la pollada salga perfecta. 🍗
