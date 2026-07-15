/**
 * Merge remaining UI i18n keys into translations.ts (additive).
 * node scripts/merge-remaining-i18n.mjs
 */
import fs from "fs";
import { locales } from "./_i18n-locales-data.mjs";

const path = "src/web/i18n/translations.ts";
let src = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

function serializeObject(obj, indent) {
  const sp2 = " ".repeat(indent + 2);
  const lines = ["{"];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      lines.push(`${sp2}${k}: ${JSON.stringify(v)},`);
    } else if (Array.isArray(v)) {
      lines.push(`${sp2}${k}: [${v.map((x) => JSON.stringify(x)).join(", ")}],`);
    } else {
      lines.push(`${sp2}${k}: ${serializeObject(v, indent + 2)},`);
    }
  }
  lines.push(`${" ".repeat(indent)}}`);
  return lines.join("\n");
}

function typeFromValue(obj, indent) {
  const sp2 = " ".repeat(indent + 2);
  const lines = ["{"];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") lines.push(`${sp2}${k}: string;`);
    else if (Array.isArray(v)) lines.push(`${sp2}${k}: string[];`);
    else lines.push(`${sp2}${k}: ${typeFromValue(v, indent + 2)};`);
  }
  lines.push(`${" ".repeat(indent)}}`);
  return lines.join("\n");
}

function replaceBlock(label, re, next) {
  if (!re.test(src)) throw new Error(`Block not found: ${label}`);
  src = src.replace(re, next);
}

// --- Interface: campaigns + messages ---
replaceBlock(
  "iface campaigns/messages",
  /campaigns: \{\n(?: {6}[^\n]+\n)+ {4}\};\n {4}messages: \{\n(?: {6}[^\n]+\n)+ {4}\};\n {2}\};/,
  `campaigns: ${typeFromValue(locales.es.campaigns, 4)};\n    messages: ${typeFromValue(locales.es.messages, 4)};\n  };`
);

// --- Interface: clinicalTools ---
replaceBlock(
  "iface clinicalTools",
  /clinicalTools: \{\n(?: {4}[^\n]+\n)+ {2}\};/,
  `clinicalTools: ${typeFromValue(locales.es.clinicalTools, 2)};`
);

// --- Interface: settings watermark..print ---
replaceBlock(
  "iface settings blocks",
  /watermark: \{\n(?: {6}[^\n]+\n)+ {4}\};\n {4}billing: \{\n(?: {6}[^\n]+\n)+ {4}\};\n {4}dashboardLogo: \{\n(?: {6}[^\n]+\n)+ {4}\};\n {4}clinicalLayout: \{\n(?: {6}[^\n]+\n)+ {4}\};\n {4}print: \{\n(?: {6}[^\n]+\n)+ {4}\};/,
  `settingsScope: ${typeFromValue(locales.es.settingsScope, 4)};\n    watermark: ${typeFromValue(locales.es.watermark, 4)};\n    billing: ${typeFromValue(locales.es.billing, 4)};\n    dashboardLogo: ${typeFromValue(locales.es.dashboardLogo, 4)};\n    clinicalLayout: ${typeFromValue(locales.es.clinicalLayout, 4)};\n    print: ${typeFromValue(locales.es.print, 4)};\n    profileAvatar: ${typeFromValue(locales.es.profileAvatar, 4)};`
);

// --- Interface: layout ---
if (!src.includes("\n  layout: {")) {
  replaceBlock(
    "iface layout insert",
    /(\n  \/\*\* WhatsApp Business)/,
    `\n  layout: ${typeFromValue(locales.es.layout, 2)};\n$1`
  );
}

function localeSlice(lang) {
  const starts = { es: "\n  es: {", en: "\n  en: {", pt: "\n  pt: {", fr: "\n  fr: {" };
  const ends = {
    es: "\n  en: {",
    en: "\n  pt: {",
    pt: "\n  fr: {",
    fr: "\n};\n\nexport const languageNames",
  };
  const a = src.indexOf(starts[lang]);
  const b = src.indexOf(ends[lang], a + 1);
  if (a < 0 || b < 0) throw new Error(`locale bounds ${lang}`);
  return { a, b, slice: src.slice(a, b) };
}

function replaceInLocale(lang, re, next, label) {
  const { a, b, slice } = localeSlice(lang);
  if (!re.test(slice)) throw new Error(`${label} missing in ${lang}`);
  const nextSlice = slice.replace(re, next);
  src = src.slice(0, a) + nextSlice + src.slice(b);
}

for (const lang of ["es", "en", "pt", "fr"]) {
  const d = locales[lang];

  replaceInLocale(
    lang,
    /campaigns: \{\n(?: {8}[^\n]+\n)+ {6}\},\n {6}messages: \{\n(?: {8}[^\n]+\n)+ {6}\},/,
    `campaigns: ${serializeObject(d.campaigns, 6)},\n      messages: ${serializeObject(d.messages, 6)},`,
    "campaigns/messages values"
  );

  replaceInLocale(
    lang,
    /clinicalTools: \{\n(?: {6}[^\n]+\n)+ {4}\},/,
    `clinicalTools: ${serializeObject(d.clinicalTools, 4)},`,
    "clinicalTools values"
  );

  replaceInLocale(
    lang,
    /watermark: \{\n(?: {8}[^\n]+\n)+ {6}\},\n {6}billing: \{\n(?: {8}[^\n]+\n)+ {6}\},\n {6}dashboardLogo: \{\n(?: {8}[^\n]+\n)+ {6}\},\n {6}clinicalLayout: \{\n(?: {8}[^\n]+\n)+ {6}\},\n {6}print: \{\n(?: {8}[^\n]+\n)+ {6}\},/,
    `settingsScope: ${serializeObject(d.settingsScope, 6)},\n      watermark: ${serializeObject(d.watermark, 6)},\n      billing: ${serializeObject(d.billing, 6)},\n      dashboardLogo: ${serializeObject(d.dashboardLogo, 6)},\n      clinicalLayout: ${serializeObject(d.clinicalLayout, 6)},\n      print: ${serializeObject(d.print, 6)},\n      profileAvatar: ${serializeObject(d.profileAvatar, 6)},`,
    "settings blocks values"
  );

  // layout values before whatsapp in each locale
  const { a, b, slice } = localeSlice(lang);
  if (!slice.includes("\n    layout: {")) {
    const wa = slice.indexOf("\n    whatsapp: {");
    if (wa < 0) throw new Error(`whatsapp values missing in ${lang}`);
    const nextSlice =
      slice.slice(0, wa) +
      `\n    layout: ${serializeObject(d.layout, 4)},` +
      slice.slice(wa);
    src = src.slice(0, a) + nextSlice + src.slice(b);
  }
}

fs.writeFileSync(path, src);
console.log("Merged OK. lines=", src.split("\n").length);
console.log({
  layout: src.includes("\n  layout: {"),
  campaignsDenied: src.includes("denied: \"Sin permiso"),
  profileAvatar: src.includes("profileAvatar:"),
  settingsScope: src.includes("settingsScope:"),
});
