// Modelo de costos fijos + break-even + ROI 7 años — PodoAdmin
// Ingresos en USD (Stripe), gastos personales/operativos en MXN.

const FX = 17.5;              // MXN por USD (jul 2026)
const INFL_MXN = 0.04;        // inflación anual de costos en pesos
const MESES = 84;             // 7 años

// ---------- Precios del producto (src/api/utils/billing-pricing.ts) ----------
// Mezcla prudente: en México la mayoría de podólogos trabaja solo.
const PRECIOS = {
  ind_base:     { usd: 25,  mix: 0.55 },
  ind_premium:  { usd: 40,  mix: 0.20 },
  clin_base:    { usd: 100, mix: 0.15 },
  clin_premium: { usd: 160, mix: 0.10 },
};
const ASIENTOS_EXTRA_USD = 10;
// clínicas (25% del mix) promedian 1 asiento extra
const ARPU = Object.values(PRECIOS).reduce((a, p) => a + p.usd * p.mix, 0)
  + 0.25 * 1 * ASIENTOS_EXTRA_USD;

// ---------- Stripe ----------
const STRIPE_PCT = 0.036 + 0.020;   // 3.6% MX + 2% conversión de divisa (cobro en USD, cuenta MXN)
const STRIPE_FIJO_USD = 3 / FX;     // $3 MXN por cargo
const STRIPE_PCT_MXN = 0.036;       // alternativa: cobrar en pesos (sin conversión)

// ---------- Variable de nube por cliente/mes ----------
// Workers $0.30/M req + $0.02/M CPU-ms; D1 $1.00/M writes, $0.001/M reads;
// KV $0.50/M reads; R2 $0.015/GB-mes; Queues $0.40/M ops
const VAR_CLIENTE = 0.018 + 0.004 + 0.030 + 0.001 + 0.050 + 0.005 + 0.004; // ≈ 0.112
const R2_GB_MES_CLIENTE = 0.015;    // ~15 MB/mes de fotos clínicas por cliente
const R2_USD_GB = 0.015;
const CAC = 80;                     // ads + demos + onboarding por cliente ganado

// ---------- Costos fijos escalonados ----------
function infraFija(n) {
  let t = 0;
  t += 5;                                   // Workers Paid
  t += 5;                                   // dominios (.com x2 + .mx) amortizados
  t += n < 120 ? 7 : 22;                    // correo profesional
  t += n < 100 ? 0 : n < 600 ? 20 : 90;     // Resend
  t += n < 150 ? 0 : 29;                    // Sentry
  t += n < 150 ? 2 : 10;                    // backups / logs / R2 frío
  t += n < 300 ? 0 : 25;                    // monitoreo + status page
  return t;
}
// Los escalones de estructura se disparan por MRR, no por número de clientes:
// nunca contratar si el sueldo cargado pasa de ~20% del MRR.
function opexFijoMXN(n, mrr) {
  let t = 0;
  t += 2000;                                // contador
  t += mrr > 12000 ? 2000 : 0;              // + nómina / persona moral
  t += mrr > 30000 ? 2000 : 0;
  t += 1200;                                // internet, luz, celular (parte negocio)
  t += 1111;                                // laptop 40k MXN / 36 meses
  t += 750;                                 // legal, aviso privacidad, marca IMPI, contratos
  t += mrr > 12000 ? 1000 : 0;              // + asesoría legal / NOM-024
  t += mrr > 10000 ? 1050 : 0;              // seguro ciber / RC profesional
  t += mrr > 18000 ? 3500 : 0;              // coworking
  return t;
}
function opexFijoUSD(n, mrr) {
  let t = 0;
  t += mrr > 15000 ? 200 : 100;             // Claude Max (5x → 20x)
  t += mrr > 12000 ? 60 : 30;               // GitHub, Figma, otras dev tools
  return t;
}
const VIDA_MXN = 30000;                     // retiro del fundador: renta, comidas, transporte, salud
function nominaUSD(n, mrr) {
  let t = 0;
  if (mrr > 6000) t += 1000;                // soporte 1 (15k MXN + IMSS)
  if (mrr > 15000) t += 1000;               // soporte 2
  if (mrr > 28000) t += 1000;               // soporte 3
  if (mrr > 12000) t += 3100;               // dev mid (45k MXN + IMSS)
  if (mrr > 30000) t += 3100;               // dev 2
  return t;
}

