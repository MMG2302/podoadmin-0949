import type {
  ClinicalLayoutSection,
  CustomSectionValue,
} from "../types/clinical-layout";
import {
  customSectionHasPrintContent,
  getSectionOptions,
} from "../types/clinical-layout";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function withBreaks(text: string): string {
  return esc(text).replace(/\n/g, "<br/>");
}

function triLabel(v: string | null | undefined): string {
  if (v === "yes") return "SI";
  if (v === "na") return "N/A";
  return "NO";
}

export function buildCustomSectionPrintBlock(
  section: ClinicalLayoutSection,
  val: CustomSectionValue | undefined
): string {
  if (!customSectionHasPrintContent(section, val)) return "";
  const v = val ?? {};
  const h2 = (title: string) => `<h2>${esc(title)}</h2>`;

  switch (section.kind) {
    case "custom_text":
      return `<div class="section avoid-break">${h2(section.label)}<div class="block">${withBreaks(v.text ?? "")}</div></div>`;

    case "custom_short_text":
      return `<div class="section avoid-break">${h2(section.label)}<p>${esc(v.shortText ?? "")}</p></div>`;

    case "custom_checklist": {
      const items = getSectionOptions(section)
        .filter((item) => v.checks?.[item])
        .map((item) => `<li>☑ ${esc(item)}</li>`)
        .join("");
      if (!items) return "";
      return `<div class="section avoid-break">${h2(section.label)}<ul class="checklist">${items}</ul></div>`;
    }

    case "custom_multi_choice": {
      const picked = getSectionOptions(section).filter((opt) => v.checks?.[opt]);
      if (picked.length === 0) return "";
      return `<div class="section avoid-break">${h2(section.label)}<p>${picked.map(esc).join(", ")}</p></div>`;
    }

    case "custom_yes_no_na": {
      const rows = getSectionOptions(section)
        .filter((row) => v.triState?.[row] === "yes" || v.triStateNotes?.[row]?.trim())
        .map(
          (row) =>
            `<tr><td>${esc(row)}</td><td>${triLabel(v.triState?.[row])}</td><td>${esc(v.triStateNotes?.[row] ?? "")}</td></tr>`
        )
        .join("");
      if (!rows) return "";
      return `<div class="section avoid-break">${h2(section.label)}<table class="data-table"><thead><tr><th>Ítem</th><th>Resp.</th><th>Obs.</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    case "custom_single_choice":
      return `<div class="section avoid-break">${h2(section.label)}<p>${esc(v.selected ?? "")}</p></div>`;

    case "custom_number":
      return `<div class="section avoid-break">${h2(section.label)}<p>${esc(String(v.number))} ${esc(section.unit ?? "")}</p></div>`;

    case "custom_scale": {
      const max = section.scaleMax ?? 10;
      return `<div class="section avoid-break">${h2(section.label)}<p>${esc(String(v.number))}/${max}</p></div>`;
    }

    case "custom_conditional": {
      if (!v.conditionalYes) return "";
      const detail = v.text?.trim()
        ? `<div class="block">${withBreaks(v.text)}</div>`
        : "";
      return `<div class="section avoid-break">${h2(section.label)}<p><strong>${esc(section.conditionalPrompt ?? "¿Aplica?")}</strong> SI</p>${detail}</div>`;
    }

    case "custom_table": {
      const cols = section.tableColumns ?? [];
      const rows = (v.tableRows ?? []).filter((row) => row.some((c) => c.trim()));
      if (rows.length === 0 || cols.length === 0) return "";
      const head = cols.map((c) => `<th>${esc(c)}</th>`).join("");
      const body = rows
        .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
        .join("");
      return `<div class="section avoid-break">${h2(section.label)}<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    }

    default:
      return "";
  }
}
