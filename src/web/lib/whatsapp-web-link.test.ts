import { describe, expect, it } from "vitest";
import type { Patient } from "../types/clinical";
import {
  applyWhatsAppWebTemplate,
  buildWaMeUrl,
  filterCampaignWebRecipients,
  getTomorrowLocalDateString,
  matchesPodiatristFilter,
  normalizePhoneForWaMe,
  parseCampaignFilterJson,
} from "./whatsapp-web-link";

describe("normalizePhoneForWaMe", () => {
  it("normaliza E.164 y teléfonos locales MX de 10 dígitos", () => {
    expect(normalizePhoneForWaMe("+52 55 1234 5678")).toBe("525512345678");
    expect(normalizePhoneForWaMe("5512345678")).toBe("525512345678");
  });

  it("rechaza teléfonos demasiado cortos", () => {
    expect(normalizePhoneForWaMe("123")).toBeNull();
  });
});

describe("applyWhatsAppWebTemplate", () => {
  it("sustituye variables del mensaje", () => {
    const msg = applyWhatsAppWebTemplate("Hola {{nombre}}, cita {{fecha}} {{hora}}. {{nota}}", {
      nombre: "Ana",
      fecha: "20/06/2026",
      hora: "10:00",
      nota: "Trae estudios.",
    });
    expect(msg).toContain("Ana");
    expect(msg).toContain("Trae estudios.");
  });
});

describe("buildWaMeUrl", () => {
  it("genera enlace wa.me codificado", () => {
    const url = buildWaMeUrl("525512345678", "Hola mundo");
    expect(url).toBe("https://wa.me/525512345678?text=Hola%20mundo");
  });
});

describe("getTomorrowLocalDateString", () => {
  it("devuelve la fecha local del día siguiente", () => {
    expect(getTomorrowLocalDateString(new Date(2026, 5, 17))).toBe("2026-06-18");
  });
});

const patient = (over: Partial<Patient>): Patient =>
  ({
    id: "p1",
    firstName: "Ana",
    lastName: "Ruiz",
    phone: "5512345678",
    clinicId: "clinic_001",
    createdBy: "doc_1",
    ...over,
  }) as Patient;

describe("filterCampaignWebRecipients con filtro por podólogo", () => {
  const patients = [
    patient({ id: "p1", createdBy: "doc_1" }),
    patient({ id: "p2", createdBy: "doc_2", firstName: "Beto" }),
    patient({ id: "p3", createdBy: "doc_1", firstName: "Carla" }),
  ];

  it("sin podiatristId incluye a todos", () => {
    const r = filterCampaignWebRecipients(patients, { clinicOnly: false, defaultCountry: "MX" });
    expect(r.map((x) => x.patientId)).toEqual(["p1", "p2", "p3"]);
  });

  it("filtra por el podólogo que creó al paciente", () => {
    const r = filterCampaignWebRecipients(patients, {
      clinicOnly: false,
      defaultCountry: "MX",
      podiatristId: "doc_1",
    });
    expect(r.map((x) => x.patientId)).toEqual(["p1", "p3"]);
  });

  it('trata "all" como sin filtro', () => {
    const r = filterCampaignWebRecipients(patients, {
      clinicOnly: false,
      defaultCountry: "MX",
      podiatristId: "all",
    });
    expect(r).toHaveLength(3);
  });

  it("se combina con el filtro de clínica", () => {
    const mixed = [...patients, patient({ id: "p4", createdBy: "doc_1", clinicId: "clinic_002" })];
    const r = filterCampaignWebRecipients(mixed, {
      clinicOnly: true,
      userClinicId: "clinic_001",
      defaultCountry: "MX",
      podiatristId: "doc_1",
    });
    expect(r.map((x) => x.patientId)).toEqual(["p1", "p3"]);
  });
});

describe("matchesPodiatristFilter", () => {
  it("no filtra sin selección, con 'all' o con cadena vacía", () => {
    expect(matchesPodiatristFilter("doc_1", undefined)).toBe(true);
    expect(matchesPodiatristFilter("doc_1", "all")).toBe(true);
    expect(matchesPodiatristFilter("doc_1", "   ")).toBe(true);
  });

  it("deja pasar solo las filas del podólogo elegido", () => {
    expect(matchesPodiatristFilter("doc_1", "doc_1")).toBe(true);
    expect(matchesPodiatristFilter("doc_2", "doc_1")).toBe(false);
  });

  it("descarta filas sin podólogo cuando hay filtro activo", () => {
    expect(matchesPodiatristFilter(null, "doc_1")).toBe(false);
    expect(matchesPodiatristFilter(undefined, "doc_1")).toBe(false);
    expect(matchesPodiatristFilter(null, "all")).toBe(true);
  });
});

describe("parseCampaignFilterJson", () => {
  it("lee el podólogo guardado en la campaña", () => {
    expect(parseCampaignFilterJson('{"clinicOnly":true,"podiatristId":"doc_1"}')).toEqual({
      clinicOnly: true,
      podiatristId: "doc_1",
    });
  });

  it("omite podiatristId cuando viene vacío o ausente", () => {
    expect(parseCampaignFilterJson('{"clinicOnly":false}')).toEqual({ clinicOnly: false });
    expect(parseCampaignFilterJson('{"podiatristId":"  "}')).toEqual({ clinicOnly: true });
  });

  it("cae a clinicOnly ante JSON inválido", () => {
    expect(parseCampaignFilterJson("no-json")).toEqual({ clinicOnly: true });
  });
});
