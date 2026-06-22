import { describe, expect, it } from "vitest";
import { detectPodiatryDiagramWithMeta } from "./podiatry-print-detect";

describe("detectPodiatryDiagramWithMeta — negaciones", () => {
  it("ignora tipos negados y toma el afirmativo (ejemplo del usuario)", () => {
    const r = detectPodiatryDiagramWithMeta([
      "el paciente no tiene pie plano, ni arco cavo, si no normal, y su pie no es griego es romano",
    ]);
    expect(r.footType).toBe("roman");
    expect(r.archType).toBe("normal");
  });

  it("no marca plano ni cavo cuando solo aparecen negados", () => {
    const r = detectPodiatryDiagramWithMeta([
      "exploracion: no presenta pie plano ni arco cavo. arco normal.",
    ]);
    expect(r.archType).toBe("normal");
    expect(r.footType).toBeNull();
  });

  it("respeta sino normal con typo si no", () => {
    const r = detectPodiatryDiagramWithMeta(["arco si no normal"]);
    expect(r.archType).toBe("normal");
  });

  it("no confunde griego negado con romano afirmado", () => {
    const r = detectPodiatryDiagramWithMeta(["pie no es griego, es romano"]);
    expect(r.footType).toBe("roman");
  });

  it("detecta en ingles con negacion", () => {
    const r = detectPodiatryDiagramWithMeta([
      "not a flat foot, not cavus arch, normal arch, foot type roman",
    ]);
    expect(r.footType).toBe("roman");
    expect(r.archType).toBe("normal");
  });
});
