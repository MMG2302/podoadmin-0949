export interface SessionTemplateFields {
  anamnesis?: string;
  physicalExamination?: string;
  diagnosis?: string;
  treatmentPlan?: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  category: string;
  fields: SessionTemplateFields;
  isShared: boolean;
  createdBy?: string;
}

export const DEFAULT_TEMPLATE_FIELDS: SessionTemplateFields = {
  anamnesis: "",
  physicalExamination: "",
  diagnosis: "",
  treatmentPlan: "",
};

export function applySessionTemplateFields(
  fields: SessionTemplateFields,
  current: SessionTemplateFields
): SessionTemplateFields {
  return {
    anamnesis: String(fields.anamnesis ?? current.anamnesis ?? ""),
    physicalExamination: String(fields.physicalExamination ?? current.physicalExamination ?? ""),
    diagnosis: String(fields.diagnosis ?? current.diagnosis ?? ""),
    treatmentPlan: String(fields.treatmentPlan ?? current.treatmentPlan ?? ""),
  };
}

export function sessionFormHasClinicalContent(fields: SessionTemplateFields): boolean {
  return [fields.anamnesis, fields.physicalExamination, fields.diagnosis, fields.treatmentPlan].some(
    (s) => String(s ?? "").trim().length > 0
  );
}