// ---------- Escenarios de crecimiento ----------
const ESCENARIOS = {
  conservador: { adds: [0.6, 3, 5, 7, 9, 10, 11], churn: 0.035 },
  base:        { adds: [1.8, 6, 10, 14, 18, 20, 22], churn: 0.025 },
  optimista:   { adds: [3, 10, 17, 23, 29, 33, 36], churn: 0.020 },
};

function simular(nombre, fx = FX, ivaIncluido = false, stripePct = STRIPE_PCT) {
  const { adds, churn } = ESCENARIOS[nombre];
  let clientes = 0, r2gb = 0, acum = 0, brutoAnual = 0;
  let peorAcum = 0, mesPeor = 0, mesBreakEvenMensual = null, mesPayback = null;
  const anios = [];
  let a = { ing: 0, infra: 0, negocio: 0, vida: 0, nomina: 0, stripe: 0, var: 0, cac: 0, imp: 0, util: 0 };

  for (let m = 1; m <= MESES; m++) {
    const anio = Math.ceil(m / 12);
    const inflFactor = Math.pow(1 + INFL_MXN, anio - 1);
    const nuevos = adds[anio - 1];
    clientes = clientes * (1 - churn) + nuevos;
    r2gb += clientes * R2_GB_MES_CLIENTE;

    const arpuNeto = ivaIncluido ? ARPU / 1.16 : ARPU;
    const ing = clientes * arpuNeto;
    const stripe = ing * stripePct + clientes * (3 / fx);
    const infra = infraFija(clientes) + r2gb * R2_USD_GB;
    const negocio = opexFijoUSD(clientes, ing) + (opexFijoMXN(clientes, ing) * inflFactor) / fx;
    const vida = (VIDA_MXN * inflFactor) / fx;
    const nom = nominaUSD(clientes, ing) * inflFactor;
    const varInfra = clientes * VAR_CLIENTE;
    const cac = nuevos * CAC;

    brutoAnual += ing;
    const costos = stripe + infra + negocio + vida + nom + varInfra + cac;
    const utilAntes = ing - costos;
    // RESICO PF: 1.5% sobre ingreso bruto hasta 3.5M MXN/año; después régimen general 30% s/ utilidad
    const dentroResico = brutoAnual * fx <= 3_500_000;
    const imp = dentroResico ? ing * 0.015 : Math.max(0, utilAntes) * 0.30;
    const util = utilAntes - imp;

    acum += util;
    if (acum < peorAcum) { peorAcum = acum; mesPeor = m; }
    if (util > 0 && mesBreakEvenMensual === null) mesBreakEvenMensual = m;
    if (acum > 0 && mesPayback === null && mesBreakEvenMensual !== null) mesPayback = m;

    a.ing += ing; a.infra += infra; a.negocio += negocio; a.vida += vida; a.nomina += nom;
    a.stripe += stripe; a.var += varInfra; a.cac += cac; a.imp += imp; a.util += util;

    if (m % 12 === 0) {
      anios.push({ anio, clientes, ...a, mrrFin: ing, acum });
      a = { ing: 0, infra: 0, negocio: 0, vida: 0, nomina: 0, stripe: 0, var: 0, cac: 0, imp: 0, util: 0 };
      brutoAnual = 0;
    }
  }
  return { nombre, anios, peorAcum, mesPeor, mesBreakEvenMensual, mesPayback, acumFinal: acum };
}

// ---------- Break-even estático (mes 1, sin nómina) ----------
const pisoMes1USD = infraFija(0) + opexFijoUSD(0, 0) + opexFijoMXN(0, 0) / FX + VIDA_MXN / FX;
const contribUnit = ARPU * (1 - STRIPE_PCT - 0.015) - STRIPE_FIJO_USD - VAR_CLIENTE;
const contribUnitIVA = (ARPU / 1.16) * (1 - STRIPE_PCT - 0.015) - STRIPE_FIJO_USD - VAR_CLIENTE;

