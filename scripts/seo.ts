/**
 * Fuente única de verdad del SEO del sitio público.
 *
 * Todo lo que sale de acá se genera en build time (ver `seoPlugin()` en vite.config.ts):
 * el `<head>` de index.html, el contenido pre-renderizado de la landing, y los archivos
 * estáticos robots.txt / sitemap.xml / llms.txt que quedan en dist/client.
 *
 * Por qué pre-renderizado y no SSR: la copy de la landing ya vive como datos estáticos en
 * `landingByLang`, así que se puede emitir HTML real sin montar un pipeline de SSR. Los
 * crawlers de IA (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot) no ejecutan JavaScript;
 * sin esto ven un body con "Cargando Podoraa…" y nada más.
 */
import { landingByLang, type LandingI18n } from '../src/web/i18n/landing-i18n';
import { STEP_MEDIA } from '../src/web/components/landing/step-media';
import type { Language } from '../src/web/i18n/translations';

export const SITE_URL = 'https://podoraa.com';

/** Mismo buzón que `SUPPORT_EMAIL` en wrangler.json y que el contacto de /faq. */
const SUPPORT_EMAIL = 'soporte@podoraa.com';

/** Idioma que se pre-renderiza y que declara `<html lang>`. El resto se cambia en cliente. */
export const DEFAULT_LANG: Language = 'es';

/**
 * Rutas públicas indexables. Todo lo demás queda fuera por robots.txt: el usuario quiere
 * que las IAs se entrenen con la landing y con nada más.
 */
const INDEXABLE_PATHS = ['/', '/faq', '/terms', '/privacy'] as const;

/**
 * Páginas con `<head>` y contenido pre-renderizado propios. `/faq` sale como un HTML
 * aparte (dist/client/faq/index.html) porque, si no, un crawler que no ejecuta JavaScript
 * recibe el shell de la SPA — es decir, la landing entera bajo la URL /faq.
 */
export type SeoPage = 'home' | 'faq';

const PAGE_PATH: Record<SeoPage, string> = { home: '/', faq: '/faq' };

/**
 * Rutas que nunca deben rastrearse: app autenticada, flujos de sesión y los enlaces de
 * reserva que se mandan por WhatsApp (llevan token y son de un paciente concreto).
 */
const DISALLOWED_PATHS = [
  '/api/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/auth/',
  '/reserva/',
  '/dashboard',
  '/patients',
  '/sessions',
  '/appointments',
  '/settings',
  '/users',
  '/clinics',
] as const;

type SeoMeta = {
  title: string;
  description: string;
  ogLocale: string;
};

/**
 * Title y description son copy de SEO, no la copy de la landing: el H1 es un eslogan
 * ("Organiza tu consulta sin cambiar tu forma de trabajar") y no contiene las palabras
 * que alguien teclea en Google ("software para podólogos").
 */
const SEO_META: Record<Language, SeoMeta> = {
  es: {
    title: 'Software para podólogos y podiatras en México | Podoraa',
    description:
      'Agenda, expediente clínico podológico con notas de evolución NOM-004, recordatorios por WhatsApp y cobros. Para consultorios y clínicas de podología en México.',
    ogLocale: 'es_MX',
  },
  en: {
    title: 'Podiatry practice management software | Podoraa',
    description:
      'Scheduling, clinical records, WhatsApp reminders and payments in one place. Podoraa is the practice management software for podiatrists and clinics. Nothing to install.',
    ogLocale: 'en_US',
  },
  pt: {
    title: 'Software de gestão para podologistas e clínicas | Podoraa',
    description:
      'Agenda, histórico clínico, lembretes por WhatsApp e pagamentos num só lugar. Software de gestão para podologistas e clínicas de podologia. Sem instalar nada.',
    ogLocale: 'pt_PT',
  },
  fr: {
    title: 'Logiciel de gestion pour podologues et cabinets | Podoraa',
    description:
      'Agenda, dossier clinique, rappels WhatsApp et encaissements au même endroit. Le logiciel de gestion pour podologues et cabinets de podologie. Rien à installer.',
    ogLocale: 'fr_FR',
  },
};

