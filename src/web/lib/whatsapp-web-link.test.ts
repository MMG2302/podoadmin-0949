import { describe, expect, it } from "vitest";
import {
  applyCampaignWebMessage,
  applyWhatsAppWebTemplate,
  buildWaMeUrl,
  filterCampaignWebRecipients,
  getTomorrowLocalDateString,
  normalizePhoneForWaMe,
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

describe("applyCampaignWebMessage", () => {
  it("personaliza nombre y apellido", () => {
    const msg = applyCampaignWebMessage("Hola {{nombre}} {{apellido}} ({{nombre_completo}})", {
      firstName: "Ana",
      lastName: "López",
    });
    expect(msg).toBe("Hola Ana López (Ana López)");
  });
});

describe("filterCampaignWebRecipients", () => {
  it("incluye pacientes sin clinicId en JSON (listado ya filtrado por rol)", () => {
    const rows = filterCampaignWebRecipients(
      [{ id: "1", firstName: "A", lastName: "B", phone: "5512345678" }],
      { clinicOnly: true, userClinicId: "c1" }
    );
    expect(rows).toHaveLength(1);
  });

  it("filtra por clínica cuando clinicId está presente", () => {
    const rows = filterCampaignWebRecipients(
      [
        { id: "1", firstName: "A", lastName: "B", phone: "5512345678", clinicId: "c1" },
        { id: "2", firstName: "C", lastName: "D", phone: "", clinicId: "c1" },
        { id: "3", firstName: "E", lastName: "F", phone: "5598765432", clinicId: "c2" },
      ],
      { clinicOnly: true, userClinicId: "c1" }
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("1");
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
