# Proyección de costos Cloudflare – 2 años (500 → 1 000 → 1 500 usuarios)

Proyección **mes a mes** a 24 meses: dominio, Workers, D1 y R2 con almacenamiento creciente. **Sin pasarela de pago** (Stripe u otra); solo infraestructura.

---

## Supuestos de crecimiento y uso

- **Crecimiento de usuarios:** lineal en 24 meses hasta **1 500 usuarios** (clínicas/tenants).
  - Mes 8 ≈ **500 usuarios**
  - Mes 16 ≈ **1 000 usuarios**
  - Mes 24 = **1 500 usuarios**
- **Usuarios en mes *m*:** `usuarios(m) = 62.5 × m` (aproximado para que mes 24 = 1 500).

### Uso por usuario (estimado)

| Recurso | Estimación | Fuente / nota |
|---------|------------|----------------|
| **Workers (requests)** | 7 000 requests / usuario / mes | Navegación, API, auth, CRUD. 10 M incluidos en Workers Paid. |
| **D1 (almacenamiento)** | 5 MB / usuario | Metadatos, pacientes, sesiones (texto), citas. Imágenes en R2. |
| **D1 (lecturas/escrituras)** | Dentro de lo incluido (25 000 M lecturas, 50 M escrituras/mes) | No se cobra extra en este rango. |
| **R2 (almacenamiento)** | 25 MB / usuario (promedio) | Fotos, adjuntos, logos. Crece con el tiempo. |
| **Dominio** | 1 por cuenta | ~12 USD/año → **1 USD/mes**. |

### Precios Cloudflare (referencia)

| Servicio | Incluido (Workers Paid) | Exceso |
|----------|--------------------------------|--------|
| **Workers** | $5/mes mín.; 10 M requests/mes | $0.30 por millón de requests |
| **D1** | 5 GB almacenamiento; 25 000 M lecturas; 50 M escrituras | $0.75/GB-mes; $0.001/M lecturas; $1/M escrituras |
| **R2** | 10 GB almacenamiento; 1 M escrituras; 10 M lecturas | $0.015/GB-mes; $4.50/M escrituras (Class A) |
| **Dominio** | N/A | ~$12/año (Cloudflare o registrador) |

---

## Proyección mes a mes (24 meses)

**Tipo de cambio:** 18 MXN/USD.  
Fórmulas: **D1** = max(0, usuarios×5 MB − 5 GB) × $0.75/GB · **R2** = max(0, usuarios×25 MB − 10 GB) × $0.015/GB · **Workers** = $5 + max(0, usuarios×7 000 − 10 M) × $0.30/M.

| Mes | Usuarios | Workers (USD) | D1 (USD) | R2 (USD) | Dominio (USD) | **Total USD** | **Total MXN** |
|-----|----------|--------------|----------|----------|----------------|----------------|----------------|
| 1 | 63 | 5.00 | 0.00 | 0.00 | 1.00 | **6.00** | 108 |
| 2 | 125 | 5.00 | 0.00 | 0.00 | 1.00 | **6.00** | 108 |
| 3 | 188 | 5.00 | 0.00 | 0.00 | 1.00 | **6.00** | 108 |
| 4 | 250 | 5.00 | 0.00 | 0.00 | 1.00 | **6.00** | 108 |
| 5 | 313 | 5.00 | 0.00 | 0.00 | 1.00 | **6.00** | 108 |
| 6 | 375 | 5.00 | 0.00 | 0.00 | 1.00 | **6.00** | 108 |
| 7 | 438 | 5.00 | 0.00 | 0.01 | 1.00 | **6.01** | 108 |
| **8** | **500** | **5.00** | **0.00** | **0.01** | **1.00** | **6.01** | **108** |
| 9 | 563 | 5.00 | 0.00 | 0.02 | 1.00 | **6.02** | 108 |
| 10 | 625 | 5.00 | 0.00 | 0.03 | 1.00 | **6.03** | 109 |
| 11 | 688 | 5.00 | 0.00 | 0.04 | 1.00 | **6.04** | 109 |
| 12 | 750 | 5.00 | 0.00 | 0.05 | 1.00 | **6.05** | 109 |
| 13 | 813 | 5.00 | 0.00 | 0.06 | 1.00 | **6.06** | 109 |
| 14 | 875 | 5.00 | 0.00 | 0.07 | 1.00 | **6.07** | 109 |
| 15 | 938 | 5.00 | 0.00 | 0.08 | 1.00 | **6.08** | 109 |
| **16** | **1 000** | **5.00** | **0.00** | **0.09** | **1.00** | **6.09** | **110** |
| 17 | 1 063 | 5.00 | 0.22 | 0.25 | 1.00 | **6.47** | 116 |
| 18 | 1 125 | 5.00 | 0.47 | 0.28 | 1.00 | **6.75** | 122 |
| 19 | 1 188 | 5.00 | 0.72 | 0.31 | 1.00 | **7.03** | 127 |
| 20 | 1 250 | 5.00 | 0.97 | 0.34 | 1.00 | **7.31** | 132 |
| 21 | 1 313 | 5.00 | 1.22 | 0.36 | 1.00 | **7.58** | 136 |
| 22 | 1 375 | 5.00 | 1.47 | 0.39 | 1.00 | **7.86** | 141 |
| 23 | 1 438 | 5.00 | 1.72 | 0.41 | 1.00 | **8.13** | 146 |
| **24** | **1 500** | **5.15** | **1.88** | **0.41** | **1.00** | **8.44** | **152** |

