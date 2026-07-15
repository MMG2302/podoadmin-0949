/**
 * Deep-scans code for t.x.y.z usages and verifies paths exist on all locales.
 * Run: npx vite-node scripts/scan-t-usages.mts
 */
import fs from "node:fs";
import path from "node:path";
import { translations } from "../src/web/i18n/translations";

function walk(dir: string, acc: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist") continue;
      walk(p, acc);
    } else if (/\.(tsx|ts)$/.test(ent.name) && !ent.name.endsWith(".d.ts")) {
      acc.push(p);
    }
  }
  return acc;
}

function get(obj: unknown, pathStr: string): unknown {
  let cur: unknown = obj;
  for (const part of pathStr.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

const root = path.resolve("src/web");
const files = walk(root).filter((f) => !f.includes(`${path.sep}i18n${path.sep}`));
const pathRe = /\bt\.([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)/g;
const used = new Set<string>();

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let m: RegExpExecArray | null;
  while ((m = pathRe.exec(text))) {
    // skip dynamic like t.checkout.views[id] — still check parent views
    const p = m[1];
    used.add(p);
    // also add parents
    const parts = p.split(".");
    for (let i = 1; i < parts.length; i++) used.add(parts.slice(0, i).join("."));
  }
}

const langs = ["es", "en", "pt", "fr"] as const;
let missing = 0;
for (const lang of langs) {
  const misses: string[] = [];
  for (const p of [...used].sort()) {
    if (get(translations[lang], p) === undefined) misses.push(p);
  }
  console.log(`\n${lang}: ${misses.length} missing of ${used.size} used paths`);
  for (const p of misses.slice(0, 80)) {
    console.log("  ", p);
    missing++;
  }
  if (misses.length > 80) console.log(`  ... +${misses.length - 80} more`);
}
console.log(`\nTOTAL missing reports: ${missing}`);
process.exit(missing > 0 ? 1 : 0);
