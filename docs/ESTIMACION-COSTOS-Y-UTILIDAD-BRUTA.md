# Estimación de costos y utilidad bruta – PodoAdmin SaaS

Documento único para estimar costos directos, operativos y utilidad bruta. Usar para fijar precios, comisiones (reseller 45%) y tu pago. **Actualiza aquí las cifras** cuando cambien.

---

## ¿Qué son “costos directos” y “utilidad bruta”?

- **Costos directos** = Todo lo que gastas **solo por tener el producto funcionando**: hosting (Cloudflare), base de datos, almacenamiento, emails, pasarela de pago y, si aplica, costo por cada cliente activo (almacenamiento/uso por clínica). No incluyen tu sueldo, marketing ni oficina.
- **Utilidad bruta** = Lo que te queda **después de restar solo los costos directos** a lo que cobras:
  ```
  Utilidad bruta = Ingresos (suscripciones, etc.) − Costos directos
  ```
  Es el “margen” del producto antes de pagar comisiones al reseller, tu sueldo y el resto de gastos (marketing, renta, etc.). Sirve para ver si el negocio aguanta comisiones + tu pago + otros costos.

---

## Estimación mensual con Cloudflare (propuesta de infraestructura)

Stack actual de PodoAdmin: **Workers** (app + API), **D1** (base de datos), **R2** (archivos/imágenes). Tipo de cambio de referencia: **~18 MXN/USD**.

### Costos Cloudflare estimados (USD y MXN)

| Servicio | Qué incluye | Plan / uso típico | USD/mes | MXN/mes (aprox.) |
|----------|-------------|-------------------|---------|-------------------|
| **Workers Paid** | App + API, requests, CPU | Mínimo $5/mes; incluye 10M requests, luego ~$0.30 por millón extra | 5–15 | 90–270 |
| **D1** (con Workers Paid) | Base de datos SQL | Incluido: 25 000 M lecturas/mes, 50 M escrituras/mes, 5 GB. Exceso: $0.001/M lecturas, $1/M escrituras, $0.75/GB | 0–5 | 0–90 |
| **R2** | Fotos, archivos (egress gratis) | Free: 10 GB, 1 M escrituras, 10 M lecturas. Luego ~$0.015/GB, $4.50/M escrituras | 0–3 | 0–54 |
| **Total Cloudflare (rango bajo–medio)** | | Arranque / pocos clientes | **5–25 USD** | **90–450 MXN** |

- **Escenario “arranque” (pocas clínicas, poco tráfico):** Workers Paid $5 + D1 y R2 dentro de free/incluido → **~$5 USD/mes (~90–100 MXN)**.
- **Escenario “crecimiento” (decenas de clínicas, más requests y almacenamiento):** **~$15–25 USD/mes (~270–450 MXN)**.

### Resumen: costos mensuales solo infra (Cloudflare)

| Escenario | USD/mes | MXN/mes (aprox.) |
|-----------|---------|-------------------|
| Arranque (pocos clientes) | 5 | ~90–100 |
| Crecimiento (varias decenas de clínicas) | 15–25 | ~270–450 |

*Actualizar según factura real de Cloudflare. Proyección detallada mes a mes a 2 años (500 → 1 000 → 1 500 usuarios), solo Cloudflare + dominio, sin pasarela: **`docs/PROYECCION-2-ANOS-CLOUDFLARE.md`**.*

### Ejemplo rápido: utilidad bruta solo con costos Cloudflare

Supón que en un mes cobras **$10 000 MXN** de suscripciones y tus **costos directos** son solo Cloudflare (**$150 MXN**; sin pasarela de pago por ahora).

- **Utilidad bruta** = 10 000 − 150 = **$9 850 MXN**.  
  Eso es lo que “queda del producto” antes de pagar comisiones al reseller (45%), tu sueldo, marketing, etc. Si pagas 45% de comisión al reseller sobre esos ingresos, serían $4 500; te quedarían $5 350 antes de tu sueldo y demás gastos. Por eso es importante que **ingresos > costos directos + comisiones + sueldo + operativos**. (Si más adelante añades pasarela de pago, réstala también de los ingresos.)

---

## 1. Costos directos (infraestructura y por cliente)

