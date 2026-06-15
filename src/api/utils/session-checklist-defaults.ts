export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export const DEFAULT_SESSION_CHECKLIST: ChecklistItem[] = [
  { id: 'consent', label: 'Consentimiento informado', done: false },
  { id: 'anamnesis', label: 'Anamnesis revisada', done: false },
  { id: 'hygiene', label: 'Higiene y desinfección del área', done: false },
  { id: 'instruments', label: 'Material estéril preparado', done: false },
  { id: 'exam', label: 'Exploración física registrada', done: false },
  { id: 'plan', label: 'Plan de tratamiento acordado', done: false },
  { id: 'followup', label: 'Próxima cita / seguimiento indicado', done: false },
];
