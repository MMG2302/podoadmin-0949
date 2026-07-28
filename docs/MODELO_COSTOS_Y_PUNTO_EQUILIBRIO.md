# Modelo integral de costos, punto de equilibrio y ROI a 7 años

> Modelo económico de PodoAdmin: **plataforma + operación + vida del fundador**.
> Ingresos en USD (Stripe), gastos personales y operativos en MXN.
> Reproducible: `node scripts/modelo-costos.mjs` — todos los parámetros están arriba del archivo.
>
> Fecha base: **julio 2026** · Tipo de cambio: **17.50 MXN/USD** · Horizonte: **84 meses (jul 2026 – jun 2033)**
>
> Esto es un modelo de planeación de negocio, no asesoría fiscal. Las cifras de ISR/IVA deben validarse con tu contador.

---

## 1. Resumen ejecutivo

| Indicador | Valor |
|---|---|
| **Piso fijo mensual (mes 1)** | **$2,152 USD** = $37,668 MXN |
| Contribución neta por cliente | $51.04 USD/mes (ARPU $55.25 menos Stripe, ISR y nube) |
| **Punto de equilibrio total** | **43 suscripciones** |
| Equilibrio de solo infraestructura | **0.37 clientes** — el primer cliente ya paga toda la nube |
| Equilibrio sin tu costo de vida | 9 clientes |
| Primer mes rentable (escenario base) | mes 19 |
| Payback / recuperación de la inversión (base) | mes 34 |
| Inversión máxima requerida (valle de caja, base) | $25,823 USD = $451,896 MXN |
| Flujo acumulado a 7 años (base) | $394,740 USD · ARR año 7 $394,394 USD |

**Las tres conclusiones que cambian decisiones:**

1. **La nube es ruido; tú eres el costo.** Cloudflare + dominios + correo cuestan $19 USD/mes al arrancar. Tu vida cuesta $1,714. El 80% del piso fijo eres tú. Optimizar infraestructura no mueve la aguja; conseguir clientes y no bajar el precio sí.
2. **43 clientes es la línea de la libertad.** Debajo de eso subsidias el negocio con ahorros u otro ingreso. Arriba, la plataforma paga tu vida completa.
3. **Stripe es tu segundo empleado.** Cobrando en USD desde una cuenta mexicana pagas ~5.6% + $3 MXN por cargo: **$68,131 USD en comisiones a 7 años**. Cobrar en MXN a clientes mexicanos elimina el 2% de conversión y ahorra ~$23,000 USD en el horizonte.

---

## 2. Ingresos: lo que ya cobra el producto

Precios vigentes en [`src/api/utils/billing-pricing.ts`](../src/api/utils/billing-pricing.ts):

| Plan | Precio USD/mes | Incluye |
|---|---|---|
| Independiente Base | $25 | Acceso individual |
| Independiente Premium | $40 | + analíticas, herramientas clínicas, campañas WhatsApp |
| Clínica Base | $100 | 5 podólogos incluidos |
| Clínica Premium | $160 | 8 podólogos incluidos + features premium |
| Podólogo adicional | $10 | Asiento extra (mismo precio en Base y Premium) |

**ARPU mezclado del modelo: $55.25 USD/mes**, con mezcla prudente (55% independiente base, 20% independiente premium, 15% clínica base, 10% clínica premium, y 1 asiento extra promedio en el 25% que son clínicas). Si la mezcla se inclina a clínicas, el ARPU sube a ~$61 y todo el modelo mejora ~10%.

---

## 3. Costos fijos en tres capas

### Capa 1 — Plataforma (USD, escala con el uso)

| Concepto | Mes 1 | A 150 clientes | A 900 clientes |
|---|---|---|---|
| Cloudflare Workers Paid (10M req + 30M CPU-ms incl.) | $5 | $5 | $5 |
| Dominios (.com ×2 + .mx, amortizados) | $5 | $5 | $5 |
| Correo profesional | $7 | $22 | $22 |
| Resend (email transaccional) | $0 (free 3k) | $20 (50k) | $90 (100k) |
| Sentry (errores) | $0 | $29 | $29 |
| Backups, logs, R2 frío | $2 | $10 | $10 |
| Monitoreo + status page | $0 | $0 | $25 |
| Acumulado de fotos clínicas en R2 | ~$0 | ~$0.20 | ~$0.50 |
| **Subtotal infraestructura** | **$19** | **$91** | **$186** |

WAF, Turnstile, Cloudflare Access (hasta 50 usuarios) y D1/KV dentro de cuota: **$0**.

