/** Traducciones de layout clínico, podología y strings compartidos de UI clínica. */

export type ClinicalKindI18n = { label: string; hint: string };

export type ClinicalLayoutI18n = {
  kinds: {
    custom_text: ClinicalKindI18n;
    custom_short_text: ClinicalKindI18n;
    custom_checklist: ClinicalKindI18n;
    custom_yes_no_na: ClinicalKindI18n;
    custom_single_choice: ClinicalKindI18n;
    custom_multi_choice: ClinicalKindI18n;
    custom_number: ClinicalKindI18n;
    custom_scale: ClinicalKindI18n;
    custom_conditional: ClinicalKindI18n;
    custom_table: ClinicalKindI18n;
  };
  builtins: {
    anamnesis: string;
    podiatry_morphology: string;
    podiatry_sweat: string;
    podiatry_limb: string;
    podiatry_helomas: string;
    podiatry_digital: string;
    podiatry_onychopathies: string;
    physical_examination: string;
    diagnosis: string;
    treatment_plan: string;
    clinical_notes: string;
    session_images: string;
    session_checklist: string;
    session_signature: string;
    patient_curp: string;
    patient_email: string;
    patient_address: string;
    patient_medical_history: string;
    patient_medical_historyHint: string;
    patient_family_history: string;
    patient_family_historyHint: string;
  };
  groups: {
    sesion: string;
    podiatry: string;
    paciente: string;
    custom: string;
  };
  defaults: {
    newSection: string;
    personalized: string;
    customSection: string;
    item1: string;
    item2: string;
    itemN: string;
    optionA: string;
    optionB: string;
    column1: string;
    column2: string;
    columnN: string;
    unit: string;
    applies: string;
    complication: string;
    product: string;
    quantity: string;
    lot: string;
  };
  designer: {
    intro: string;
    sectionsCount: string;
    includedCount: string;
    addCustomSection: string;
    sectionTitlePlaceholder: string;
    addCustomSectionBtn: string;
    editSection: string;
    titleLabel: string;
    includeInTemplate: string;
    includeHint: string;
    defaultContent: string;
    defaultContentPlaceholder: string;
    noPresetContent: string;
    removeCustomSection: string;
    selectSection: string;
    previewTitle: string;
    systemField: string;
    noneIncluded: string;
  };
  customUi: {
    yes: string;
    no: string;
    na: string;
    obsPlaceholder: string;
    noPositiveFindings: string;
    triStateHint: string;
    itemCol: string;
    answerCol: string;
    obsCol: string;
    detailPlaceholder: string;
    yesNoNaTable: string;
    rowsCount: string;
    numberWithUnit: string;
    scaleLabel: string;
    conditionalNoteIfYes: string;
    tableSize: string;
  };
  editor: {
    checklistItems: string;
    yesNoNaRows: string;
    options: string;
    yesNoNaRowsHint: string;
    addItem: string;
    addRow: string;
    addOption: string;
    remove: string;
    maxColumns: string;
    unit: string;
    unitPlaceholder: string;
    scaleMax: string;
    conditionalPrompt: string;
    tableColumns: string;
    tableColumnsHint: string;
    addColumn: string;
    tableRows: string;
  };
};

export type PodiatryI18n = {
  foot: {
    egyptian: string;
    roman: string;
    greek: string;
    germanic: string;
    celtic: string;
  };
  arch: {
    flat: string;
    normal: string;
    cavus: string;
  };
  sweat: {
    bromhidrosis: string;
    hiperhidrosis: string;
    anhidrosis: string;
  };
  limb: {
    edema: string;
    xerosis: string;
    varices: string;
    dermatomycosis: string;
  };
  helomas: {
    interphalangeal: string;
    interdigital: string;
    dorsal_fifth: string;
  };
  digital: {
    hallux_valgus: string;
    fifth_varus: string;
    claw_toes: string;
  };
  onychopathies: {
    anoniquia: string;
    microniquia: string;
    onicolisis: string;
    onicauxis: string;
    onicocriptosis: string;
    onicogriptosis: string;
    onicofosis: string;
    paquioniquia: string;
    onicomicosis: string;
  };
  exam: {
    morphologyTitle: string;
    morphologyHint: string;
    footType: string;
    archType: string;
    unspecified: string;
    sweatTitle: string;
    disorder: string;
    limbTitle: string;
    sign: string;
    left: string;
    right: string;
    obs: string;
    helomasTitle: string;
    helomasHint: string;
    type: string;
    digitalTitle: string;
    alteration: string;
    onychopathiesTitle: string;
    onychopathiesHint: string;
    onychopathy: string;
    toesLeft: string;
    toesRight: string;
    siNoHint: string;
    yes: string;
    no: string;
    dash: string;
  };
};

export type ErrorBoundaryI18n = {
  title: string;
  message: string;
  reload: string;
};

export type ClinicalListI18n = {
  loading: string;
  retry: string;
  loadFailed: string;
  requestTimeout: string;
  loadPatientsError: string;
  loadSessionsError: string;
  loadClinicalDataError: string;
};

export type PatientsClinicalI18n = {
  familyTitle: string;
  familyHint: string;
  familyOtherHint: string;
  otherConditionPlaceholder: string;
  notesOptional: string;
  familyLabels: {
    hypertension: string;
    diabetes: string;
    psoriasis: string;
    other: string;
  };
  yes: string;
  no: string;
  alertsTitle: string;
  noAlerts: string;
  removeAlert: string;
  alertTypeAllergy: string;
  alertTypeDiabetes: string;
  alertTypeAnticoagulant: string;
  alertTypeOther: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
  alertDescPlaceholder: string;
  addAlert: string;
  labsTitle: string;
  labsHint: string;
  labsTitlePlaceholder: string;
  labsTitleRequired: string;
  uploading: string;
  uploadError: string;
  evolutionTitle: string;
  printReport: string;
  noEvolutionNotes: string;
  evolutionPlaceholder: string;
  addNote: string;
  saving: string;
  searchPlaceholder: string;
  searchEmptyHint: string;
  ineligibleSuffix: string;
  changePatient: string;
  changePatientAria: string;
  searching: string;
  noResults: string;
  refreshPatient: string;
};

export type SessionsClinicalI18n = {
  checklistTitle: string;
  signatureTitle: string;
  signatureHint: string;
  signatureLoading: string;
  signatureAlt: string;
  signatureSavedAt: string;
  signatureRedraw: string;
  signatureEmpty: string;
  signatureClear: string;
  signatureSave: string;
  signatureSaved: string;
  evolutionReport: string;
  evolutionReportLoading: string;
};

export type ClinicalToolsExtrasI18n = {
  categories: {
    general: string;
    dermatologia: string;
    unas: string;
    biomecanica: string;
    cirugia: string;
  };
  presets: {
    heloma: string;
    onychocryptosis: string;
    surgery: string;
  };
  scopeClinic: string;
  scopePersonal: string;
};

export type CalendarGridI18n = {
  noTime: string;
  podiatristsLegend: string;
  sameColorInitials: string;
  agendaOf: string;
};

export type ClinicalSharedBundle = {
  clinicalLayout: ClinicalLayoutI18n;
  podiatry: PodiatryI18n;
  errorBoundary: ErrorBoundaryI18n;
  clinicalList: ClinicalListI18n;
  patientsClinical: PatientsClinicalI18n;
  sessionsClinical: SessionsClinicalI18n;
  clinicalToolsExtras: ClinicalToolsExtrasI18n;
  calendarGrid: CalendarGridI18n;
};

