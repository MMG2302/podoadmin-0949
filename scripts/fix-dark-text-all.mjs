import fs from "fs";
import path from "path";

const root = process.argv[2] ?? path.join(import.meta.dirname, "..", "src", "web");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

const pass1 = [
  [/text-sm font-semibold text-\[#1a1a1a\](?! dark:)/g, "text-sm font-semibold text-[#1a1a1a] dark:text-gray-100"],
  [/text-xl font-semibold text-\[#1a1a1a\](?! dark:)/g, "text-xl font-semibold text-[#1a1a1a] dark:text-white"],
  [/text-2xl font-semibold text-\[#1a1a1a\](?! dark:)/g, "text-2xl font-semibold text-[#1a1a1a] dark:text-white"],
  [/text-3xl font-semibold text-\[#1a1a1a\](?! dark:)/g, "text-3xl font-semibold text-[#1a1a1a] dark:text-white"],
  [/text-lg font-semibold text-\[#1a1a1a\](?! dark:)/g, "text-lg font-semibold text-[#1a1a1a] dark:text-white"],
  [/font-semibold text-\[#1a1a1a\](?! dark:)/g, "font-semibold text-[#1a1a1a] dark:text-white"],
  [/block text-sm font-medium text-\[#1a1a1a\](?! dark:)/g, "block text-sm font-medium text-[#1a1a1a] dark:text-gray-100"],
  [/font-medium text-\[#1a1a1a\](?! dark:)/g, "font-medium text-[#1a1a1a] dark:text-white"],
  [/text-sm font-medium text-\[#1a1a1a\](?! dark:)/g, "text-sm font-medium text-[#1a1a1a] dark:text-gray-100"],
  [/text-sm text-\[#1a1a1a\](?! dark:)/g, "text-sm text-[#1a1a1a] dark:text-gray-100"],
  [/text-\[#1a1a1a\] text-4xl/g, "text-[#1a1a1a] dark:text-white text-4xl"],
  [/text-\[#1a1a1a\] text-3xl/g, "text-[#1a1a1a] dark:text-white text-3xl"],
  [/className="w-5 h-5 text-\[#1a1a1a\]"/g, 'className="w-5 h-5 text-[#1a1a1a] dark:text-white"'],
  [/hover:text-\[#1a1a1a\](?! dark:)/g, "hover:text-[#1a1a1a] dark:hover:text-white"],
];

const pass2 = [
  [/bg-gray-100 text-\[#1a1a1a\](?! dark:)/g, "bg-gray-100 dark:bg-gray-800 text-[#1a1a1a] dark:text-gray-100"],
  [/border-gray-100 pt-6/g, "border-gray-100 dark:border-gray-800 pt-6"],
  [/bg-white text-\[#1a1a1a\] shadow-sm/g, "bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white shadow-sm"],
];

function apply(replacements) {
  let changed = 0;
  for (const file of walk(root)) {
    let src = fs.readFileSync(file, "utf8");
    const orig = src;
    for (const [re, rep] of replacements) src = src.replace(re, rep);
    if (src !== orig) {
      fs.writeFileSync(file, src);
      changed++;
    }
  }
  return changed;
}

console.log(`Root: ${root}`);
console.log(`Pass1: ${apply(pass1)} files`);
console.log(`Pass2: ${apply(pass2)} files`);