### Capa 2 — Operación del negocio

| Concepto | MXN/mes | USD/mes |
|---|---|---|
| Contador (persona física, RESICO) | $2,000 | $114 |
| Internet, luz y celular (parte del negocio) | $1,200 | $69 |
| Laptop amortizada ($40,000 / 36 meses) | $1,111 | $63 |
| Legal: aviso de privacidad, contratos, marca IMPI | $750 | $43 |
| **Claude Max 5x (mi costo)** | $1,750 | **$100** |
| GitHub, Figma y demás herramientas de desarrollo | $525 | $30 |
| **Subtotal operación** | **$7,336** | **$419** |

### Capa 3 — Tu vida (lo que casi todos omiten)

| Concepto | MXN/mes | USD/mes |
|---|---|---|
| Renta, **comidas**, transporte, salud, imprevistos | $30,000 | $1,714 |

Esto es un **costo real, no una utilidad**. Si el modelo no lo incluye, un negocio que "gana dinero" te tiene trabajando gratis. Con inflación MXN del 4% anual, en 2033 esa misma vida cuesta $39,480 MXN.

### Piso fijo total del mes 1

```
Infraestructura    $   19  (0.9%)
Operación          $  419  (19.5%)
Tu vida            $1,714  (79.6%)
─────────────────────────────────
PISO FIJO          $2,152 USD/mes  =  $37,668 MXN/mes
```

### 3.1 El montaje: lo que cuesta una sola vez

Poner la plataforma de pie es sorprendentemente barato porque el software ya está escrito y la nube no cobra por existir, solo por usarse.

| Concepto | MXN | USD | Nota |
|---|---|---|---|
| Dominio .com (primer año) | $190 | $11 | Cloudflare Registrar vende a precio de costo |
| Dominio .mx (primer año) | $610 | $35 | |
| Registro de marca ante el IMPI, 1 clase | $3,126 | $179 | Tarifa oficial 2026 con IVA; hay programas con hasta 90% de descuento |
| Aviso de privacidad, términos y contrato de servicio | $8,000 – $15,000 | $457 – $857 | Estimado de abogado en México; es el rubro que domina |
| Alta en SAT, e.firma, cuentas de Cloudflare, Stripe y Resend | $0 | $0 | |
| Certificado SSL, WAF, protección DDoS | $0 | $0 | Incluidos en Cloudflare |
| **Total del montaje** | **$11,926 – $18,926** | **$682 – $1,082** | Pago único |

**Versión mínima viable** (sin registro de marca, con plantillas legales revisadas por ti): **~$800 MXN / $46 USD**. Literalmente los dos dominios.

No incluye la laptop, que ya tienes y entra como amortización mensual ($1,111 MXN), ni tu tiempo de desarrollo, que es la inversión real y está contada en el valle de caja de la sección 7.

### 3.2 Cuánto cuesta tener el negocio prendido, sin pagarte a ti

Tres niveles, según qué consideres "el negocio":

| Nivel | Qué incluye | USD/mes | MXN/mes | Clientes para cubrirlo |
|---|---|---|---|---|
| **1. Solo la plataforma** | Cloudflare Workers, D1, R2, KV, Queues, dominios, correo transaccional, backups | **$19** | $333 | **0.4** — el primer cliente la paga y sobra |
| **2. + tus herramientas de trabajo** | Claude Max $100, GitHub y Figma $30, internet y luz $69, laptop amortizada $63 | **$281** | $4,918 | **6** |
| **3. + el negocio formal** | Contador $114, legal, marca y renovaciones $43 | **$438** | $7,665 | **9** |

Con **9 clientes** la plataforma se sostiene sola: paga su nube, tus herramientas, tu contador y tu IA. Del cliente 10 en adelante todo lo que entra va a ti, hasta el cliente 43 donde ya cubres también tu vida completa.

El costo marginal de un cliente más es **$0.11 USD de nube** más la comisión de Stripe. No hay licencias por asiento, no hay servidores que crecer. Por eso el modelo aguanta: entre el cliente 9 y el 120 (donde entra el primer soporte) no aparece prácticamente ningún costo nuevo.

---

## 4. Costos variables por cliente