/** Copy de SEO de /faq: la intención de búsqueda es una duda concreta, no "qué es Podoraa". */
const FAQ_SEO_META: Record<Language, SeoMeta> = {
  es: {
    title: 'Preguntas frecuentes sobre Podoraa | Podología en México',
    description:
      'Precios, planes, expediente NOM-004, WhatsApp, seguridad y exportación: las dudas frecuentes sobre el software para consultorios de podología en México.',
    ogLocale: 'es_MX',
  },
  en: {
    title: 'Frequently asked questions about Podoraa | Podiatry software',
    description:
      'Pricing, plans, roles, online booking, WhatsApp, security and data export: the most common questions about Podoraa, the podiatry practice management software.',
    ogLocale: 'en_US',
  },
  pt: {
    title: 'Perguntas frequentes sobre a Podoraa | Software de podologia',
    description:
      'Preços, planos, perfis, marcações online, WhatsApp, segurança e exportação de dados: as dúvidas mais frequentes sobre o software de gestão Podoraa.',
    ogLocale: 'pt_PT',
  },
  fr: {
    title: 'Questions fréquentes sur Podoraa | Logiciel de podologie',
    description:
      'Tarifs, offres, rôles, réservation en ligne, WhatsApp, sécurité et export des données : les questions les plus fréquentes sur le logiciel de gestion Podoraa.',
    ogLocale: 'fr_FR',
  },
};

function seoMetaFor(lang: Language, page: SeoPage): SeoMeta {
  return page === 'faq' ? FAQ_SEO_META[lang] : SEO_META[lang];
}

/** Escapa texto que va a parar a un nodo HTML o a un atributo entre comillas dobles. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// <head>
// ---------------------------------------------------------------------------

/**
 * Meta tags del documento. Ojo: index.html es un shell único para toda la SPA, así que
 * estos valores describen la landing (la única página que queremos indexada). Las rutas
 * privadas quedan cubiertas por robots.txt y por el noindex que inyecta el cliente.
 */
export function buildSeoHeadTags(lang: Language = DEFAULT_LANG, page: SeoPage = 'home'): string {
  const meta = seoMetaFor(lang, page);
  const ogImage = `${SITE_URL}/og-image.png`;
  const url = `${SITE_URL}${PAGE_PATH[page]}`;

  return [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    // Open Graph
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Podoraa" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:locale" content="${meta.ogLocale}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    // La tarjeta de og-image.png es texto sobre fondo oscuro: sin `alt` no hay forma de
    // saber qué anuncia cuando el enlace se comparte en un lector de pantalla.
    `<meta property="og:image:alt" content="${esc(meta.title)}" />`,
    // Twitter / X
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:image:alt" content="${esc(meta.title)}" />`,
  ].join('\n\t\t');
}