const f = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

console.log('=== PARÁMETROS ===');
console.log(`ARPU mezclado: $${ARPU.toFixed(2)} USD/mes`);
console.log(`Contribución por cliente (neto Stripe+ISR+nube): $${contribUnit.toFixed(2)} USD`);
console.log(`  ... si el precio lleva IVA incluido: $${contribUnitIVA.toFixed(2)} USD`);
console.log(`Piso fijo mes 1: $${pisoMes1USD.toFixed(0)} USD = $${f(pisoMes1USD * FX)} MXN`);
console.log(`  desglose: infra $${infraFija(0)} | negocio USD $${opexFijoUSD(0,0)} | negocio MXN $${f(opexFijoMXN(0,0))} (=$${(opexFijoMXN(0,0)/FX).toFixed(0)}) | vida $${(VIDA_MXN/FX).toFixed(0)}`);
console.log(`\nBREAK-EVEN (cubre TODO, incl. tu vida): ${Math.ceil(pisoMes1USD / contribUnit)} clientes`);
console.log(`  solo infraestructura: ${(infraFija(0) / contribUnit).toFixed(2)} clientes`);
console.log(`  solo infra + herramientas + contador (sin tu vida): ${Math.ceil((pisoMes1USD - VIDA_MXN/FX) / contribUnit)} clientes`);
console.log(`  con IVA incluido en el precio: ${Math.ceil(pisoMes1USD / contribUnitIVA)} clientes`);
console.log(`  costo de vida austero (18k MXN): ${Math.ceil((pisoMes1USD - (30000-18000)/FX) / contribUnit)} clientes`);
console.log(`  costo de vida 50k MXN: ${Math.ceil((pisoMes1USD + (50000-30000)/FX) / contribUnit)} clientes`);

console.log('\n=== ESCALONES DE COSTO FIJO (USD/mes) ===');
for (const n of [0, 25, 50, 100, 150, 250, 400, 600, 900]) {
  const ing = n * ARPU;
  const infra = infraFija(n);
  const neg = opexFijoUSD(n, ing) + opexFijoMXN(n, ing) / FX;
  const vida = VIDA_MXN / FX;
  const nom = nominaUSD(n, ing);
  const tot = infra + neg + vida + nom;
  console.log(`${String(n).padStart(4)} clientes | infra ${infra.toFixed(0).padStart(4)} | negocio ${neg.toFixed(0).padStart(4)} | vida ${vida.toFixed(0)} | nómina ${nom.toFixed(0).padStart(5)} | FIJO TOTAL ${tot.toFixed(0).padStart(6)} | ingreso ${ing.toFixed(0).padStart(6)} | fijo/ingreso ${ing ? (tot/ing*100).toFixed(0)+'%' : '—'} | costo fijo/cliente ${n ? (tot/n).toFixed(2) : '—'}`);
}

for (const esc of ['conservador', 'base', 'optimista']) {
  const r = simular(esc);
  console.log(`\n=== ESCENARIO ${esc.toUpperCase()} ===`);
  console.log('Año | Clientes | MRR fin | Ingreso año | Costos | Utilidad | Acumulado');
  for (const y of r.anios) {
    const costos = y.infra + y.negocio + y.vida + y.nomina + y.stripe + y.var + y.cac + y.imp;
    console.log(`${y.anio}   | ${f(y.clientes).padStart(8)} | ${f(y.mrrFin).padStart(7)} | ${f(y.ing).padStart(11)} | ${f(costos).padStart(7)} | ${f(y.util).padStart(8)} | ${f(y.acum).padStart(9)}`);
  }
  console.log(`Primer mes rentable: mes ${r.mesBreakEvenMensual ?? '—'} | Payback (flujo acum > 0): mes ${r.mesPayback ?? '—'}`);
  console.log(`Inversión máxima requerida (valle de caja): $${f(-r.peorAcum)} USD (mes ${r.mesPeor}) = $${f(-r.peorAcum * FX)} MXN`);
  console.log(`Acumulado 7 años: $${f(r.acumFinal)} USD | ROI = ${((r.acumFinal / -r.peorAcum) * 100).toFixed(0)}%`);
  const ultimo = r.anios[6];
  console.log(`ARR año 7: $${f(ultimo.mrrFin * 12)} USD | margen año 7: ${(ultimo.util / ultimo.ing * 100).toFixed(0)}%`);
}