| Concepto | Costo | Nota |
|---|---|---|
| Comisión Stripe | 3.6% + 2% conversión + $3 MXN | ~$3.26 USD sobre un ARPU de $55.25 |
| Workers (requests + CPU) | $0.022 | ~60k requests/mes por cliente |
| D1 (escrituras + lecturas) | $0.031 | $1.00/M writes es el rubro dominante |
| KV (rate limiting) | $0.050 | |
| R2 (fotos clínicas, ~15 MB/mes) | $0.005 + acumulado | Sin cargos de egreso |
| Queues (notificaciones) | $0.004 | |
| **Costo de nube por cliente** | **$0.11 USD/mes** | 0.2% del ARPU |
| ISR RESICO | 1.5% del ingreso bruto | Hasta $3.5M MXN/año |
| CAC (ads, demos, onboarding) | $80 USD por cliente ganado | Pago único, no recurrente |

**Contribución neta por cliente: $51.04 USD/mes** (92% del ARPU). Márgenes brutos de SaaS puro: el problema nunca será el costo de servir, será adquirir y retener.

---

## 5. Escalones de costo fijo según el crecimiento

Los saltos se disparan por **MRR, no por número de clientes** — regla dura: no contratar si el sueldo cargado pasa del 20% del MRR.

| Clientes | MRR | Infra | Operación | Tu vida | Nómina | **Fijo total** | Fijo/ingreso | Fijo por cliente |
|---|---|---|---|---|---|---|---|---|
| 0 | $0 | $19 | $419 | $1,714 | $0 | **$2,152** | — | — |
| 25 | $1,381 | $19 | $419 | $1,714 | $0 | **$2,152** | 156% | $86.10 |
| 50 | $2,763 | $19 | $419 | $1,714 | $0 | **$2,152** | 78% | $43.05 |
| 100 | $5,525 | $39 | $419 | $1,714 | $0 | **$2,172** | 39% | $21.72 |
| 150 | $8,288 | $91 | $419 | $1,714 | $1,000 | **$3,224** | 39% | $21.50 |
| 250 | $13,813 | $91 | $681 | $1,714 | $4,100 | **$6,586** | 48% | $26.34 |
| 400 | $22,100 | $116 | $981 | $1,714 | $5,100 | **$7,911** | 36% | $19.78 |
| 600 | $33,150 | $186 | $1,095 | $1,714 | $9,200 | **$12,195** | 37% | $20.33 |
| 900 | $49,725 | $186 | $1,095 | $1,714 | $9,200 | **$12,195** | 25% | $13.55 |

Gatillos de contratación usados: soporte 1 con MRR > $6,000 · dev mid con MRR > $12,000 · soporte 2 con MRR > $15,000 · soporte 3 y dev 2 con MRR > $28-30,000.

**Ojo con el escalón de 250 clientes:** el fijo/ingreso empeora de 39% a 48% porque entra el primer desarrollador. Es el único momento del modelo donde crecer te hace *menos* rentable. Es normal y transitorio (a 400 clientes ya bajó a 36%), pero si el crecimiento se estanca justo ahí, ese es el punto donde el negocio se rompe.

---

## 6. Punto de equilibrio en distintos supuestos

| Supuesto | Clientes para equilibrio |
|---|---|
| **Escenario elegido** (vida $30,000 MXN, precio + IVA) | **43** |
| Vida austera ($18,000 MXN) | 29 |
| Vida ampliada ($50,000 MXN) | 65 |
| Precio con **IVA incluido** en lugar de + IVA | 49 |
| Solo infraestructura + herramientas + contador (sin tu vida) | 9 |
| Solo infraestructura | 0.37 |

Traducido a la realidad comercial: **43 clientes ≈ 24 podólogos independientes + 12 premium + 7 clínicas.** A 4 cierres al mes son 11 meses. A 2 cierres al mes son 21 meses.

---

## 7. Proyección a 7 años

Churn mensual: 3.5% conservador · 2.5% base · 2.0% optimista. Inflación MXN 4% anual. Impuestos: RESICO 1.5% sobre bruto hasta $3.5M MXN/año, después régimen general 30% sobre utilidad.

### Escenario base (6 → 22 clientes nuevos al mes según el año)

| Año | Clientes | MRR final | Ingreso anual | Costos | Utilidad | Flujo acumulado |
|---|---|---|---|---|---|---|
| 1 | 19 | $1,042 | $7,089 | $28,098 | -$21,009 | -$21,009 |
| 2 | 77 | $4,243 | $34,278 | $35,162 | -$884 | -$21,893 |
| 3 | 161 | $8,922 | $82,739 | $52,726 | $30,013 | $8,120 |
| 4 | 266 | $14,691 | $146,297 | $94,493 | $51,803 | $59,923 |
| 5 | 385 | $21,264 | $220,995 | $145,648 | $75,347 | $135,270 |
| 6 | 494 | $27,273 | $296,039 | $171,298 | $124,741 | $260,011 |
| 7 | 595 | $32,866 | $365,318 | $230,589 | $134,729 | **$394,740** |