### 1.1 Hosting (Cloudflare: Workers + D1 + R2)

| Concepto | Proveedor / nota | Costo mensual (MXN) | Costo anual (MXN) | Dónde se actualiza |
|----------|-------------------|----------------------|-------------------|---------------------|
| Workers (compute + API + assets) | Cloudflare Workers Paid, mín. $5 USD | 90–270 | 1 080–3 240 | **§ 1.1** |
| Base de datos | D1 (incluido con Workers Paid hasta 25B lecturas/mes, 5 GB) | 0–90 | 0–1 080 | **§ 1.1** |
| Almacenamiento archivos | R2 (free 10 GB; luego ~$0.015/GB) | 0–54 | 0–648 | **§ 1.1** |
| CDN / tráfico | Incluido en Workers (egress gratis) | 0 | 0 | **§ 1.1** |
| **Subtotal hosting (Cloudflare)** | Ver tabla “Estimación mensual con Cloudflare” arriba | **90–450** | **1 080–5 400** | |

---

### 1.2 Licencias de terceros

| Concepto | Proveedor | Costo mensual (MXN) | Costo anual (MXN) | Dónde se actualiza |
|----------|-----------|----------------------|-------------------|---------------------|
| Email (transaccional / SMTP) | _ej. Resend, SendGrid_ | | | **§ 1.2** |
| Almacenamiento extra / backup | | | | **§ 1.2** |
| SMS / WhatsApp (si aplica) | | | | **§ 1.2** |
| Otras (monitoreo, logs, etc.) | | | | **§ 1.2** |
| **Subtotal licencias** | | **0** | **0** | |

---

### 1.3 Pasarela de pago (opcional)

*Actualmente no se usa Stripe ni otra pasarela; los cobros son por otros medios (reseller factura, etc.). Si más adelante integras Clip, Conekta, Stripe, etc., añade aquí el % y la cuota.*

| Concepto | Fórmula / nota | Ejemplo mensual | Dónde se actualiza |
|----------|----------------|------------------|---------------------|
| % por transacción | _ej. 3.5% + $3 MXN_ | % sobre ingresos | **§ 1.3** |
| Comisión fija por transacción | | | **§ 1.3** |
| Cuota mensual (si aplica) | | | **§ 1.3** |
| **Estimado pasarela** | `(Ingresos × %) + (N transacciones × fijo) + cuota` | **0** | |

---

### 1.4 Infraestructura por usuario/cliente (costo variable)

Estimación de costo directo **por cliente activo** (por mes): almacenamiento, emails, API, DB por tenant.

| Concepto | Costo por cliente/mes (MXN) | Nota | Dónde se actualiza |
|---------|----------------------------|------|---------------------|
| Almacenamiento + DB por clínica | | _ej. $5–20 según uso_ | **§ 1.4** |
| Emails / notificaciones por clínica | | | **§ 1.4** |
| **Total por cliente/mes** | **0** | | |

Fórmula mensual: `Costos directos variables = (Total clientes activos) × (Costo por cliente/mes)`.

---

### 1.5 Otros costos variables atribuibles al cliente

| Concepto | Cómo se calcula | Dónde se actualiza |
|----------|------------------|---------------------|
| Soporte dedicado (si se paga por hora/ticket) | Horas × tarifa o tickets × costo | **§ 1.5** |
| Onboarding/implementación por cliente | Costo por alta nueva | **§ 1.5** |
| Otros | | **§ 1.5** |

---

### Resumen costos directos mensuales (ejemplo con Cloudflare)

| Rubro | Mensual (MXN) | Nota |
|-------|----------------|------|
| Hosting (§ 1.1) Cloudflare | 90–450 | Workers + D1 + R2; ver tabla estimación arriba |
| Licencias (§ 1.2) | 0 | Email/Resend u otro: rellenar cuando tengas proveedor |
| Pasarela (§ 1.3) | 0 | % sobre ingresos cuando cobres (ej. Stripe/Clip) |
| Por cliente (§ 1.4 × N clientes) | 0 | En Cloudflare suele ser marginal; estimar si quieres por clínica |
| Otros variables (§ 1.5) | 0 | Soporte, onboarding, etc. |
| **Total costos directos** | **90–450** | Solo infra al arranque; sube con licencias + pasarela + volumen |