export function getSeoTitle(lang: Language = DEFAULT_LANG, page: SeoPage = 'home'): string {
  return seoMetaFor(lang, page).title;
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

/**
 * Datos estructurados. Es el formato que los modelos parsean con más fiabilidad, y los
 * precios salen del mismo `landingByLang` que pinta la tabla de precios, así que no se
 * desincronizan.
 */
/** Todas las preguntas viven en /faq, así que el FAQPage solo se declara ahí. */
function faqPageNode(lang: Language) {
  const l = landingByLang[lang];

  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/faq#faq`,
    url: `${SITE_URL}/faq`,
    name: l.faqPageTitle,
    inLanguage: lang,
    mainEntity: [...l.faqItems, ...l.faqSystemItems].map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function buildJsonLd(lang: Language = DEFAULT_LANG, page: SeoPage = 'home'): string {
  const l = landingByLang[lang];
  const meta = seoMetaFor(lang, page);

  const offers = l.pricingPlans.map((plan) => ({
    '@type': 'Offer',
    name: plan.name,
    description: plan.tagline,
    price: plan.price.replace(/[^0-9.]/g, ''),
    priceCurrency: 'USD',
    // Sin `availability` Google trata la oferta como incompleta y no la muestra; sin
    // `seller` no queda claro que la vende Podoraa y no un revendedor.
    availability: 'https://schema.org/InStock',
    seller: { '@id': `${SITE_URL}/#organization` },
    url: `${SITE_URL}/#pricing`,
  }));

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Podoraa',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/favicon.png`,
      email: SUPPORT_EMAIL,
      description: SEO_META[lang].description,
      // Los cuatro idiomas del producto declarados como dato, no solo como copy: es lo
      // que permite a un buscador ofrecer Podoraa a quien no busca en español.
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SUPPORT_EMAIL,
        availableLanguage: ['es', 'en', 'pt', 'fr'],
      },
      // México es el mercado al que apunta el producto y el único país con plazo de
      // conservación configurado (`CLINICAL_RETENTION_YEARS_BY_COUNTRY`). Declararlo evita
      // que el buscador tenga que deducirlo de la copy.
      areaServed: { '@type': 'Country', name: 'México' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: 'Podoraa',
      inLanguage: lang,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ];

  // La ficha del producto y sus precios describen la landing; en /faq solo sobrarían.
  if (page === 'home') {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: 'Podoraa',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Podiatry practice management software',
      operatingSystem: 'Web',
      url: `${SITE_URL}/`,
      description: meta.description,
      inLanguage: ['es', 'en', 'pt', 'fr'],
      audience: {
        '@type': 'Audience',
        audienceType: l.audiencePodiatristTitle,
        geographicArea: { '@type': 'Country', name: 'México' },
      },
      featureList: [
        l.featureCalendarTitle,
        l.featurePatientsTitle,
        l.featureSessionsTitle,
        l.featureCheckoutTitle,
        l.featureWhatsappTitle,
        l.featureSettingsTitle,
      ],
      offers,
      publisher: { '@id': `${SITE_URL}/#organization` },
    });
  }

  if (page === 'faq') {
    graph.push(faqPageNode(lang));
    // La miga de pan le dice al buscador que /faq cuelga de la raíz y no es una página
    // suelta; es lo que hace que en el resultado aparezca "podoraa.com > Preguntas
    // frecuentes" en vez de la URL cruda.
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/faq#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Podoraa', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: l.faqPageTitle, item: `${SITE_URL}/faq` },
      ],
    });
  }

  // Nodo de la página en sí: sin él, `description` e `inLanguage` solo describen el sitio
  // entero y ninguna URL concreta queda descrita en los datos estructurados.
  graph.push({
    '@type': 'WebPage',
    '@id': `${SITE_URL}${PAGE_PATH[page]}#webpage`,
    url: `${SITE_URL}${PAGE_PATH[page]}`,
    name: meta.title,
    description: meta.description,
    inLanguage: lang,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    primaryImageOfPage: `${SITE_URL}/og-image.png`,
  });

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

  // `</script>` dentro del JSON cerraría la etiqueta antes de tiempo.
  const serialized = JSON.stringify(jsonLd).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">${serialized}</script>`;
}

// ---------------------------------------------------------------------------
// Landing pre-renderizada
// ---------------------------------------------------------------------------

function section(id: string, heading: string, sub: string, body: string): string {
  return [
    `<section id="${id}">`,
    `<h2>${esc(heading)}</h2>`,
    sub ? `<p>${esc(sub)}</p>` : '',
    body,
    `</section>`,
  ]
    .filter(Boolean)
    .join('');
}

function block(title: string, description: string, details?: string[]): string {
  const list = details?.length
    ? `<ul>${details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`
    : '';
  return `<article><h3>${esc(title)}</h3><p>${esc(description)}</p>${list}</article>`;
}

/**
 * HTML real de la landing, generado desde los mismos datos que consume React.
 *
 * Va dentro de `#root`, así que React lo reemplaza al montar (createRoot vacía el
 * contenedor). No se oculta con CSS a propósito: texto escondido que solo ve el crawler
 * es cloaking y Google lo penaliza.
 */