const clinicalLayoutEs: ClinicalLayoutI18n = {
  kinds: {
    custom_text: {
      label: "Texto libre",
      hint: "Párrafo amplio: observaciones, protocolo, notas.",
    },
    custom_short_text: {
      label: "Texto corto",
      hint: "Una línea: lote, color, referencia, código.",
    },
    custom_checklist: {
      label: "Checklist",
      hint: "Casillas independientes (material, pasos del servicio).",
    },
    custom_yes_no_na: {
      label: "SI / NO / N/A",
      hint: "Tabla con filas configurables. Sin marcar = NO al guardar.",
    },
    custom_single_choice: {
      label: "Opción única",
      hint: "Radio: tipo de visita, gravedad, una sola respuesta.",
    },
    custom_multi_choice: {
      label: "Opción múltiple",
      hint: "Varias opciones a la vez: servicios, zonas tratadas.",
    },
    custom_number: {
      label: "Número + unidad",
      hint: "Cantidad con unidad (min, ml, mm, %).",
    },
    custom_scale: {
      label: "Escala 0–10",
      hint: "Dolor, satisfacción, adherencia.",
    },
    custom_conditional: {
      label: "SI/NO + nota",
      hint: "Pregunta sí/no; si es SÍ, aparece texto adicional.",
    },
    custom_table: {
      label: "Tabla simple",
      hint: "Filas × columnas de texto (producto, cantidad, lote).",
    },
  },
  builtins: {
    anamnesis: "Anamnesis",
    podiatry_morphology: "Tipo de pie y arco",
    podiatry_sweat: "Patología del sudor",
    podiatry_limb: "Valoración pie y pierna",
    podiatry_helomas: "Helomas / hiperqueratosis",
    podiatry_digital: "Alteraciones digitales",
    podiatry_onychopathies: "Onicopatías",
    physical_examination: "Exploración física",
    diagnosis: "Diagnóstico",
    treatment_plan: "Plan de tratamiento",
    clinical_notes: "Notas clínicas",
    session_images: "Fotos de sesión",
    session_checklist: "Checklist de sesión",
    session_signature: "Firma del paciente",
    patient_curp: "CURP (ficha paciente)",
    patient_email: "Email (ficha paciente)",
    patient_address: "Dirección (ficha paciente)",
    patient_medical_history: "Antecedentes personales (ficha)",
    patient_medical_historyHint:
      "Alergias, medicación habitual y patologías crónicas del paciente",
    patient_family_history: "Antecedentes familiares (ficha)",
    patient_family_historyHint:
      "Hipertensión, diabetes, psoriasis y otras enfermedades relevantes en familiares",
  },
  groups: {
    sesion: "sesión",
    podiatry: "podología",
    paciente: "paciente",
    custom: "personalizada",
  },
  defaults: {
    newSection: "Nueva sección",
    personalized: "Personalizada",
    customSection: "Sección personalizada",
    item1: "Ítem 1",
    item2: "Ítem 2",
    itemN: "Ítem {n}",
    optionA: "Opción A",
    optionB: "Opción B",
    column1: "Columna 1",
    column2: "Columna 2",
    columnN: "Columna {n}",
    unit: "unidad",
    applies: "¿Aplica?",
    complication: "¿Hubo complicación?",
    product: "Producto",
    quantity: "Cantidad",
    lot: "Lote",
  },
  designer: {
    intro:
      "Marca «Incluir en plantilla» solo en los bloques que correspondan (p. ej. sin helomas en cirugía). Al cargar la plantilla en una sesión, solo aparecerán esas secciones; las personalizadas creadas aquí se muestran automáticamente sin pasar por Configuración.",
    sectionsCount: "Secciones ({n})",
    includedCount: "{n} incluidas",
    addCustomSection: "Añadir sección personalizada",
    sectionTitlePlaceholder: "Título de la sección",
    addCustomSectionBtn: "+ Añadir sección personalizada",
    editSection: "Editar sección",
    titleLabel: "Título",
    includeInTemplate: "Incluir en plantilla",
    includeHint: "Solo las secciones incluidas se cargarán al aplicar esta plantilla en una sesión.",
    defaultContent: "Contenido predeterminado",
    defaultContentPlaceholder: "Contenido predeterminado para {label}",
    noPresetContent: "Esta sección no admite contenido predefinido en plantillas.",
    removeCustomSection: "Eliminar sección personalizada",
    selectSection: "Selecciona una sección de la lista",
    previewTitle: "Vista previa — plantilla",
    systemField: "Campo del sistema",
    noneIncluded: "Ninguna sección incluida en la plantilla.",
  },
  customUi: {
    yes: "SI",
    no: "NO",
    na: "N/A",
    obsPlaceholder: "Obs.",
    noPositiveFindings: "Sin hallazgos positivos.",
    triStateHint: "Marque SI solo si aplica. Sin marcar = NO al guardar.",
    itemCol: "Ítem",
    answerCol: "Respuesta",
    obsCol: "Observación",
    detailPlaceholder: "Detalle…",
    yesNoNaTable: "Tabla SI/NO/N/A",
    rowsCount: "{n} filas",
    numberWithUnit: "Número ({unit})",
    scaleLabel: "Escala 0–{max}",
    conditionalNoteIfYes: "→ nota si SI",
    tableSize: "Tabla {rows}×{cols}",
  },
  editor: {
    checklistItems: "Ítems del checklist",
    yesNoNaRows: "Filas SI / NO / N/A",
    options: "Opciones",
    yesNoNaRowsHint: "Cada fila será una pregunta en la sesión.",
    addItem: "+ Añadir ítem",
    addRow: "+ Añadir fila",
    addOption: "+ Añadir opción",
    remove: "Quitar",
    maxColumns: "Máximo {n} columnas.",
    unit: "Unidad",
    unitPlaceholder: "min, ml, mm, %…",
    scaleMax: "Escala máxima",
    conditionalPrompt: "Pregunta SI/NO",
    tableColumns: "Columnas de la tabla",
    tableColumnsHint: "Nombre de cada columna (p. ej. producto, cantidad, lote).",
    addColumn: "+ Añadir columna",
    tableRows: "Filas en sesión",
  },
};

