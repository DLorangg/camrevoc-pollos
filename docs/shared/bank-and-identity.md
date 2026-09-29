# Identidad Institucional y Datos Bancarios Compartidos

Este documento reúne los activos gráficos, la identidad institucional y los datos bancarios transversales que comparten los módulos de **Pollos** y **Campamentos** dentro de la Casa Salesiana Don Bosco Neuquén.

---

## 1. Identidad Institucional

- **Organización:** CamReVoc (Campamentos Recreativos Vocacionales).
- **Institución:** Casa Salesiana Don Bosco — Neuquén, Argentina.
- **Lema / Subtítulo:** *"Casa Salesiana Don Bosco · Neuquén · CamReVoc"*.
- **Autoría / Mantenimiento:** Diseñado con ❤️ por Dami Lorang.

### Activos Gráficos Oficiales

Ambos módulos consumen los mismos archivos estáticos ubicados en el directorio [public/](file:///mnt/HDD/proyectos/camrevoc-pollos/public):

| Archivo | Visualización | Descripción |
|---|---|---|
| `public/logo.png` | Emblema CamReVoc | Logo oficial del grupo juvenil. Utilizado como favicon, icono de aplicación, encabezados y en emails transaccionales. |
| `public/salesianos.png` | Isotipo Don Bosco | Logo oficial de los Salesianos de Don Bosco Neuquén. Se empareja junto al logo institucional en las cabeceras públicas. |

---

## 2. Cuenta Bancaria Oficial de Recaudación

Todos los pagos (tanto de compras de pollos como de cuotas de campamentos) se transfieren a la misma cuenta corriente bancaria de la institución en el **Banco Santander**:

| Campo | Valor Oficial | Notas de Uso |
|---|---|---|
| **Banco** | `Santander` | Entidad bancaria oficial. |
| **Titular** | `ISSFJ DON BOSCO NEUQUEN` | Razón social formal para corroborar destino en homebanking. |
| **CUIT** | `30610171601` | CUIT institucional. |
| **CBU** | `0720124620000002236168` | Clave Bancaria Uniforme (22 dígitos). |
| **Alias** | `GRUPOSDBNQN` | **Alias recomendado** para transferencias inmediatas. |

### Motivo / Referencia Sugerida por Módulo

Aunque la cuenta es idéntica, el motivo sugerido cambia según el módulo para facilitar la conciliación en el extracto bancario de la administración:

- **Pollos:** `POLLADACRV` (definido en [src/config/constants.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/config/constants.ts)).
- **Campamentos:** `CRV` (definido en [src/config/campamento.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/config/campamento.ts)).

---

## 3. Convenciones Compartidas de Formateo

### Moneda Argentina (ARS)
Ambos módulos utilizan formateadores con separadores de miles estándar para Argentina:
```ts
new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(monto);
// Ej: "$ 40.000" o "$ 550.000"
```

### Limpieza de Teléfonos y WhatsApp
Para abrir conversaciones directas de WhatsApp desde enlaces web:
- Se remueven caracteres no numéricos: `telefono.replace(/\D/g, "")`.
- Se generan enlaces nativos a `https://api.whatsapp.com/send?phone=...&text=...`.
- Se evita el uso de `<Link>` de Next.js en estos hipervínculos externos para no alterar la codificación de caracteres especiales.