---

## 2. Costos operativos (sueldo, desarrollo, marketing, administración, impuestos, oficina)

### 2.1 Sueldo tuyo (o del responsable del producto)

| Concepto | Mensual (MXN) | Anual (MXN) | Dónde se actualiza |
|---------|----------------|-------------|---------------------|
| Sueldo / retiro fijo | | | **§ 2.1** |
| Prestaciones (si aplican) | | | **§ 2.1** |
| **Subtotal** | **0** | **0** | |

---

### 2.2 Desarrollo

| Concepto | Mensual (MXN) | Anual (MXN) | Dónde se actualiza |
|---------|----------------|-------------|---------------------|
| Desarrollador(es) / freelance | | | **§ 2.2** |
| Herramientas (IDE, repos, CI/CD) | | | **§ 2.2** |
| Otros | | | **§ 2.2** |
| **Subtotal desarrollo** | **0** | **0** | |

---

### 2.3 Marketing

| Concepto | Mensual (MXN) | Anual (MXN) | Dónde se actualiza |
|---------|----------------|-------------|---------------------|
| Ads (Google, Meta, etc.) | | | **§ 2.3** |
| Contenido / redes | | | **§ 2.3** |
| Eventos / partnerships | | | **§ 2.3** |
| Otros | | | **§ 2.3** |
| **Subtotal marketing** | **0** | **0** | |

---

### 2.4 Administración

| Concepto | Mensual (MXN) | Anual (MXN) | Dónde se actualiza |
|---------|----------------|-------------|---------------------|
| Contador / nómina | | | **§ 2.4** |
| Legal (contratos, cumplimiento) | | | **§ 2.4** |
| Seguros | | | **§ 2.4** |
| Otros | | | **§ 2.4** |
| **Subtotal administración** | **0** | **0** | |

---

### 2.5 Impuestos corporativos

| Concepto | Cómo se calcula | Dónde se actualiza |
|----------|-----------------|---------------------|
| ISR / impuesto sobre utilidades | _% sobre utilidad fiscal_ | **§ 2.5** |
| Otros (PTU, etc.) | | **§ 2.5** |
| **Estimado mensual** | _Reserva o % de ingresos_ | **0** |

---

### 2.6 Renta

| Concepto | Mensual (MXN) | Anual (MXN) | Dónde se actualiza |
|---------|----------------|-------------|---------------------|
| Oficina / coworking / domicilio fiscal | | | **§ 2.6** |
| **Subtotal renta** | **0** | **0** | |

---

### 2.7 Internet y servicios básicos

| Concepto | Mensual (MXN) | Dónde se actualiza |
|---------|----------------|---------------------|
| Internet | | **§ 2.7** |
| Teléfono / móvil | | **§ 2.7** |
| Otros | | **§ 2.7** |
| **Subtotal** | **0** | |

---

### Resumen costos operativos mensuales

| Rubro | Mensual (MXN) |
|-------|----------------|
| Sueldo (§ 2.1) | 0 |
| Desarrollo (§ 2.2) | 0 |
| Marketing (§ 2.3) | 0 |
| Administración (§ 2.4) | 0 |
| Impuestos (§ 2.5) | 0 |
| Renta (§ 2.6) | 0 |
| Internet y servicios (§ 2.7) | 0 |
| **Total costos operativos** | **0** |

---

## 3. Utilidad bruta y punto de equilibrio

### 3.1 Ingresos (plantilla mensual)

| Concepto | Fórmula / dato | Mensual (MXN) |
|----------|----------------|----------------|
| Ingresos por suscripciones (recurrentes) | _N clientes × precio promedio_ | 0 |
| Ingresos por altas (one-time, si aplica) | | 0 |
| Otros ingresos | | 0 |
| **Total ingresos** | | **0** |

---

### 3.2 Utilidad bruta (antes de comisiones y tu pago)

```
Utilidad bruta = Total ingresos − Total costos directos (§ 1)
```

| | Mensual (MXN) |
|---|----------------|
| Total ingresos | 0 |
| − Total costos directos | 0 |
| **= Utilidad bruta** | **0** |