const clinicalLayoutEn: ClinicalLayoutI18n = {
  kinds: {
    custom_text: {
      label: "Free text",
      hint: "Long paragraph: observations, protocol, notes.",
    },
    custom_short_text: {
      label: "Short text",
      hint: "One line: batch, color, reference, code.",
    },
    custom_checklist: {
      label: "Checklist",
      hint: "Independent checkboxes (supplies, service steps).",
    },
    custom_yes_no_na: {
      label: "YES / NO / N/A",
      hint: "Table with configurable rows. Unchecked = NO when saving.",
    },
    custom_single_choice: {
      label: "Single choice",
      hint: "Radio: visit type, severity, one answer only.",
    },
    custom_multi_choice: {
      label: "Multiple choice",
      hint: "Several options at once: services, treated areas.",
    },
    custom_number: {
      label: "Number + unit",
      hint: "Quantity with unit (min, ml, mm, %).",
    },
    custom_scale: {
      label: "Scale 0–10",
      hint: "Pain, satisfaction, adherence.",
    },
    custom_conditional: {
      label: "YES/NO + note",
      hint: "Yes/no question; if YES, extra text appears.",
    },
    custom_table: {
      label: "Simple table",
      hint: "Rows × text columns (product, quantity, batch).",
    },
  },
  builtins: {
    anamnesis: "Anamnesis",
    podiatry_morphology: "Foot type and arch",
    podiatry_sweat: "Sweat pathology",
    podiatry_limb: "Foot and leg assessment",
    podiatry_helomas: "Helomas / hyperkeratosis",
    podiatry_digital: "Digital alterations",
    podiatry_onychopathies: "Onychopathies",
    physical_examination: "Physical examination",
    diagnosis: "Diagnosis",
    treatment_plan: "Treatment plan",
    clinical_notes: "Clinical notes",
    session_images: "Session photos",
    session_checklist: "Session checklist",
    session_signature: "Patient signature",
    patient_curp: "CURP (patient record)",
    patient_email: "Email (patient record)",
    patient_address: "Address (patient record)",
    patient_medical_history: "Personal history (record)",
    patient_medical_historyHint: "Allergies, regular medication and chronic conditions",
    patient_family_history: "Family history (record)",
    patient_family_historyHint:
      "Hypertension, diabetes, psoriasis and other relevant family conditions",
  },
  groups: {
    sesion: "session",
    podiatry: "podiatry",
    paciente: "patient",
    custom: "custom",
  },
  defaults: {
    newSection: "New section",
    personalized: "Custom",
    customSection: "Custom section",
    item1: "Item 1",
    item2: "Item 2",
    itemN: "Item {n}",
    optionA: "Option A",
    optionB: "Option B",
    column1: "Column 1",
    column2: "Column 2",
    columnN: "Column {n}",
    unit: "unit",
    applies: "Applies?",
    complication: "Was there a complication?",
    product: "Product",
    quantity: "Quantity",
    lot: "Batch",
  },
  designer: {
    intro:
      "Check «Include in template» only for the blocks that apply (e.g. no helomas in surgery). When loading the template in a session, only those sections appear; custom ones created here show automatically without going through Settings.",
    sectionsCount: "Sections ({n})",
    includedCount: "{n} included",
    addCustomSection: "Add custom section",
    sectionTitlePlaceholder: "Section title",
    addCustomSectionBtn: "+ Add custom section",
    editSection: "Edit section",
    titleLabel: "Title",
    includeInTemplate: "Include in template",
    includeHint: "Only included sections will load when applying this template to a session.",
    defaultContent: "Default content",
    defaultContentPlaceholder: "Default content for {label}",
    noPresetContent: "This section does not support predefined template content.",
    removeCustomSection: "Remove custom section",
    selectSection: "Select a section from the list",
    previewTitle: "Preview — template",
    systemField: "System field",
    noneIncluded: "No sections included in the template.",
  },
  customUi: {
    yes: "YES",
    no: "NO",
    na: "N/A",
    obsPlaceholder: "Notes",
    noPositiveFindings: "No positive findings.",
    triStateHint: "Mark YES only if it applies. Unchecked = NO when saving.",
    itemCol: "Item",
    answerCol: "Answer",
    obsCol: "Notes",
    detailPlaceholder: "Details…",
    yesNoNaTable: "YES/NO/N/A table",
    rowsCount: "{n} rows",
    numberWithUnit: "Number ({unit})",
    scaleLabel: "Scale 0–{max}",
    conditionalNoteIfYes: "→ note if YES",
    tableSize: "Table {rows}×{cols}",
  },
  editor: {
    checklistItems: "Checklist items",
    yesNoNaRows: "YES / NO / N/A rows",
    options: "Options",
    yesNoNaRowsHint: "Each row will be a question in the session.",
    addItem: "+ Add item",
    addRow: "+ Add row",
    addOption: "+ Add option",
    remove: "Remove",
    maxColumns: "Maximum {n} columns.",
    unit: "Unit",
    unitPlaceholder: "min, ml, mm, %…",
    scaleMax: "Maximum scale",
    conditionalPrompt: "YES/NO question",
    tableColumns: "Table columns",
    tableColumnsHint: "Name of each column (e.g. product, quantity, batch).",
    addColumn: "+ Add column",
    tableRows: "Rows in session",
  },
};