export function buildPrerenderedLanding(lang: Language = DEFAULT_LANG): string {
  const l: LandingI18n = landingByLang[lang];
  const year = new Date().getFullYear();

  const solutions = [l.solutionAbsences, l.solutionRetention, l.solutionTime, l.solutionDecisions]
    .map((s) => block(s.problem, s.solution))
    .join('');

  const features = [
    block(l.featureCalendarTitle, l.featureCalendarDesc, l.featureCalendarDetails),
    block(l.featurePatientsTitle, l.featurePatientsDesc, l.featurePatientsDetails),
    block(l.featureSessionsTitle, l.featureSessionsDesc, l.featureSessionsDetails),
    block(l.featureCheckoutTitle, l.featureCheckoutDesc, l.featureCheckoutDetails),
    block(l.featureWhatsappTitle, l.featureWhatsappDesc, l.featureWhatsappDetails),
    block(l.featureSettingsTitle, l.featureSettingsDesc, l.featureSettingsDetails),
  ].join('');

  // Las capturas de los pasos son las únicas imágenes de contenido del sitio. Si solo
  // existen después de que monte React, para un crawler que no ejecuta JS la landing no
  // tiene ni una imagen: nada que indexar en búsqueda de imágenes y ningún `alt` que leer.
  const steps = `<ol>${l.steps
    .map((step, i) => {
      const media = STEP_MEDIA[i];
      const alt = l.stepsMediaAlt[i];
      const img = media && alt ? `<img src="${media.poster}" alt="${esc(alt)}" />` : '';
      return `<li><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p>${img}</li>`;
    })
    .join('')}</ol>`;

  const audience = [
    block(l.audiencePodiatristTitle, l.audiencePodiatristDesc),
    block(l.audienceClinicTitle, l.audienceClinicDesc),
    block(l.audienceReceptionTitle, l.audienceReceptionDesc),
  ].join('');

  const guide = `<ol>${l.guideItems
    .map((g) => `<li><h3>${esc(g.title)}</h3><p>${esc(g.description)}</p></li>`)
    .join('')}</ol>`;

  const comparison = l.comparisonRows
    .map(
      (r) =>
        `<article><h3>${esc(r.alternative)}</h3><p>${esc(r.problem)}</p>` +
        `<p>${esc(r.podoraa)}</p></article>`
    )
    .join('');

  const pricing =
    l.pricingPlans
      .map(
        (p) =>
          `<article><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p>` +
          `<p><strong>${esc(p.price)}</strong> ${esc(p.period)}</p>` +
          `<ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></article>`
      )
      .join('') +
    `<p>${esc(l.pricingNote)}</p><p>${esc(l.pricingNoteDisclaimer)}</p>`;

  return [
    '<div id="seo-prerender">',
    '<header><p>Podoraa</p><nav>',
    `<a href="/#audience">${esc(l.navAudience)}</a>`,
    `<a href="/#solutions">${esc(l.navSolutions)}</a>`,
    `<a href="/#pricing">${esc(l.navPricing)}</a>`,
    `<a href="/#features">${esc(l.navFeatures)}</a>`,
    `<a href="/#steps">${esc(l.navSteps)}</a>`,
    `<a href="/faq">${esc(l.navFaq)}</a>`,
    '</nav></header>',
    '<main>',
    `<h1>${esc(l.heroTitle)} ${esc(l.heroTitleBold)}</h1>`,
    `<p>${esc(l.heroSubtitle)}</p>`,
    // Mismo orden que el JSX de landing-page.tsx, y por el mismo motivo: para quién es →
    // qué resuelve → cuánto cuesta → qué trae → qué esfuerzo → objeción frente a Excel →
    // guía larga. El orden de los encabezados es lo primero que lee un buscador, así que
    // si acá se invierte, el resumen que se hace del sitio deja de ser el de la página.
    // Las preguntas frecuentes ya no están acá: viven en /faq, con documento propio.
    section('audience', l.audienceTitle, l.audienceSubtitle, audience),
    section('solutions', l.solutionsTitle, l.solutionsSubtitle, solutions),
    section('pricing', l.pricingTitle, l.pricingSubtitle, pricing),
    section('features', l.featuresTitle, l.featuresSubtitle, features),
    section('steps', l.stepsTitle, l.stepsBadge, steps),
    section('comparison', l.comparisonTitle, l.comparisonSubtitle, comparison),
    section('guide', l.guideTitle, l.guideSubtitle, guide),
    `<p><a href="/faq">${esc(l.faqPageTitle)}</a></p>`,
    `<section><h2>${esc(l.ctaTitle)}</h2><p>${esc(l.ctaSubtitle)}</p></section>`,
    '</main>',
    prerenderedFooter(l, year),
    '</div>',
  ].join('');
}