Primer mes rentable: **mes 19** · Payback: **mes 34** · Valle de caja: **-$25,823 USD (mes 18)** · Margen año 7: **37%**

### Los tres escenarios

| | Conservador | Base | Optimista |
|---|---|---|---|
| Clientes año 7 | 244 | 595 | 1,087 |
| ARR año 7 | $162,070 | $394,394 | $720,725 |
| Primer mes rentable | mes 30 | mes 19 | mes 15 |
| Payback | mes 56 | mes 34 | mes 26 |
| **Inversión máxima requerida** | $42,699 USD | $25,823 USD | $18,945 USD |
| Flujo acumulado 7 años | $114,865 | $394,740 | $832,401 |
| **ROI a 7 años** | **269%** | **1,529%** | **4,394%** |
| Margen año 7 | 25% | 37% | 46% |

**Cómo leer el ROI:** es el flujo acumulado a 7 años dividido entre el valle de caja (lo máximo que tienes que poner de tu bolsillo antes de que el negocio se sostenga). Ya incluye tu sueldo de vida como costo — o sea, ese ROI es *además* de haber vivido de la plataforma durante los 7 años.

Incluso el escenario conservador (244 clientes en 7 años, ~3 cierres al mes) funciona: te paga la vida desde el mes 30 y devuelve 2.7× la inversión. El riesgo real no es que el modelo no cierre, es **aguantar el valle de caja de $42,699 USD (~$747,000 MXN)** si el crecimiento va lento.

---

## 8. Sensibilidades

### Tipo de cambio (cobras en USD, gastas en MXN — el peso débil te favorece)

| USD/MXN | Break-even | Payback | Acumulado 7 años |
|---|---|---|---|
| 16.00 (peso fuerte) | 46 clientes | mes 36 | $382,123 |
| **17.50 (hoy)** | **43 clientes** | **mes 34** | **$394,740** |
| 19.00 | 40 clientes | mes 33 | $404,886 |
| 21.00 | 36 clientes | mes 31 | $417,098 |

Un peso que se aprecia a 16 te cuesta ~$12,600 USD en 7 años. Es un riesgo moderado y tienes cobertura natural: si el peso se aprecia, puedes subir precios en MXN.

### IVA: cómo publicas el precio

| Decisión | Payback | Acumulado 7 años |
|---|---|---|
| Precio **+ IVA** ("$25 USD + IVA") | mes 34 | $394,740 |
| Precio **IVA incluido** ("$25 USD, todo incluido") | mes 38 | $326,051 |

**Diferencia: $68,689 USD a 7 años por una línea de texto en la landing.** Publica siempre "+ IVA" para clientes mexicanos con RFC (lo acreditan, no les cuesta) y guarda "IVA incluido" solo para consumidor final.

### Moneda de cobro

| Cobro | Comisiones Stripe 7 años | Acumulado 7 años |
|---|---|---|
| USD (con 2% de conversión) | $68,131 | $394,740 |
| MXN a clientes mexicanos | $45,076 | $415,883 |

---

## 9. Margen por plan (a 150 clientes, fijo asignado $21.50/cliente)

| Plan | Precio | Neto tras Stripe/ISR/nube | Margen tras fijo | % |
|---|---|---|---|---|
| Independiente Base | $25 | $22.94 | **$1.45** | 6% |
| Independiente Premium | $40 | $36.88 | $15.38 | 38% |
| Clínica Base | $100 | $92.62 | $71.12 | 71% |
| Clínica Premium | $160 | $148.36 | $126.86 | 79% |
| Asiento extra | $10 | $9.29 | $9.29 | 93% |

**El plan de $25 no gana dinero: gana clientes.** Con el costo fijo repartido apenas deja $1.45. Consecuencias prácticas:

- Un independiente base que consume soporte una vez al mes **cuesta dinero**. El soporte de ese plan tiene que ser autoservicio (docs, video, onboarding guiado), nunca 1-a-1.
- El negocio real está en **clínicas y asientos extra**. Una clínica premium con 3 asientos extra ($190) equivale a 7.6 independientes base en ingreso y a ~107 en margen.
- Si algún día hay que subir precios, el de $25 es el que menos duele mover a $29-30 (los planes superiores ya tienen margen sano).

---

## 10. Riesgos con número, y sus palancas