const clinicalLayoutPt: ClinicalLayoutI18n = {
  kinds: {
    custom_text: {
      label: "Texto livre",
      hint: "Parágrafo amplo: observações, protocolo, notas.",
    },
    custom_short_text: {
      label: "Texto curto",
      hint: "Uma linha: lote, cor, referência, código.",
    },
    custom_checklist: {
      label: "Checklist",
      hint: "Caixas independentes (material, passos do serviço).",
    },
    custom_yes_no_na: {
      label: "SIM / NÃO / N/A",
      hint: "Tabela com linhas configuráveis. Sem marcar = NÃO ao guardar.",
    },
    custom_single_choice: {
      label: "Opção única",
      hint: "Rádio: tipo de visita, gravidade, uma só resposta.",
    },
    custom_multi_choice: {
      label: "Opção múltipla",
      hint: "Várias opções de uma vez: serviços, zonas tratadas.",
    },
    custom_number: {
      label: "Número + unidade",
      hint: "Quantidade com unidade (min, ml, mm, %).",
    },
    custom_scale: {
      label: "Escala 0–10",
      hint: "Dor, satisfação, adesão.",
    },
    custom_conditional: {
      label: "SIM/NÃO + nota",
      hint: "Pergunta sim/não; se for SIM, aparece texto adicional.",
    },
    custom_table: {
      label: "Tabela simples",
      hint: "Linhas × colunas de texto (produto, quantidade, lote).",
    },
  },
  builtins: {
    anamnesis: "Anamnese",
    podiatry_morphology: "Tipo de pé e arco",
    podiatry_sweat: "Patologia do suor",
    podiatry_limb: "Avaliação pé e perna",
    podiatry_helomas: "Helomas / hiperqueratose",
    podiatry_digital: "Alterações digitais",
    podiatry_onychopathies: "Onicopatias",
    physical_examination: "Exame físico",
    diagnosis: "Diagnóstico",
    treatment_plan: "Plano de tratamento",
    clinical_notes: "Notas clínicas",
    session_images: "Fotos da sessão",
    session_checklist: "Checklist da sessão",
    session_signature: "Assinatura do paciente",
    patient_curp: "CURP (ficha do paciente)",
    patient_email: "Email (ficha do paciente)",
    patient_address: "Morada (ficha do paciente)",
    patient_medical_history: "Antecedentes pessoais (ficha)",
    patient_medical_historyHint: "Alergias, medicação habitual e patologias crónicas",
    patient_family_history: "Antecedentes familiares (ficha)",
    patient_family_historyHint:
      "Hipertensão, diabetes, psoríase e outras doenças relevantes em familiares",
  },
  groups: {
    sesion: "sessão",
    podiatry: "podologia",
    paciente: "paciente",
    custom: "personalizada",
  },
  defaults: {
    newSection: "Nova secção",
    personalized: "Personalizada",
    customSection: "Secção personalizada",
    item1: "Item 1",
    item2: "Item 2",
    itemN: "Item {n}",
    optionA: "Opção A",
    optionB: "Opção B",
    column1: "Coluna 1",
    column2: "Coluna 2",
    columnN: "Coluna {n}",
    unit: "unidade",
    applies: "Aplica-se?",
    complication: "Houve complicação?",
    product: "Produto",
    quantity: "Quantidade",
    lot: "Lote",
  },
  designer: {
    intro:
      "Marque «Incluir na plantilha» apenas nos blocos que correspondam (p. ex. sem helomas em cirurgia). Ao carregar a plantilha numa sessão, só essas secções aparecem; as personalizadas criadas aqui mostram-se automaticamente sem passar por Definições.",
    sectionsCount: "Secções ({n})",
    includedCount: "{n} incluídas",
    addCustomSection: "Adicionar secção personalizada",
    sectionTitlePlaceholder: "Título da secção",
    addCustomSectionBtn: "+ Adicionar secção personalizada",
    editSection: "Editar secção",
    titleLabel: "Título",
    includeInTemplate: "Incluir na plantilha",
    includeHint: "Apenas as secções incluídas serão carregadas ao aplicar esta plantilha numa sessão.",
    defaultContent: "Conteúdo predefinido",
    defaultContentPlaceholder: "Conteúdo predefinido para {label}",
    noPresetContent: "Esta secção não admite conteúdo predefinido em plantilhas.",
    removeCustomSection: "Eliminar secção personalizada",
    selectSection: "Selecione uma secção da lista",
    previewTitle: "Pré-visualização — plantilha",
    systemField: "Campo do sistema",
    noneIncluded: "Nenhuma secção incluída na plantilha.",
  },
  customUi: {
    yes: "SIM",
    no: "NÃO",
    na: "N/A",
    obsPlaceholder: "Obs.",
    noPositiveFindings: "Sem achados positivos.",
    triStateHint: "Marque SIM apenas se aplicável. Sem marcar = NÃO ao guardar.",
    itemCol: "Item",
    answerCol: "Resposta",
    obsCol: "Observação",
    detailPlaceholder: "Detalhe…",
    yesNoNaTable: "Tabela SIM/NÃO/N/A",
    rowsCount: "{n} linhas",
    numberWithUnit: "Número ({unit})",
    scaleLabel: "Escala 0–{max}",
    conditionalNoteIfYes: "→ nota se SIM",
    tableSize: "Tabela {rows}×{cols}",
  },
  editor: {
    checklistItems: "Itens do checklist",
    yesNoNaRows: "Linhas SIM / NÃO / N/A",
    options: "Opções",
    yesNoNaRowsHint: "Cada linha será uma pergunta na sessão.",
    addItem: "+ Adicionar item",
    addRow: "+ Adicionar linha",
    addOption: "+ Adicionar opção",
    remove: "Remover",
    maxColumns: "Máximo de {n} colunas.",
    unit: "Unidade",
    unitPlaceholder: "min, ml, mm, %…",
    scaleMax: "Escala máxima",
    conditionalPrompt: "Pergunta SIM/NÃO",
    tableColumns: "Colunas da tabela",
    tableColumnsHint: "Nome de cada coluna (p. ex. produto, quantidade, lote).",
    addColumn: "+ Adicionar coluna",
    tableRows: "Linhas na sessão",
  },
};

const clinicalLayoutFr: ClinicalLayoutI18n = {
  kinds: {
    custom_text: {
      label: "Texte libre",
      hint: "Paragraphe long : observations, protocole, notes.",
    },
    custom_short_text: {
      label: "Texte court",
      hint: "Une ligne : lot, couleur, référence, code.",
    },
    custom_checklist: {
      label: "Checklist",
      hint: "Cases indépendantes (matériel, étapes du service).",
    },
    custom_yes_no_na: {
      label: "OUI / NON / N/A",
      hint: "Tableau avec lignes configurables. Non coché = NON à l'enregistrement.",
    },
    custom_single_choice: {
      label: "Choix unique",
      hint: "Radio : type de visite, gravité, une seule réponse.",
    },
    custom_multi_choice: {
      label: "Choix multiple",
      hint: "Plusieurs options à la fois : services, zones traitées.",
    },
    custom_number: {
      label: "Nombre + unité",
      hint: "Quantité avec unité (min, ml, mm, %).",
    },
    custom_scale: {
      label: "Échelle 0–10",
      hint: "Douleur, satisfaction, observance.",
    },
    custom_conditional: {
      label: "OUI/NON + note",
      hint: "Question oui/non ; si OUI, un texte supplémentaire apparaît.",
    },
    custom_table: {
      label: "Tableau simple",
      hint: "Lignes × colonnes de texte (produit, quantité, lot).",
    },
  },
  builtins: {
    anamnesis: "Anamnèse",
    podiatry_morphology: "Type de pied et voûte",
    podiatry_sweat: "Pathologie de la sueur",
    podiatry_limb: "Évaluation pied et jambe",
    podiatry_helomas: "Hélomes / hyperkératose",
    podiatry_digital: "Altérations digitales",
    podiatry_onychopathies: "Onychopathies",
    physical_examination: "Examen physique",
    diagnosis: "Diagnostic",
    treatment_plan: "Plan de traitement",
    clinical_notes: "Notes cliniques",
    session_images: "Photos de séance",
    session_checklist: "Checklist de séance",
    session_signature: "Signature du patient",
    patient_curp: "CURP (fiche patient)",
    patient_email: "Email (fiche patient)",
    patient_address: "Adresse (fiche patient)",
    patient_medical_history: "Antécédents personnels (fiche)",
    patient_medical_historyHint: "Allergies, médicaments habituels et pathologies chroniques",
    patient_family_history: "Antécédents familiaux (fiche)",
    patient_family_historyHint:
      "Hypertension, diabète, psoriasis et autres maladies familiales pertinentes",
  },
  groups: {
    sesion: "séance",
    podiatry: "podologie",
    paciente: "patient",
    custom: "personnalisée",
  },
  defaults: {
    newSection: "Nouvelle section",
    personalized: "Personnalisée",
    customSection: "Section personnalisée",
    item1: "Élément 1",
    item2: "Élément 2",
    itemN: "Élément {n}",
    optionA: "Option A",
    optionB: "Option B",
    column1: "Colonne 1",
    column2: "Colonne 2",
    columnN: "Colonne {n}",
    unit: "unité",
    applies: "S'applique ?",
    complication: "Y a-t-il eu une complication ?",
    product: "Produit",
    quantity: "Quantité",
    lot: "Lot",
  },
  designer: {
    intro:
      "Cochez « Inclure dans le modèle » uniquement pour les blocs concernés (p. ex. sans hélomes en chirurgie). Au chargement du modèle dans une séance, seules ces sections apparaissent ; les personnalisées créées ici s'affichent automatiquement sans passer par Paramètres.",
    sectionsCount: "Sections ({n})",
    includedCount: "{n} incluses",
    addCustomSection: "Ajouter une section personnalisée",
    sectionTitlePlaceholder: "Titre de la section",
    addCustomSectionBtn: "+ Ajouter une section personnalisée",
    editSection: "Modifier la section",
    titleLabel: "Titre",
    includeInTemplate: "Inclure dans le modèle",
    includeHint:
      "Seules les sections incluses seront chargées lors de l'application de ce modèle à une séance.",
    defaultContent: "Contenu par défaut",
    defaultContentPlaceholder: "Contenu par défaut pour {label}",
    noPresetContent: "Cette section n'admet pas de contenu prédéfini dans les modèles.",
    removeCustomSection: "Supprimer la section personnalisée",
    selectSection: "Sélectionnez une section de la liste",
    previewTitle: "Aperçu — modèle",
    systemField: "Champ système",
    noneIncluded: "Aucune section incluse dans le modèle.",
  },
  customUi: {
    yes: "OUI",
    no: "NON",
    na: "N/A",
    obsPlaceholder: "Obs.",
    noPositiveFindings: "Pas de constatations positives.",
    triStateHint: "Cochez OUI uniquement si applicable. Non coché = NON à l'enregistrement.",
    itemCol: "Élément",
    answerCol: "Réponse",
    obsCol: "Observation",
    detailPlaceholder: "Détail…",
    yesNoNaTable: "Tableau OUI/NON/N/A",
    rowsCount: "{n} lignes",
    numberWithUnit: "Nombre ({unit})",
    scaleLabel: "Échelle 0–{max}",
    conditionalNoteIfYes: "→ note si OUI",
    tableSize: "Tableau {rows}×{cols}",
  },
  editor: {
    checklistItems: "Éléments de la checklist",
    yesNoNaRows: "Lignes OUI / NON / N/A",
    options: "Options",
    yesNoNaRowsHint: "Chaque ligne sera une question dans la séance.",
    addItem: "+ Ajouter un élément",
    addRow: "+ Ajouter une ligne",
    addOption: "+ Ajouter une option",
    remove: "Retirer",
    maxColumns: "Maximum {n} colonnes.",
    unit: "Unité",
    unitPlaceholder: "min, ml, mm, %…",
    scaleMax: "Échelle maximale",
    conditionalPrompt: "Question OUI/NON",
    tableColumns: "Colonnes du tableau",
    tableColumnsHint: "Nom de chaque colonne (p. ex. produit, quantité, lot).",
    addColumn: "+ Ajouter une colonne",
    tableRows: "Lignes en séance",
  },
};