function prerenderedFooter(l: LandingI18n, year: number): string {
  return (
    `<footer><p>© ${year} Podoraa. ${esc(l.footerRights)}</p>` +
    `<a href="/faq">${esc(l.navFaq)}</a> ` +
    `<a href="/terms">${esc(l.footerTerms)}</a> <a href="/privacy">${esc(l.footerPrivacy)}</a> ` +
    `<a href="/faq#contacto">${esc(l.footerContact)}</a>` +
    '</footer>'
  );
}

/**
 * HTML real de /faq. Mismo criterio que la landing: los crawlers de IA no ejecutan JS, y
 * una página de preguntas frecuentes que solo existe después de hidratar no la lee nadie.
 */
export function buildPrerenderedFaq(lang: Language = DEFAULT_LANG): string {
  const l: LandingI18n = landingByLang[lang];
  const year = new Date().getFullYear();

  const list = (items: { question: string; answer: string }[]) =>
    items
      .map((f) => `<article><h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p></article>`)
      .join('');

  return [
    '<div id="seo-prerender">',
    '<header><p>Podoraa</p><nav>',
    `<a href="/">${esc(l.faqPageBack)}</a>`,
    `<a href="/#pricing">${esc(l.navPricing)}</a>`,
    '</nav></header>',
    '<main>',
    `<h1>${esc(l.faqPageTitle)}</h1>`,
    `<p>${esc(l.faqPageSubtitle)}</p>`,
    section('faq-general', l.faqPageGeneralHeading, '', list(l.faqItems)),
    section('faq-sistema', l.faqPageSystemHeading, '', list(l.faqSystemItems)),
    section(
      'contacto',
      l.contactTitle,
      l.contactSubtitle,
      `<p>${esc(l.contactDirect)} <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>`
    ),
    '</main>',
    prerenderedFooter(l, year),
    '</div>',
  ].join('');
}

/**
 * Documento completo de /faq, construido sobre el index.html ya emitido para heredar sus
 * `<script>`/`<link>` con hash. Se escribe en dist/client/faq/index.html: el asset handler
 * de Cloudflare sirve ese archivo en /faq y solo cae al shell de la SPA si no existe.
 */
export function buildFaqPageDocument(indexHtml: string, lang: Language = DEFAULT_LANG): string {
  const head =
    `<title>${esc(getSeoTitle(lang, 'faq'))}</title>\n\t\t` +
    `${buildSeoHeadTags(lang, 'faq')}\n\t\t${buildJsonLd(lang, 'faq')}`;

  // Reemplazos con función: los precios ("$25", "$100") pasarían por los patrones `$n` de
  // String.replace si el reemplazo fuera un string.
  // El ancla es `</body>`, no el <script type="module">: Vite lo mueve al <head>.
  const HEAD_RE = /<title>[\s\S]*?<\/script>/;
  const ROOT_RE = /<div id="root">[\s\S]*<\/div>\s*<\/body>/;

  // Si el shell cambia de forma, un replace que no matchea publicaría la landing entera
  // bajo /faq sin avisar. Mejor romper el build.
  for (const [name, re] of [['head', HEAD_RE], ['root', ROOT_RE]] as const) {
    if (!re.test(indexHtml)) {
      throw new Error(`SEO /faq: no se encontró el bloque "${name}" en index.html`);
    }
  }

  return indexHtml
    .replace(HEAD_RE, () => head)
    .replace(ROOT_RE, () => `<div id="root">${buildPrerenderedFaq(lang)}</div>\n\t</body>`);
}

// ---------------------------------------------------------------------------
// Archivos estáticos
// ---------------------------------------------------------------------------