### Cómo se calculan las columnas

- **Usuarios:** 62.5 × mes (redondeado: 63, 125, … 1 500).
- **Workers:** $5 base. Requests = usuarios × 7 000. Por encima de 10 M: $0.30 por millón. Mes 24: 10.5 M → **$5.15**.
- **D1:** Almacenamiento = usuarios × 5 MB. Incluidos 5 GB; exceso **$0.75/GB**. A partir de 1 000 usuarios (5 GB) se paga; mes 24: 7.5 GB → 2.5 GB × 0.75 = **$1.88**.
- **R2:** Almacenamiento = usuarios × 25 MB. Incluidos 10 GB; exceso **$0.015/GB**. A partir de ~400 usuarios se paga; mes 24: 37.5 GB → 27.5 × 0.015 = **$0.41**.
- **Dominio:** **$1/mes** (~$12/año).

*Total mes 24: **$8.44 USD (~152 MXN)**.*

---

## Resumen por hito (500 / 1 000 / 1 500 usuarios)

| Hito | Mes aprox. | Usuarios | Total USD/mes | Total MXN/mes |
|------|------------|----------|--------------|----------------|
| **500 usuarios** | 8 | 500 | 6.01 | ~108 |
| **1 000 usuarios** | 16 | 1 000 | 6.09 | ~110 |
| **1 500 usuarios** | 24 | 1 500 | 8.44 | ~152 |

---

## Almacenamiento creciente (D1 + R2)

| Mes | Usuarios | D1 (GB) aprox. | R2 (GB) aprox. |
|-----|----------|----------------|----------------|
| 1 | 63 | 0.3 | 1.5 |
| 8 | 500 | 2.5 | 12.5 |
| 16 | 1 000 | 5.0 | 25.0 |
| 24 | 1 500 | 7.5 | 37.5 |

- **D1:** primero dentro de 5 GB incluidos; a partir de ~1 000 usuarios se empieza a pagar exceso (~$0.75/GB).
- **R2:** primero dentro de 10 GB incluidos; a partir de ~400 usuarios (10 GB) se paga exceso ($0.015/GB).

---

## Costo total estimado en 2 años (24 meses)

Suma de la columna *Total USD* mes a mes (aprox.): **~\$165 USD** año 1 (meses 1–12) y **~\$195 USD** año 2 (meses 13–24), por el crecimiento de D1 y R2.

| Concepto | USD (aprox.) | MXN (18) |
|----------|--------------|----------|
| **Año 1** (meses 1–12) | ~165 | ~2 970 |
| **Año 2** (meses 13–24) | ~195 | ~3 510 |
| **Total 24 meses** | **~360** | **~6 480** |
| Pico mensual (mes 24) | 8.44 | 152 |

Sin pasarela de pago ni email en la proyección; solo Cloudflare + dominio.

---

## Qué no incluye (y dónde actualizar)

- **Pasarela de pago:** no se incluye (sin Stripe/Clip/etc.). Cuando la tengas, suma % sobre ingresos en `ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md` § 1.3.
- **Email (Resend, etc.):** no incluido. Añadir en § 1.2 del documento de estimación cuando definas proveedor.
- **Impuestos:** no incluidos.

**Dónde se actualiza:** Este archivo (`docs/PROYECCION-2-ANOS-CLOUDFLARE.md`) para la proyección a 2 años; `docs/ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md` para costos directos mensuales y utilidad bruta.