const podiatryEs: PodiatryI18n = {
  foot: {
    egyptian: "Egipcio",
    roman: "Romano",
    greek: "Griego",
    germanic: "Germánico",
    celtic: "Celta",
  },
  arch: { flat: "Plano", normal: "Normal", cavus: "Cavo" },
  sweat: {
    bromhidrosis: "Bromhidrosis",
    hiperhidrosis: "Hiperhidrosis",
    anhidrosis: "Anhidrosis",
  },
  limb: {
    edema: "Edema",
    xerosis: "Resequedad",
    varices: "Varices",
    dermatomycosis: "Dermatomicosis",
  },
  helomas: {
    interphalangeal: "Interfalángico (2-4)",
    interdigital: "Interdigitales",
    dorsal_fifth: "Dorsal 5º dedo",
  },
  digital: {
    hallux_valgus: "Hallux valgus",
    fifth_varus: "Quinto varo",
    claw_toes: "Dedos garra (2-4)",
  },
  onychopathies: {
    anoniquia: "Anoniquia",
    microniquia: "Microniquia",
    onicolisis: "Onicolisis",
    onicauxis: "Onicauxis",
    onicocriptosis: "Onicocriptosis",
    onicogriptosis: "Onicogriptosis",
    onicofosis: "Onicofosis",
    paquioniquia: "Paquioniquia",
    onicomicosis: "Onicomicosis",
  },
  exam: {
    morphologyTitle: "Morfología podológica",
    morphologyHint: "Se usa en la historia imprimible (prioridad sobre texto libre en notas).",
    footType: "Tipo de pie",
    archType: "Tipo de planta / arco",
    unspecified: "Sin especificar",
    sweatTitle: "Patología del sudor",
    disorder: "Trastorno",
    limbTitle: "Valoración pie y pierna",
    sign: "Signo",
    left: "Izq.",
    right: "Der.",
    obs: "Obs.",
    helomasTitle: "Helomas / hiperqueratosis",
    helomasHint: "Indique localización si aplica.",
    type: "Tipo",
    digitalTitle: "Alteraciones digitales",
    alteration: "Alteración",
    onychopathiesTitle: "Onicopatías",
    onychopathiesHint:
      "En impresión solo salen hallazgos positivos; aquí se muestra el registro completo.",
    onychopathy: "Onicopatía",
    toesLeft: "Dedos izq.",
    toesRight: "Dedos der.",
    siNoHint: "Marque SI solo si está presente. Sin marcar se asume NO.",
    yes: "SI",
    no: "NO",
    dash: "—",
  },
};

const podiatryEn: PodiatryI18n = {
  foot: {
    egyptian: "Egyptian",
    roman: "Roman",
    greek: "Greek",
    germanic: "Germanic",
    celtic: "Celtic",
  },
  arch: { flat: "Flat", normal: "Normal", cavus: "Cavus" },
  sweat: {
    bromhidrosis: "Bromhidrosis",
    hiperhidrosis: "Hyperhidrosis",
    anhidrosis: "Anhidrosis",
  },
  limb: {
    edema: "Edema",
    xerosis: "Xerosis",
    varices: "Varices",
    dermatomycosis: "Dermatomycosis",
  },
  helomas: {
    interphalangeal: "Interphalangeal (2-4)",
    interdigital: "Interdigital",
    dorsal_fifth: "Dorsal 5th toe",
  },
  digital: {
    hallux_valgus: "Hallux valgus",
    fifth_varus: "Fifth varus",
    claw_toes: "Claw toes (2-4)",
  },
  onychopathies: {
    anoniquia: "Anoniquia",
    microniquia: "Microniquia",
    onicolisis: "Onycholysis",
    onicauxis: "Onychauxis",
    onicocriptosis: "Onychocryptosis",
    onicogriptosis: "Onychogryptosis",
    onicofosis: "Onychophosis",
    paquioniquia: "Pachyonychia",
    onicomicosis: "Onychomycosis",
  },
  exam: {
    morphologyTitle: "Podiatric morphology",
    morphologyHint: "Used in the printable history (takes priority over free-text notes).",
    footType: "Foot type",
    archType: "Arch / plantar type",
    unspecified: "Unspecified",
    sweatTitle: "Sweat pathology",
    disorder: "Disorder",
    limbTitle: "Foot and leg assessment",
    sign: "Sign",
    left: "L",
    right: "R",
    obs: "Notes",
    helomasTitle: "Helomas / hyperkeratosis",
    helomasHint: "Indicate location if applicable.",
    type: "Type",
    digitalTitle: "Digital alterations",
    alteration: "Alteration",
    onychopathiesTitle: "Onychopathies",
    onychopathiesHint:
      "Print shows positive findings only; the full record is shown here.",
    onychopathy: "Onychopathy",
    toesLeft: "Left toes",
    toesRight: "Right toes",
    siNoHint: "Mark YES only if present. Unchecked is assumed NO.",
    yes: "YES",
    no: "NO",
    dash: "—",
  },
};