/**
 * Política: las IAs pueden rastrear y entrenar con la landing, y con nada más.
 *
 * Nota operativa: Cloudflare puede anteponer su propio robots.txt gestionado ("Block AI
 * bots" / Content Signals). Si esa opción sigue activa en el panel, sus reglas conviven
 * con estas y los bots de IA quedan bloqueados igual. Hay que desactivarla para que este
 * archivo sea el que manda.
 */
export function buildRobotsTxt(): string {
  const lines = [
    '# Podoraa — robots.txt',
    '# Las IAs pueden rastrear y entrenar con la landing pública. El resto del sitio, no.',
    '#',
    '# Un solo grupo "*": si un bot encuentra un grupo con su nombre ignora el resto, así',
    '# que nombrarlos por separado solo abriría hueco a que se desincronicen. Sin "Allow: /"',
    '# porque lo que no está prohibido ya está permitido, y un Allow genérico se interpreta',
    '# distinto según el crawler (Google usa la regla más específica; otros, la primera).',
    '',
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
    ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ];
  return lines.join('\n');
}

export function buildSitemapXml(): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = INDEXABLE_PATHS.map((p) => {
    const loc = p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`;
    const priority = p === '/' ? '1.0' : '0.3';
    const changefreq = p === '/' ? 'weekly' : 'yearly';
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Resumen en markdown para agentes y buscadores de IA. Convención emergente (llmstxt.org):
 * un archivo plano, sin JS ni maquetación, que responde "qué es esto, para quién y cuánto
 * cuesta" sin obligar al modelo a interpretar la landing.
 */
export function buildLlmsTxt(): string {
  const l = landingByLang.es;
  const meta = SEO_META.es;

  const plans = l.pricingPlans
    .map((p) => `- **${p.name}** — ${p.price}${p.period}. ${p.tagline}`)
    .join('\n');

  const features = [
    `- **${l.featureCalendarTitle}**: ${l.featureCalendarDesc}`,
    `- **${l.featurePatientsTitle}**: ${l.featurePatientsDesc}`,
    `- **${l.featureSessionsTitle}**: ${l.featureSessionsDesc}`,
    `- **${l.featureCheckoutTitle}**: ${l.featureCheckoutDesc}`,
    `- **${l.featureWhatsappTitle}**: ${l.featureWhatsappDesc}`,
    `- **${l.featureSettingsTitle}**: ${l.featureSettingsDesc}`,
  ].join('\n');

  return `# Podoraa

> ${meta.description}

Podoraa es un software de gestión (SaaS) para consultas de podología y clínicas
podológicas. Reúne agenda, historia clínica, recordatorios por WhatsApp y registro de
cobros en una sola herramienta web. Disponible en español, inglés, portugués y francés.

## Para quién es

- **${l.audiencePodiatristTitle}**: ${l.audiencePodiatristDesc}
- **${l.audienceClinicTitle}**: ${l.audienceClinicDesc}
- **${l.audienceReceptionTitle}**: ${l.audienceReceptionDesc}

## Qué hace

${features}

## Precios

Precios en USD, por mes.

${plans}

${l.pricingNote}
${l.pricingNoteDisclaimer}

## ${l.comparisonTitle}

${l.comparisonSubtitle}

${l.comparisonRows
  .map((r) => `### ${r.alternative}\n\n${r.problem}\n\nCon Podoraa: ${r.podoraa}`)
  .join('\n\n')}

## ${l.guideTitle}

${l.guideSubtitle}

${l.guideItems.map((g) => `### ${g.title}\n\n${g.description}`).join('\n\n')}

## ${l.faqPageGeneralHeading}

${l.faqItems.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n')}

## ${l.faqPageSystemHeading}

${l.faqSystemItems.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n')}

## Contacto

Dudas y soporte: ${SUPPORT_EMAIL}

## Enlaces

- [Landing](${SITE_URL}/): descripción completa del producto y precios.
- [Preguntas frecuentes](${SITE_URL}/faq): precios, planes, roles, prueba, seguridad y contacto.
- [Términos](${SITE_URL}/terms)
- [Privacidad](${SITE_URL}/privacy)

## Alcance de este archivo

Solo cubre la landing pública. La aplicación (agenda, pacientes, sesiones clínicas) está
detrás de autenticación y no es rastreable: contiene datos de salud de pacientes.
`;
}
