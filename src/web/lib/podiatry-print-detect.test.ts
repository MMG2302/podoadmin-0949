import { describe, expect, it } from "vitest";
import {
  createDefaultDigitalAlterations,
  createDefaultHelomas,
  createDefaultLimbAssessment,
  createDefaultOnychopathies,
  createDefaultSweatDisorders,
} from "../types/podiatry";
import { detectPodiatryDiagramWithMeta, resolvePodiatryDiagramContext } from "./podiatry-print-detect";

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

describe("resolvePodiatryDiagramContext — campos estructurados", () => {
  it("prioriza selectores de sesion sobre texto libre", () => {
    const r = resolvePodiatryDiagramContext([
      {
        id: "1",
        patientId: "p1",
        sessionDate: "2025-06-01",
        status: "completed",
        clinicalNotes: "pie griego arco cavo",
        anamnesis: "",
        physicalExamination: "",
        diagnosis: "",
        treatmentPlan: "",
        footType: "roman",
        archType: "normal",
        sweatDisorders: createDefaultSweatDisorders(),
        limbAssessment: createDefaultLimbAssessment(),
        helomas: createDefaultHelomas(),
        digitalAlterations: createDefaultDigitalAlterations(),
        onychopathies: createDefaultOnychopathies(),
        images: [],
        createdAt: "",
        updatedAt: "",
        completedAt: null,
        createdBy: "",
        nextAppointmentDate: null,
        followUpNotes: null,
        appointmentReason: null,
      },
    ]);
    expect(r.footType).toBe("roman");
    expect(r.archType).toBe("normal");
    expect(r.footMatchedLabel).toContain("selector sesión");
  });
});