| Riesgo | Impacto cuantificado | Palanca |
|---|---|---|
| **Número de WhatsApp propio de la plataforma** | Utility MX $0.0080/msg × 200 msg/cliente = **$1.60/cliente/mes = 6.4% del plan de $25**. A 900 clientes son $1,440 USD/mes. Si algún template se clasifica como *marketing* ($0.0436): $8.72/cliente = **35% del plan base** | **Mantener BYO**: hoy cada clínica pone su propio token (cifrado por tenant) y los recordatorios van por enlaces `wa.me`, que cuestan $0. Si ofreces número propio, que sea solo en Premium y con tope de mensajes |
| **Churn** | Pasar de 2.5% a 3.5% mensual cuesta 351 clientes y $280,000 USD acumulados a 7 años | Contratos anuales con descuento; el costo de cambiar de sistema clínico es tu mejor defensa |
| **Salida de RESICO** | Al superar $3.5M MXN/año (~$200,000 USD, ocurre en el año 5 del escenario base) el ISR salta de 1.5% sobre bruto a 30% sobre utilidad | Planear con el contador la migración a persona moral *antes* de cruzar el umbral, no después |
| **Concentración en un solo desarrollador (tú)** | El escalón de 250 clientes ya asume un dev; sin él, el techo operativo real es ~150-200 clientes | Documentación y automatización antes de los 150 clientes; el primer dev entra con MRR > $12,000 |
| **Costo de IA en producto** | Si añades features con tokens (resúmenes clínicos, IA en la app), eso escala con clientes y **no** está en este modelo | Presupuestar por separado y cobrarlo como add-on, no absorberlo en el precio base |

---

## 11. Reglas de operación derivadas del modelo

1. **No contrates por número de clientes; contrata por MRR.** Sueldo cargado ≤ 20% del MRR. Primer soporte con MRR > $6,000; primer dev con MRR > $12,000.
2. **Págate desde el mes 1, aunque sea en papel.** Registra los $30,000 MXN como costo siempre. Si el mes no los cubre, el faltante es deuda del negocio contigo, no utilidad.
3. **Publica precios "+ IVA".** Vale $68,689 USD a 7 años.
4. **Cobra en MXN a clientes mexicanos** en cuanto tengas volumen: ahorra el 2% de conversión de Stripe.
5. **Reserva de caja: 4 meses de piso fijo** ($8,600 USD / $150,000 MXN) antes de cualquier gasto discrecional.
6. **Revisa este modelo cada trimestre** con clientes y churn reales: `node scripts/modelo-costos.mjs`.

---

## Fuentes de los precios usados

- [Cloudflare Workers — Pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [planes](https://workers.cloudflare.com/plans) — $5/mes base, 10M requests y 30M CPU-ms incluidos; $0.30/M requests; D1 $1.00/M escrituras y $0.001/M lecturas; KV $0.50/M lecturas; R2 $0.015/GB-mes sin egreso
- [Tarifas y comisiones de Stripe](https://stripe.com/pricing) · [Comisiones de Stripe México (Wise)](https://wise.com/mx/blog/comisiones-stripe-mexico) — 3.6% + $3 MXN nacional, +0.5% internacional, 2% por conversión de divisa
- [WhatsApp Business API Pricing México 2026](https://www.go4whatsup.com/mexico/whatsapp-business-api-pricing/) · [guía de precios por mensaje](https://www.uptail.ai/blog/whatsapp-business-api-pricing-2026-what-it-costs-and-how-billing-works) — México: utility $0.0080, authentication $0.0207, marketing $0.0436; mensajes de servicio en ventana de 24 h sin costo
- [Resend Pricing 2026](https://nuntly.com/resend-pricing) — free 3,000/mes (100/día), Pro $20 por 50,000, Scale $90 por 100,000
- [RESICO personas físicas 2026](https://www.miskuentas.com/noticias/regimenes-fiscales/resico-2026-mexico-isr-iva-obligaciones/) · [tablas de retenciones ISR e IVA 2026](https://tesio.com.mx/blog/tablas-retenciones-isr-iva-2026/) — ISR 1% a 2.5%, tope de ingresos $3.5M MXN/año
- [Registro de marca IMPI 2026](https://www.simetrialegal.mx/negocio-sin-riesgo/registro-de-marca-impi-2026-guia-precios-requisitos) — $2,695.18 MXN + IVA = $3,126.41 por clase; los honorarios legales del aviso de privacidad son estimados de mercado, no tarifa publicada
- [Tipo de cambio USD/MXN julio 2026](https://es.tradingeconomics.com/mexico/currency) — ~17.5 MXN/USD