console.log('\n=== SENSIBILIDAD AL TIPO DE CAMBIO (escenario base) ===');
for (const fx of [16, 17.5, 19, 21]) {
  const r = simular('base', fx);
  console.log(`FX ${fx} | break-even ${Math.ceil((infraFija(0)+opexFijoUSD(0,0)+opexFijoMXN(0,0)/fx+VIDA_MXN/fx) / (ARPU*(1-STRIPE_PCT-0.015)-3/fx-VAR_CLIENTE))} clientes | payback mes ${r.mesPayback} | acum 7a $${f(r.acumFinal)}`);
}

console.log('\n=== IVA INCLUIDO vs IVA POR SEPARADO (base) ===');
for (const iva of [false, true]) {
  const r = simular('base', FX, iva);
  console.log(`${iva ? 'Precio IVA incluido' : 'Precio + IVA'} | payback mes ${r.mesPayback ?? '—'} | acum 7a $${f(r.acumFinal)}`);
}

console.log('\n=== COBRAR EN USD vs EN MXN (base) ===');
for (const [etiqueta, pct] of [['USD (con 2% conversión)', STRIPE_PCT], ['MXN (sin conversión)', STRIPE_PCT_MXN]]) {
  const r = simular('base', FX, false, pct);
  console.log(`${etiqueta} | acum 7a $${f(r.acumFinal)} | ahorro Stripe 7a $${f(r.anios.reduce((s,y)=>s+y.stripe,0))} en comisiones`);
}

console.log('\n=== MARGEN POR PLAN (a 150 clientes) ===');
const nRef = 150;
const mrrRef = nRef * ARPU;
const fijoRef = infraFija(nRef) + opexFijoUSD(nRef, mrrRef) + opexFijoMXN(nRef, mrrRef)/FX + VIDA_MXN/FX + nominaUSD(nRef, mrrRef);
const fijoPorCliente = fijoRef / nRef;
for (const [k, p] of Object.entries(PRECIOS)) {
  const neto = p.usd * (1 - STRIPE_PCT - 0.015) - STRIPE_FIJO_USD - VAR_CLIENTE;
  console.log(`${k.padEnd(13)} $${String(p.usd).padStart(3)} → neto $${neto.toFixed(2)} | menos fijo/cliente $${fijoPorCliente.toFixed(2)} = margen $${(neto - fijoPorCliente).toFixed(2)} (${((neto-fijoPorCliente)/p.usd*100).toFixed(0)}%)`);
}
console.log(`Asiento extra  $ 10 → neto $${(10*(1-STRIPE_PCT-0.015)).toFixed(2)} (margen casi puro, sin fijo asignado)`);

console.log('\n=== RIESGO: número de WhatsApp propio de la plataforma ===');
const msgsMes = 200;
console.log(`Si TÚ pagas los mensajes (MX utility $0.0080): ${msgsMes} msg/cliente/mes = $${(msgsMes*0.008).toFixed(2)} USD/cliente`);
console.log(`  sobre el plan independiente base ($25) = ${(msgsMes*0.008/25*100).toFixed(1)}% del precio`);
console.log(`  a 900 clientes = $${f(900*msgsMes*0.008)} USD/mes`);
console.log(`Marketing ($0.0436): ${msgsMes} msg = $${(msgsMes*0.0436).toFixed(2)}/cliente → ${(msgsMes*0.0436/25*100).toFixed(0)}% del plan base`);