const podiatryPt: PodiatryI18n = {
  foot: {
    egyptian: "Egípcio",
    roman: "Romano",
    greek: "Grego",
    germanic: "Germânico",
    celtic: "Celta",
  },
  arch: { flat: "Plano", normal: "Normal", cavus: "Cavo" },
  sweat: {
    bromhidrosis: "Bromidrose",
    hiperhidrosis: "Hiperidrose",
    anhidrosis: "Anidrose",
  },
  limb: {
    edema: "Edema",
    xerosis: "Xerose",
    varices: "Varizes",
    dermatomycosis: "Dermatomicose",
  },
  helomas: {
    interphalangeal: "Interfalângico (2-4)",
    interdigital: "Interdigitais",
    dorsal_fifth: "Dorsal 5.º dedo",
  },
  digital: {
    hallux_valgus: "Hallux valgus",
    fifth_varus: "Quinto varo",
    claw_toes: "Dedos em garra (2-4)",
  },
  onychopathies: {
    anoniquia: "Anoníquia",
    microniquia: "Microníquia",
    onicolisis: "Onicólise",
    onicauxis: "Onicauxis",
    onicocriptosis: "Onicocriptose",
    onicogriptosis: "Onicogriptose",
    onicofosis: "Onicofose",
    paquioniquia: "Paquioníquia",
    onicomicosis: "Onicomicose",
  },
  exam: {
    morphologyTitle: "Morfologia podológica",
    morphologyHint: "Usa-se na história imprimível (prioridade sobre texto livre nas notas).",
    footType: "Tipo de pé",
    archType: "Tipo de planta / arco",
    unspecified: "Não especificado",
    sweatTitle: "Patologia do suor",
    disorder: "Perturbação",
    limbTitle: "Avaliação pé e perna",
    sign: "Sinal",
    left: "Esq.",
    right: "Dir.",
    obs: "Obs.",
    helomasTitle: "Helomas / hiperqueratose",
    helomasHint: "Indique a localização se aplicável.",
    type: "Tipo",
    digitalTitle: "Alterações digitais",
    alteration: "Alteração",
    onychopathiesTitle: "Onicopatias",
    onychopathiesHint:
      "Na impressão só saem achados positivos; aqui mostra-se o registo completo.",
    onychopathy: "Onicopatia",
    toesLeft: "Dedos esq.",
    toesRight: "Dedos dir.",
    siNoHint: "Marque SIM apenas se estiver presente. Sem marcar assume-se NÃO.",
    yes: "SIM",
    no: "NÃO",
    dash: "—",
  },
};

const podiatryFr: PodiatryI18n = {
  foot: {
    egyptian: "Égyptien",
    roman: "Romain",
    greek: "Grec",
    germanic: "Germanique",
    celtic: "Celte",
  },
  arch: { flat: "Plat", normal: "Normal", cavus: "Creux" },
  sweat: {
    bromhidrosis: "Bromhidrose",
    hiperhidrosis: "Hyperhidrose",
    anhidrosis: "Anhidrose",
  },
  limb: {
    edema: "Œdème",
    xerosis: "Xérose",
    varices: "Varices",
    dermatomycosis: "Dermatomycose",
  },
  helomas: {
    interphalangeal: "Interphalangien (2-4)",
    interdigital: "Interdigitaux",
    dorsal_fifth: "Dorsal 5e orteil",
  },
  digital: {
    hallux_valgus: "Hallux valgus",
    fifth_varus: "Cinquième varus",
    claw_toes: "Orteils en griffe (2-4)",
  },
  onychopathies: {
    anoniquia: "Anonychie",
    microniquia: "Micronychie",
    onicolisis: "Onycholyse",
    onicauxis: "Onychauxis",
    onicocriptosis: "Onychocryptose",
    onicogriptosis: "Onychogryptose",
    onicofosis: "Onychophose",
    paquioniquia: "Pachyonychie",
    onicomicosis: "Onychomycose",
  },
  exam: {
    morphologyTitle: "Morphologie podologique",
    morphologyHint: "Utilisé dans l'historique imprimable (priorité sur le texte libre des notes).",
    footType: "Type de pied",
    archType: "Type de voûte / plante",
    unspecified: "Non précisé",
    sweatTitle: "Pathologie de la sueur",
    disorder: "Trouble",
    limbTitle: "Évaluation pied et jambe",
    sign: "Signe",
    left: "G.",
    right: "D.",
    obs: "Obs.",
    helomasTitle: "Hélomes / hyperkératose",
    helomasHint: "Indiquez la localisation si applicable.",
    type: "Type",
    digitalTitle: "Altérations digitales",
    alteration: "Altération",
    onychopathiesTitle: "Onychopathies",
    onychopathiesHint:
      "L'impression n'affiche que les findings positifs ; ici le dossier complet est montré.",
    onychopathy: "Onychopathie",
    toesLeft: "Orteils g.",
    toesRight: "Orteils d.",
    siNoHint: "Cochez OUI uniquement si présent. Non coché = NON.",
    yes: "OUI",
    no: "NON",
    dash: "—",
  },
};

