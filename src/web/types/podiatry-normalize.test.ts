import { describe, expect, it } from "vitest";
import { normalizePodiatryArchType, normalizePodiatryFootType } from "./podiatry";

describe("normalizePodiatryFootType", () => {
  it("acepta IDs canónicos", () => {
    expect(normalizePodiatryFootType("egyptian")).toBe("egyptian");
    expect(normalizePodiatryFootType("greek")).toBe("greek");
  });

  it("mapea etiquetas en español del seed legacy", () => {
    expect(normalizePodiatryFootType("Egipcio")).toBe("egyptian");
    expect(normalizePodiatryFootType("Griego")).toBe("greek");
    expect(normalizePodiatryFootType("Romano")).toBe("roman");
  });
});

describe("normalizePodiatryArchType", () => {
  it("acepta IDs canónicos", () => {
    expect(normalizePodiatryArchType("flat")).toBe("flat");
    expect(normalizePodiatryArchType("cavus")).toBe("cavus");
  });

  it("mapea etiquetas en español del seed legacy", () => {
    expect(normalizePodiatryArchType("Plano")).toBe("flat");
    expect(normalizePodiatryArchType("Cavo")).toBe("cavus");
    expect(normalizePodiatryArchType("Normal")).toBe("normal");
  });
});