Esta utilidad bruta es lo que queda **antes** de:
- comisiones a resellers (45% primer pago + 45% recurrente según contrato),
- tu sueldo,
- y el resto de costos operativos (§ 2).

---

### 3.3 Comisiones (reseller)

Modelo actual: **45% primer pago** y **45% recurrente** (sobre lo que cobra el reseller o sobre lo que tú recibes, según lo pactado).

| Concepto | Cálculo mensual | Mensual (MXN) |
|----------|------------------|----------------|
| Comisión primer pago (altas) | _N altas × precio × 45%_ | 0 |
| Comisión recurrente | _Ingresos recurrentes atribuidos a reseller × 45%_ | 0 |
| **Total comisiones** | | **0** |

---

### 3.4 Utilidad después de comisiones (antes de operativos)

```
Utilidad después de comisiones = Utilidad bruta − Total comisiones
```

(O bien: `Ingresos − Costos directos − Comisiones`.)

| | Mensual (MXN) |
|---|----------------|
| Utilidad bruta | 0 |
| − Total comisiones | 0 |
| **= Utilidad después de comisiones** | **0** |

---

### 3.5 Cobertura de costos operativos y tu pago

| Concepto | Mensual (MXN) |
|----------|----------------|
| Utilidad después de comisiones | 0 |
| − Sueldo (§ 2.1) | 0 |
| − Resto costos operativos (§ 2.2–2.7) | 0 |
| **= Resultado antes de impuestos** | **0** |

Si este número es negativo, los ingresos no cubren comisiones + sueldo + operativos. Hay que subir ingresos (precio o volumen), bajar costos o ajustar comisión/sueldo.

---

### 3.6 Punto de equilibrio (referencia)

- **Por ingresos:** Ingresos mínimos mensuales para que `Utilidad bruta − Comisiones − Sueldo − Operativos = 0`.
- **Por clientes:** Número mínimo de clientes activos (dado el precio promedio) para alcanzar ese ingreso.

Fórmula rápida (sin comisiones por simplicidad):
```
Ingresos equilibrio ≈ (Costos directos + Comisiones estimadas + Sueldo + Operativos) / (1 − % margen pasarela)
```
Ajustar después con % real de comisión y costos variables por cliente.

---

## 4. Equipo y dónde se actualiza todo

| Qué | Dónde se actualiza |
|-----|---------------------|
| **Costos directos** (hosting, licencias, pasarela, por usuario) | Este documento, **§§ 1.1–1.5** y tabla “Resumen costos directos”. |
| **Costos operativos** (sueldo, desarrollo, marketing, admin, impuestos, renta, internet) | Este documento, **§§ 2.1–2.7** y tabla “Resumen costos operativos”. |
| **Comisiones** (%, recurrente vs primer pago) | Contrato reseller + este documento **§ 3.3** si cambias el modelo. |
| **Tu pago / sueldo** | Este documento **§ 2.1** y, si aplica, nómina/contador. |
| **Precios y planes** | Donde definas productos (ej. `manual/payments.md`, backend de planes). Este doc solo usa “ingresos” agregados. |
| **Meta de clientes (1 500 en 18 meses)** | `docs/contrato-comisionista-datos-para-abogado.md` y revisión de metas con reseller. |

**Responsable:** Una sola persona o rol (ej. tú o “Equipo”) debe revisar este archivo cuando:
- Cambie el proveedor de hosting, email o pasarela.
- Cambien precios o planes.
- Ajustes sueldo, comisiones o costos operativos.
- Necesites proyectar utilidad bruta o punto de equilibrio.

---

## 5. Plantilla rápida (copiar y rellenar)

```
INGRESOS MENSUALES:           __________ MXN
COSTOS DIRECTOS:             __________ MXN
  = Utilidad bruta:          __________ MXN
COMISIONES RESELLER:         __________ MXN
  = Después de comisiones:   __________ MXN
SUELDO:                      __________ MXN
OTROS OPERATIVOS:            __________ MXN
  = Resultado:               __________ MXN
```

---

*Documento: `docs/ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md`. Actualizar cuando cambien proveedores, precios, comisiones o estructura de equipo.*