export const clinicalSharedByLang: Record<"es" | "en" | "pt" | "fr", ClinicalSharedBundle> = {
  es: {
    clinicalLayout: clinicalLayoutEs,
    podiatry: podiatryEs,
    errorBoundary: {
      title: "Algo ha fallado",
      message: "Ha ocurrido un error inesperado. Recarga la página o intenta de nuevo más tarde.",
      reload: "Recargar página",
    },
    clinicalList: {
      loading: "Cargando…",
      retry: "Reintentar",
      loadFailed: "Error al cargar datos",
      requestTimeout: "La solicitud tardó demasiado. Comprueba la conexión e inténtalo de nuevo.",
      loadPatientsError: "Error al cargar pacientes",
      loadSessionsError: "Error al cargar sesiones",
      loadClinicalDataError: "Error al cargar datos clínicos",
    },
    patientsClinical: {
      familyTitle: "Antecedentes familiares",
      familyHint: "Indique si algún familiar directo padece estas enfermedades.",
      familyOtherHint: "Indique si algún familiar tuvo otra enfermedad que considere relevante.",
      otherConditionPlaceholder: "Enfermedad o condición del familiar",
      notesOptional: "Observaciones (opcional)",
      familyLabels: {
        hypertension: "Hipertensión arterial",
        diabetes: "Diabetes",
        psoriasis: "Psoriasis",
        other: "Otra enfermedad relevante",
      },
      yes: "SI",
      no: "NO",
      alertsTitle: "Alertas clínicas",
      noAlerts: "Sin alertas registradas",
      removeAlert: "Quitar",
      alertTypeAllergy: "Alergia",
      alertTypeDiabetes: "Diabetes",
      alertTypeAnticoagulant: "Anticoagulante",
      alertTypeOther: "Otro",
      severityHigh: "Alta",
      severityMedium: "Media",
      severityLow: "Baja",
      alertDescPlaceholder: "Descripción",
      addAlert: "Añadir",
      labsTitle: "Informes de laboratorio",
      labsHint: "PDF o imagen (máx. 10 MB).",
      labsTitlePlaceholder: "Título del informe",
      labsTitleRequired: "Indica un título antes de subir.",
      uploading: "Subiendo…",
      uploadError: "Error al subir",
      evolutionTitle: "Notas de evolución (NOM-004)",
      printReport: "Imprimir informe",
      noEvolutionNotes: "Sin notas de evolución",
      evolutionPlaceholder: "Nota de evolución clínica...",
      addNote: "Añadir nota",
      saving: "Guardando…",
      searchPlaceholder: "Buscar por nombre, DNI, teléfono o email…",
      searchEmptyHint: "Escribe al menos 2 caracteres para buscar",
      ineligibleSuffix: " (datos incompletos)",
      changePatient: "Cambiar",
      changePatientAria: "Cambiar paciente",
      searching: "Buscando…",
      noResults: "Sin resultados",
      refreshPatient: "Actualizar datos del paciente",
    },
    sessionsClinical: {
      checklistTitle: "Protocolo / checklist",
      signatureTitle: "Firma del paciente",
      signatureHint: "Se guarda en el expediente (tabla de consentimientos, vinculada a esta sesión).",
      signatureLoading: "Cargando firma…",
      signatureAlt: "Firma del paciente",
      signatureSavedAt: "Guardada: {date}",
      signatureRedraw: "Dibuje de nuevo abajo para reemplazar la firma.",
      signatureEmpty: "Aún no hay firma para esta sesión.",
      signatureClear: "Borrar",
      signatureSave: "Guardar firma",
      signatureSaved: "Guardada",
      evolutionReport: "Informe de evolución (PDF / imprimir)",
      evolutionReportLoading: "Generando…",
    },
    clinicalToolsExtras: {
      categories: {
        general: "General",
        dermatologia: "Dermatología / callosidades",
        unas: "Uñas",
        biomecanica: "Biomecánica",
        cirugia: "Cirugía / procedimientos",
      },
      presets: {
        heloma: "Callosidad / heloma",
        onychocryptosis: "Uña encarnada (onicocriptosis)",
        surgery: "Procedimiento quirúrgico",
      },
      scopeClinic: "Consultorio",
      scopePersonal: "Personal",
    },
    calendarGrid: {
      noTime: "Sin hora",
      podiatristsLegend: "Podólogos:",
      sameColorInitials: "Las iniciales indican doctores con el mismo color.",
      agendaOf: "Agenda del {date}",
    },
  },
  en: {
    clinicalLayout: clinicalLayoutEn,
    podiatry: podiatryEn,
    errorBoundary: {
      title: "Something went wrong",
      message: "An unexpected error occurred. Reload the page or try again later.",
      reload: "Reload page",
    },
    clinicalList: {
      loading: "Loading…",
      retry: "Retry",
      loadFailed: "Error loading data",
      requestTimeout: "The request took too long. Check your connection and try again.",
      loadPatientsError: "Error loading patients",
      loadSessionsError: "Error loading sessions",
      loadClinicalDataError: "Error loading clinical data",
    },
    patientsClinical: {
      familyTitle: "Family history",
      familyHint: "Indicate whether any first-degree relative has these conditions.",
      familyOtherHint: "Indicate if any relative had another condition you consider relevant.",
      otherConditionPlaceholder: "Relative's disease or condition",
      notesOptional: "Notes (optional)",
      familyLabels: {
        hypertension: "Arterial hypertension",
        diabetes: "Diabetes",
        psoriasis: "Psoriasis",
        other: "Other relevant disease",
      },
      yes: "YES",
      no: "NO",
      alertsTitle: "Clinical alerts",
      noAlerts: "No alerts recorded",
      removeAlert: "Remove",
      alertTypeAllergy: "Allergy",
      alertTypeDiabetes: "Diabetes",
      alertTypeAnticoagulant: "Anticoagulant",
      alertTypeOther: "Other",
      severityHigh: "High",
      severityMedium: "Medium",
      severityLow: "Low",
      alertDescPlaceholder: "Description",
      addAlert: "Add",
      labsTitle: "Lab reports",
      labsHint: "PDF or image (max. 10 MB).",
      labsTitlePlaceholder: "Report title",
      labsTitleRequired: "Enter a title before uploading.",
      uploading: "Uploading…",
      uploadError: "Upload failed",
      evolutionTitle: "Evolution notes (NOM-004)",
      printReport: "Print report",
      noEvolutionNotes: "No evolution notes",
      evolutionPlaceholder: "Clinical evolution note...",
      addNote: "Add note",
      saving: "Saving…",
      searchPlaceholder: "Search by name, ID, phone or email…",
      searchEmptyHint: "Type at least 2 characters to search",
      ineligibleSuffix: " (incomplete data)",
      changePatient: "Change",
      changePatientAria: "Change patient",
      searching: "Searching…",
      noResults: "No results",
      refreshPatient: "Refresh patient data",
    },
    sessionsClinical: {
      checklistTitle: "Protocol / checklist",
      signatureTitle: "Patient signature",
      signatureHint: "Saved in the record (consent table, linked to this session).",
      signatureLoading: "Loading signature…",
      signatureAlt: "Patient signature",
      signatureSavedAt: "Saved: {date}",
      signatureRedraw: "Draw again below to replace the signature.",
      signatureEmpty: "No signature for this session yet.",
      signatureClear: "Clear",
      signatureSave: "Save signature",
      signatureSaved: "Saved",
      evolutionReport: "Evolution report (PDF / print)",
      evolutionReportLoading: "Generating…",
    },
    clinicalToolsExtras: {
      categories: {
        general: "General",
        dermatologia: "Dermatology / calluses",
        unas: "Nails",
        biomecanica: "Biomechanics",
        cirugia: "Surgery / procedures",
      },
      presets: {
        heloma: "Callus / heloma",
        onychocryptosis: "Ingrown nail (onychocryptosis)",
        surgery: "Surgical procedure",
      },
      scopeClinic: "Clinic",
      scopePersonal: "Personal",
    },
    calendarGrid: {
      noTime: "No time",
      podiatristsLegend: "Podiatrists:",
      sameColorInitials: "Initials indicate doctors with the same color.",
      agendaOf: "Schedule for {date}",
    },
  },
  pt: {
    clinicalLayout: clinicalLayoutPt,
    podiatry: podiatryPt,
    errorBoundary: {
      title: "Algo correu mal",
      message: "Ocorreu um erro inesperado. Recarregue a página ou tente novamente mais tarde.",
      reload: "Recarregar página",
    },
    clinicalList: {
      loading: "A carregar…",
      retry: "Tentar novamente",
      loadFailed: "Erro ao carregar dados",
      requestTimeout: "O pedido demorou demasiado. Verifique a ligação e tente novamente.",
      loadPatientsError: "Erro ao carregar pacientes",
      loadSessionsError: "Erro ao carregar sessões",
      loadClinicalDataError: "Erro ao carregar dados clínicos",
    },
    patientsClinical: {
      familyTitle: "Antecedentes familiares",
      familyHint: "Indique se algum familiar direto sofre destas doenças.",
      familyOtherHint: "Indique se algum familiar teve outra doença que considere relevante.",
      otherConditionPlaceholder: "Doença ou condição do familiar",
      notesOptional: "Observações (opcional)",
      familyLabels: {
        hypertension: "Hipertensão arterial",
        diabetes: "Diabetes",
        psoriasis: "Psoríase",
        other: "Outra doença relevante",
      },
      yes: "SIM",
      no: "NÃO",
      alertsTitle: "Alertas clínicos",
      noAlerts: "Sem alertas registados",
      removeAlert: "Remover",
      alertTypeAllergy: "Alergia",
      alertTypeDiabetes: "Diabetes",
      alertTypeAnticoagulant: "Anticoagulante",
      alertTypeOther: "Outro",
      severityHigh: "Alta",
      severityMedium: "Média",
      severityLow: "Baixa",
      alertDescPlaceholder: "Descrição",
      addAlert: "Adicionar",
      labsTitle: "Relatórios de laboratório",
      labsHint: "PDF ou imagem (máx. 10 MB).",
      labsTitlePlaceholder: "Título do relatório",
      labsTitleRequired: "Indique um título antes de carregar.",
      uploading: "A carregar…",
      uploadError: "Erro ao carregar",
      evolutionTitle: "Notas de evolução (NOM-004)",
      printReport: "Imprimir relatório",
      noEvolutionNotes: "Sem notas de evolução",
      evolutionPlaceholder: "Nota de evolução clínica...",
      addNote: "Adicionar nota",
      saving: "A guardar…",
      searchPlaceholder: "Pesquisar por nome, documento, telefone ou email…",
      searchEmptyHint: "Escreva pelo menos 2 caracteres para pesquisar",
      ineligibleSuffix: " (dados incompletos)",
      changePatient: "Alterar",
      changePatientAria: "Alterar paciente",
      searching: "A pesquisar…",
      noResults: "Sem resultados",
      refreshPatient: "Atualizar dados do paciente",
    },
    sessionsClinical: {
      checklistTitle: "Protocolo / checklist",
      signatureTitle: "Assinatura do paciente",
      signatureHint: "Guarda-se no processo (tabela de consentimentos, ligada a esta sessão).",
      signatureLoading: "A carregar assinatura…",
      signatureAlt: "Assinatura do paciente",
      signatureSavedAt: "Guardada: {date}",
      signatureRedraw: "Desenhe novamente abaixo para substituir a assinatura.",
      signatureEmpty: "Ainda não há assinatura para esta sessão.",
      signatureClear: "Limpar",
      signatureSave: "Guardar assinatura",
      signatureSaved: "Guardada",
      evolutionReport: "Relatório de evolução (PDF / imprimir)",
      evolutionReportLoading: "A gerar…",
    },
    clinicalToolsExtras: {
      categories: {
        general: "Geral",
        dermatologia: "Dermatologia / calosidades",
        unas: "Unhas",
        biomecanica: "Biomecânica",
        cirugia: "Cirurgia / procedimentos",
      },
      presets: {
        heloma: "Calosidade / heloma",
        onychocryptosis: "Unha encravada (onicocriptose)",
        surgery: "Procedimento cirúrgico",
      },
      scopeClinic: "Consultório",
      scopePersonal: "Pessoal",
    },
    calendarGrid: {
      noTime: "Sem hora",
      podiatristsLegend: "Podólogos:",
      sameColorInitials: "As iniciais indicam médicos com a mesma cor.",
      agendaOf: "Agenda de {date}",
    },
  },
  fr: {
    clinicalLayout: clinicalLayoutFr,
    podiatry: podiatryFr,
    errorBoundary: {
      title: "Une erreur s'est produite",
      message: "Une erreur inattendue s'est produite. Rechargez la page ou réessayez plus tard.",
      reload: "Recharger la page",
    },
    clinicalList: {
      loading: "Chargement…",
      retry: "Réessayer",
      loadFailed: "Erreur lors du chargement des données",
      requestTimeout: "La requête a pris trop de temps. Vérifiez la connexion et réessayez.",
      loadPatientsError: "Erreur lors du chargement des patients",
      loadSessionsError: "Erreur lors du chargement des séances",
      loadClinicalDataError: "Erreur lors du chargement des données cliniques",
    },
    patientsClinical: {
      familyTitle: "Antécédents familiaux",
      familyHint: "Indiquez si un parent proche présente ces maladies.",
      familyOtherHint: "Indiquez si un proche a eu une autre maladie que vous jugez pertinente.",
      otherConditionPlaceholder: "Maladie ou condition du proche",
      notesOptional: "Observations (facultatif)",
      familyLabels: {
        hypertension: "Hypertension artérielle",
        diabetes: "Diabète",
        psoriasis: "Psoriasis",
        other: "Autre maladie pertinente",
      },
      yes: "OUI",
      no: "NON",
      alertsTitle: "Alertes cliniques",
      noAlerts: "Aucune alerte enregistrée",
      removeAlert: "Retirer",
      alertTypeAllergy: "Allergie",
      alertTypeDiabetes: "Diabète",
      alertTypeAnticoagulant: "Anticoagulant",
      alertTypeOther: "Autre",
      severityHigh: "Élevée",
      severityMedium: "Moyenne",
      severityLow: "Faible",
      alertDescPlaceholder: "Description",
      addAlert: "Ajouter",
      labsTitle: "Rapports de laboratoire",
      labsHint: "PDF ou image (max. 10 Mo).",
      labsTitlePlaceholder: "Titre du rapport",
      labsTitleRequired: "Indiquez un titre avant de téléverser.",
      uploading: "Téléversement…",
      uploadError: "Échec du téléversement",
      evolutionTitle: "Notes d'évolution (NOM-004)",
      printReport: "Imprimer le rapport",
      noEvolutionNotes: "Aucune note d'évolution",
      evolutionPlaceholder: "Note d'évolution clinique...",
      addNote: "Ajouter une note",
      saving: "Enregistrement…",
      searchPlaceholder: "Rechercher par nom, pièce d'identité, téléphone ou email…",
      searchEmptyHint: "Saisissez au moins 2 caractères pour rechercher",
      ineligibleSuffix: " (données incomplètes)",
      changePatient: "Changer",
      changePatientAria: "Changer de patient",
      searching: "Recherche…",
      noResults: "Aucun résultat",
      refreshPatient: "Actualiser les données du patient",
    },
    sessionsClinical: {
      checklistTitle: "Protocole / checklist",
      signatureTitle: "Signature du patient",
      signatureHint: "Enregistrée dans le dossier (table des consentements, liée à cette séance).",
      signatureLoading: "Chargement de la signature…",
      signatureAlt: "Signature du patient",
      signatureSavedAt: "Enregistrée : {date}",
      signatureRedraw: "Dessinez à nouveau ci-dessous pour remplacer la signature.",
      signatureEmpty: "Pas encore de signature pour cette séance.",
      signatureClear: "Effacer",
      signatureSave: "Enregistrer la signature",
      signatureSaved: "Enregistrée",
      evolutionReport: "Rapport d'évolution (PDF / imprimer)",
      evolutionReportLoading: "Génération…",
    },
    clinicalToolsExtras: {
      categories: {
        general: "Général",
        dermatologia: "Dermatologie / callosités",
        unas: "Ongles",
        biomecanica: "Biomécanique",
        cirugia: "Chirurgie / procédures",
      },
      presets: {
        heloma: "Callosité / hélome",
        onychocryptosis: "Ongle incarné (onychocryptose)",
        surgery: "Procédure chirurgicale",
      },
      scopeClinic: "Cabinet",
      scopePersonal: "Personnel",
    },
    calendarGrid: {
      noTime: "Sans heure",
      podiatristsLegend: "Podologues :",
      sameColorInitials: "Les initiales indiquent des médecins de même couleur.",
      agendaOf: "Agenda du {date}",
    },
  },
};
