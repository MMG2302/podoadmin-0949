/**
 * One-shot patch: extend patients.*, sessions.*, add clinic.* in translations.ts
 * and mark marker comments for verification. Run once then delete.
 */
import fs from "fs";

const path = "src/web/i18n/translations.ts";
let src = fs.readFileSync(path, "utf8");

const patientsIfaceExtra = `
    personalData: string;
    folio: string;
    none: string;
    noConsent: string;
    deleteTitle: string;
    deleteCascadeTitle: string;
    deleteConfirmBody: string;
    deleteCascadeBody: string;
    deleting: string;
    deleteAll: string;
    firstNameRequired: string;
    lastNameRequired: string;
    dateOfBirthRequired: string;
    genderRequired: string;
    idNumberRequired: string;
    phoneRequired: string;
    emailInvalid: string;
    updateFailed: string;
    createFailed: string;
    saveError: string;
    deleteFailed: string;
    deleteError: string;
    gracePeriodMessage: string;
    gracePeriodTitle: string;
    protectedFieldsTitle: string;
    protectedFieldsBody: string;
    fieldLockedTitle: string;
    fieldLockedAfterCreate: string;
    podiatristForPatient: string;
    selectPodiatrist: string;
    patientAssignedHint: string;
    idNumberPlaceholder: string;
    idNumberFieldTitle: string;
    idNumberHint: string;
    curpLockedTitle: string;
    allergiesComma: string;
    medicationsComma: string;
    conditionsComma: string;
    allergiesPlaceholder: string;
    medicationsPlaceholder: string;
    conditionsPlaceholder: string;
    emailPlaceholder: string;
    noConsentTerms: string;
    needsReconsentBadge: string;
    needsReconsentHint: string;
    onlyPodiatristsCanCreate: string;
    addFirstPatient: string;
    noEmail: string;
    loadingPatients: string;
    loadMorePatients: string;
    loadingMore: string;`;

const sessionsIfaceExtra = `
    reasons: {
      routine_checkup: string;
      treatment_continuation: string;
      post_procedure_review: string;
      new_symptoms: string;
      follow_up: string;
      other: string;
    };
    appointmentReason: string;
    followUpInstructions: string;
    followUpInstructionsPlaceholder: string;
    unknownPatient: string;
    podiatryExamTitle: string;
    confirmApplyTemplate: string;
    imageOnlyAllowed: string;
    imageReadError: string;
    imageProcessError: string;
    saveFailed: string;
    selectPatientAlert: string;
    gracePeriodMessage: string;
    gracePeriodTitle: string;
    saveError: string;
    confirmDelete: string;
    deleteFailed: string;
    deleteError: string;
    exportOnlyPodiatrists: string;
    exportFailed: string;
    prescriptionRequireContent: string;
    patientLoadFailed: string;
    noPhotos: string;
    imageAlt: string;
    folioLabel: string;
    medicationsLabel: string;
    noPrescriptions: string;
    patientPrefix: string;
    professionalFallback: string;
    userFallback: string;
    printTitlePrefix: string;
    weightPlaceholder: string;
    heightPlaceholder: string;
    anamnesisPlaceholder: string;
    examPlaceholder: string;
    diagnosisPlaceholder: string;
    treatmentPlaceholder: string;
    notesPlaceholder: string;
    patientData: string;
    idOrCurp: string;
    age: string;
    professionalData: string;
    professional: string;
    professionalLicense: string;
    licensePlaceholder: string;
    prescriptionIndications: string;
    prescriptionIndicationsPlaceholder: string;
    medicationsTreatments: string;
    medicationsTreatmentsPlaceholder: string;
    additionalNotes: string;
    prescriptionMinContent: string;
    loadingPatients: string;
    selectEllipsis: string;
    incompleteData: string;
    incompletePatientWarning: string;
    editPatientLink: string;
    refreshPatientData: string;
    vitalsHint: string;
    sessionTemplate: string;
    noTemplate: string;
    templateClinic: string;
    templatePersonal: string;
    noTemplatesBefore: string;
    noTemplatesAfter: string;
    clinicalToolsLink: string;
    templateApplyHint: string;
    templateFilteredView: string;
    templateNoSections: string;
    selectPatientTitle: string;
    completePatientDataTitle: string;
    completePatientDataHint: string;
    loadMoreSessions: string;
    loadingMore: string;
    reschedule: string;
    rescheduleTitle: string;
    daysOverdue: string;
    scheduleAppointment: string;
    todayRel: string;
    tomorrowRel: string;
    inDays: string;
    exportJson: string;
    yearsOld: string;`;

const clinicIface = `
  clinic: {
    tabOverview: string;
    tabPodiatrists: string;
    tabPatients: string;
    tabReceptionists: string;
    statPodiatrists: string;
    statTotalPatients: string;
    statSessionsThisMonth: string;
    vsPreviousMonth: string;
    agendaTitle: string;
    agendaSubtitle: string;
    allPodiatrists: string;
    attended: string;
    noShow: string;
    noShowRateOfResolved: string;
    cancelled: string;
    cancellationRate: string;
    pending: string;
    demandTitle: string;
    demandHint: string;
    openCheckoutAgenda: string;
    attendedPerDay: string;
    loadingAgendaMetrics: string;
    activityByPodiatrist: string;
    sessionsCount: string;
    podiatristsLimit: string;
    podiatristsNoLimit: string;
    createPodiatrist: string;
    colPodiatrist: string;
    colEmail: string;
    colLicense: string;
    colPatients: string;
    colSessionsMonth: string;
    licenseNotRegistered: string;
    noPodiatrists: string;
    totalIndexed: string;
    searchPatientPlaceholder: string;
    activityAll: string;
    visitsRangeChip: string;
    loadingPatients: string;
    colPhone: string;
    colVisits: string;
    colAssignedPodiatrist: string;
    colLastSession: string;
    colActions: string;
    reassign: string;
    noPatientsFound: string;
    receptionistsHint: string;
    receptionistsActive: string;
    createReceptionist: string;
    colName: string;
    colAssignedPodiatrists: string;
    unassigned: string;
    podiatristsAction: string;
    unblock: string;
    block: string;
    enable: string;
    disable: string;
    noReceptionists: string;
    reassignTitle: string;
    reassignUseCase: string;
    currentPodiatrist: string;
    newPodiatrist: string;
    selectPodiatrist: string;
    unknownPodiatrist: string;
    createPodiatristSubtitle: string;
    initialPasswordMin8: string;
    createReceptionistSubtitle: string;
    initialPassword: string;
    assignedPodiatristsTitle: string;
    noPodiatristsInClinic: string;
    confirmDeleteReceptionist: string;
    maxActiveReceptionists: string;
    emailTaken: string;
    createReceptionistError: string;
    saveAssignmentError: string;
    createPodiatristError: string;
    passwordMin8: string;
  };
`;

function insertBefore(haystack, needle, insert) {
  const i = haystack.indexOf(needle);
  if (i < 0) throw new Error("needle not found: " + needle.slice(0, 80));
  return haystack.slice(0, i) + insert + haystack.slice(i);
}

// --- Interface ---
if (!src.includes("personalData: string;")) {
  src = insertBefore(
    src,
    "    engagement: {\n      segmentNew: string;",
    patientsIfaceExtra + "\n"
  );
}

if (!src.includes("reasons: {\n      routine_checkup: string;")) {
  src = insertBefore(
    src,
    "    followUp: {\n      overdueBanner: string;",
    sessionsIfaceExtra + "\n"
  );
}

if (!src.includes("\n  clinic: {")) {
  src = insertBefore(
    src,
    "\n  // Calendar\n  calendar: {",
    clinicIface
  );
}

const patientsEs = `
      personalData: "Datos personales",
      folio: "FOLIO:",
      none: "Ninguna",
      noConsent: "Sin consentimiento",
      deleteTitle: "¿Eliminar paciente?",
      deleteCascadeTitle: "Eliminar paciente y todo su historial",
      deleteConfirmBody: "Se eliminará el paciente {name} y no se podrá recuperar. Esta acción es permanente.",
      deleteCascadeBody: "Este paciente tiene sesiones clínicas y/o citas asociadas. Si continúa, se eliminará el paciente, todas sus sesiones y citas. Esta acción no se puede deshacer.",
      deleting: "Eliminando…",
      deleteAll: "Eliminar todo",
      firstNameRequired: "Nombre es requerido",
      lastNameRequired: "Apellidos son requeridos",
      dateOfBirthRequired: "Fecha de nacimiento es requerida",
      genderRequired: "Género es requerido",
      idNumberRequired: "DNI/NIE es requerido",
      phoneRequired: "Teléfono es requerido",
      emailInvalid: "Email inválido",
      updateFailed: "No se pudo actualizar el paciente.",
      createFailed: "No se pudo crear el paciente.",
      saveError: "Ha ocurrido un error al guardar el paciente.",
      deleteFailed: "No se pudo eliminar el paciente.",
      deleteError: "Ha ocurrido un error al eliminar el paciente.",
      gracePeriodMessage: "Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevos pacientes.",
      gracePeriodTitle: "No puedes crear nuevos pacientes en este momento",
      protectedFieldsTitle: "Campos protegidos",
      protectedFieldsBody: "Los campos con 🔒 no pueden ser modificados después de la creación para garantizar la integridad de los datos.",
      fieldLockedTitle: "Este campo no puede ser modificado",
      fieldLockedAfterCreate: "Este campo no puede ser modificado después de la creación del paciente",
      podiatristForPatient: "Podólogo para el paciente *",
      selectPodiatrist: "Seleccionar podólogo",
      patientAssignedHint: "El paciente quedará asignado a este podólogo.",
      idNumberPlaceholder: "Para menores, DNI del padre o tutor",
      idNumberFieldTitle: "Obligatorio. Para menores de edad, indicar el DNI del padre o tutor legal.",
      idNumberHint: "Obligatorio para crear sesiones. Si el paciente es menor de edad, indicar el DNI del padre o tutor.",
      curpLockedTitle: "La CURP no puede modificarse una vez registrada",
      allergiesComma: "Alergias (separadas por coma)",
      medicationsComma: "Medicamentos (separados por coma)",
      conditionsComma: "Condiciones (separadas por coma)",
      allergiesPlaceholder: "Penicilina, Látex...",
      medicationsPlaceholder: "Ibuprofeno, Omeprazol...",
      conditionsPlaceholder: "Diabetes, Hipertensión...",
      emailPlaceholder: "paciente@ejemplo.com",
      noConsentTerms: "No hay términos configurados. Configúralos en Configuración para que el paciente pueda aceptarlos.",
      needsReconsentBadge: "(modificado – acepte de nuevo)",
      needsReconsentHint: "El consentimiento informado fue modificado. Es necesario que el paciente (o tutor) vuelva a aceptarlo. Marque la casilla para registrar la nueva aceptación.",
      onlyPodiatristsCanCreate: "Solo los podólogos pueden crear pacientes",
      addFirstPatient: "Añade tu primer paciente para comenzar",
      noEmail: "Sin email",
      loadingPatients: "Cargando pacientes…",
      loadMorePatients: "Cargar más pacientes",
      loadingMore: "Cargando…",
`;

const patientsEn = `
      personalData: "Personal data",
      folio: "FOLIO:",
      none: "None",
      noConsent: "No consent",
      deleteTitle: "Delete patient?",
      deleteCascadeTitle: "Delete patient and all history",
      deleteConfirmBody: "Patient {name} will be deleted and cannot be recovered. This action is permanent.",
      deleteCascadeBody: "This patient has clinical sessions and/or appointments. If you continue, the patient and all related sessions and appointments will be deleted. This cannot be undone.",
      deleting: "Deleting…",
      deleteAll: "Delete all",
      firstNameRequired: "First name is required",
      lastNameRequired: "Last name is required",
      dateOfBirthRequired: "Date of birth is required",
      genderRequired: "Gender is required",
      idNumberRequired: "ID number is required",
      phoneRequired: "Phone is required",
      emailInvalid: "Invalid email",
      updateFailed: "Could not update the patient.",
      createFailed: "Could not create the patient.",
      saveError: "An error occurred while saving the patient.",
      deleteFailed: "Could not delete the patient.",
      deleteError: "An error occurred while deleting the patient.",
      gracePeriodMessage: "Your account is in a grace period due to overpayment. For 30 days you can view your data, but you cannot create new patients.",
      gracePeriodTitle: "You cannot create new patients right now",
      protectedFieldsTitle: "Protected fields",
      protectedFieldsBody: "Fields marked with 🔒 cannot be changed after creation to ensure data integrity.",
      fieldLockedTitle: "This field cannot be modified",
      fieldLockedAfterCreate: "This field cannot be modified after the patient is created",
      podiatristForPatient: "Podiatrist for the patient *",
      selectPodiatrist: "Select podiatrist",
      patientAssignedHint: "The patient will be assigned to this podiatrist.",
      idNumberPlaceholder: "For minors, parent or guardian ID",
      idNumberFieldTitle: "Required. For minors, enter the parent or legal guardian ID.",
      idNumberHint: "Required to create sessions. If the patient is a minor, enter the parent or guardian ID.",
      curpLockedTitle: "CURP cannot be changed once registered",
      allergiesComma: "Allergies (comma-separated)",
      medicationsComma: "Medications (comma-separated)",
      conditionsComma: "Conditions (comma-separated)",
      allergiesPlaceholder: "Penicillin, Latex...",
      medicationsPlaceholder: "Ibuprofen, Omeprazole...",
      conditionsPlaceholder: "Diabetes, Hypertension...",
      emailPlaceholder: "patient@example.com",
      noConsentTerms: "No terms configured. Set them up in Settings so the patient can accept them.",
      needsReconsentBadge: "(modified – accept again)",
      needsReconsentHint: "The informed consent was modified. The patient (or guardian) must accept it again. Check the box to record the new acceptance.",
      onlyPodiatristsCanCreate: "Only podiatrists can create patients",
      addFirstPatient: "Add your first patient to get started",
      noEmail: "No email",
      loadingPatients: "Loading patients…",
      loadMorePatients: "Load more patients",
      loadingMore: "Loading…",
`;

const patientsPt = `
      personalData: "Dados pessoais",
      folio: "FOLIO:",
      none: "Nenhuma",
      noConsent: "Sem consentimento",
      deleteTitle: "Eliminar paciente?",
      deleteCascadeTitle: "Eliminar paciente e todo o histórico",
      deleteConfirmBody: "O paciente {name} será eliminado e não poderá ser recuperado. Esta ação é permanente.",
      deleteCascadeBody: "Este paciente tem sessões clínicas e/ou consultas associadas. Se continuar, o paciente e todas as sessões e consultas serão eliminados. Esta ação não pode ser desfeita.",
      deleting: "A eliminar…",
      deleteAll: "Eliminar tudo",
      firstNameRequired: "O nome é obrigatório",
      lastNameRequired: "Os apelidos são obrigatórios",
      dateOfBirthRequired: "A data de nascimento é obrigatória",
      genderRequired: "O género é obrigatório",
      idNumberRequired: "O documento de identidade é obrigatório",
      phoneRequired: "O telefone é obrigatório",
      emailInvalid: "Email inválido",
      updateFailed: "Não foi possível atualizar o paciente.",
      createFailed: "Não foi possível criar o paciente.",
      saveError: "Ocorreu um erro ao guardar o paciente.",
      deleteFailed: "Não foi possível eliminar o paciente.",
      deleteError: "Ocorreu um erro ao eliminar o paciente.",
      gracePeriodMessage: "A sua conta está em período de graça por excesso de pagamento. Durante 30 dias pode ver os seus dados, mas não criar novos pacientes.",
      gracePeriodTitle: "Não pode criar novos pacientes neste momento",
      protectedFieldsTitle: "Campos protegidos",
      protectedFieldsBody: "Os campos com 🔒 não podem ser modificados após a criação para garantir a integridade dos dados.",
      fieldLockedTitle: "Este campo não pode ser modificado",
      fieldLockedAfterCreate: "Este campo não pode ser modificado após a criação do paciente",
      podiatristForPatient: "Podólogo para o paciente *",
      selectPodiatrist: "Selecionar podólogo",
      patientAssignedHint: "O paciente ficará atribuído a este podólogo.",
      idNumberPlaceholder: "Para menores, documento do pai ou tutor",
      idNumberFieldTitle: "Obrigatório. Para menores, indique o documento do pai ou tutor legal.",
      idNumberHint: "Obrigatório para criar sessões. Se o paciente for menor, indique o documento do pai ou tutor.",
      curpLockedTitle: "O CURP não pode ser alterado depois de registado",
      allergiesComma: "Alergias (separadas por vírgula)",
      medicationsComma: "Medicamentos (separados por vírgula)",
      conditionsComma: "Condições (separadas por vírgula)",
      allergiesPlaceholder: "Penicilina, Látex...",
      medicationsPlaceholder: "Ibuprofeno, Omeprazol...",
      conditionsPlaceholder: "Diabetes, Hipertensão...",
      emailPlaceholder: "paciente@exemplo.com",
      noConsentTerms: "Não há termos configurados. Configure-os em Definições para que o paciente os possa aceitar.",
      needsReconsentBadge: "(modificado – aceite novamente)",
      needsReconsentHint: "O consentimento informado foi modificado. É necessário que o paciente (ou tutor) volte a aceitá-lo. Marque a caixa para registar a nova aceitação.",
      onlyPodiatristsCanCreate: "Só os podólogos podem criar pacientes",
      addFirstPatient: "Adicione o seu primeiro paciente para começar",
      noEmail: "Sem email",
      loadingPatients: "A carregar pacientes…",
      loadMorePatients: "Carregar mais pacientes",
      loadingMore: "A carregar…",
`;

const patientsFr = `
      personalData: "Données personnelles",
      folio: "FOLIO :",
      none: "Aucune",
      noConsent: "Sans consentement",
      deleteTitle: "Supprimer le patient ?",
      deleteCascadeTitle: "Supprimer le patient et tout son historique",
      deleteConfirmBody: "Le patient {name} sera supprimé et ne pourra pas être récupéré. Cette action est permanente.",
      deleteCascadeBody: "Ce patient a des séances cliniques et/ou des rendez-vous associés. Si vous continuez, le patient ainsi que toutes ses séances et rendez-vous seront supprimés. Cette action est irréversible.",
      deleting: "Suppression…",
      deleteAll: "Tout supprimer",
      firstNameRequired: "Le prénom est obligatoire",
      lastNameRequired: "Le nom est obligatoire",
      dateOfBirthRequired: "La date de naissance est obligatoire",
      genderRequired: "Le genre est obligatoire",
      idNumberRequired: "Le numéro d'identité est obligatoire",
      phoneRequired: "Le téléphone est obligatoire",
      emailInvalid: "E-mail invalide",
      updateFailed: "Impossible de mettre à jour le patient.",
      createFailed: "Impossible de créer le patient.",
      saveError: "Une erreur s'est produite lors de l'enregistrement du patient.",
      deleteFailed: "Impossible de supprimer le patient.",
      deleteError: "Une erreur s'est produite lors de la suppression du patient.",
      gracePeriodMessage: "Votre compte est en période de grâce pour trop-perçu. Pendant 30 jours vous pouvez consulter vos données, mais pas créer de nouveaux patients.",
      gracePeriodTitle: "Vous ne pouvez pas créer de nouveaux patients pour le moment",
      protectedFieldsTitle: "Champs protégés",
      protectedFieldsBody: "Les champs marqués 🔒 ne peuvent pas être modifiés après la création afin de garantir l'intégrité des données.",
      fieldLockedTitle: "Ce champ ne peut pas être modifié",
      fieldLockedAfterCreate: "Ce champ ne peut pas être modifié après la création du patient",
      podiatristForPatient: "Podologue pour le patient *",
      selectPodiatrist: "Sélectionner un podologue",
      patientAssignedHint: "Le patient sera assigné à ce podologue.",
      idNumberPlaceholder: "Pour les mineurs, pièce d'identité du parent ou tuteur",
      idNumberFieldTitle: "Obligatoire. Pour les mineurs, indiquer la pièce d'identité du parent ou tuteur légal.",
      idNumberHint: "Obligatoire pour créer des séances. Si le patient est mineur, indiquer la pièce d'identité du parent ou tuteur.",
      curpLockedTitle: "Le CURP ne peut plus être modifié une fois enregistré",
      allergiesComma: "Allergies (séparées par des virgules)",
      medicationsComma: "Médicaments (séparés par des virgules)",
      conditionsComma: "Pathologies (séparées par des virgules)",
      allergiesPlaceholder: "Pénicilline, Latex...",
      medicationsPlaceholder: "Ibuprofène, Oméprazole...",
      conditionsPlaceholder: "Diabète, Hypertension...",
      emailPlaceholder: "patient@exemple.com",
      noConsentTerms: "Aucun terme configuré. Configurez-les dans Paramètres pour que le patient puisse les accepter.",
      needsReconsentBadge: "(modifié – accepter à nouveau)",
      needsReconsentHint: "Le consentement éclairé a été modifié. Le patient (ou tuteur) doit l'accepter à nouveau. Cochez la case pour enregistrer la nouvelle acceptation.",
      onlyPodiatristsCanCreate: "Seuls les podologues peuvent créer des patients",
      addFirstPatient: "Ajoutez votre premier patient pour commencer",
      noEmail: "Sans e-mail",
      loadingPatients: "Chargement des patients…",
      loadMorePatients: "Charger plus de patients",
      loadingMore: "Chargement…",
`;

const sessionsEs = `
      reasons: {
        routine_checkup: "Revisión rutinaria",
        treatment_continuation: "Continuación de tratamiento",
        post_procedure_review: "Revisión post-procedimiento",
        new_symptoms: "Nuevos síntomas",
        follow_up: "Seguimiento",
        other: "Otro",
      },
      appointmentReason: "Motivo de la cita",
      followUpInstructions: "Instrucciones de seguimiento",
      followUpInstructionsPlaceholder: "Instrucciones para el paciente, medicación, cuidados...",
      unknownPatient: "Paciente desconocido",
      podiatryExamTitle: "Exploración podológica",
      confirmApplyTemplate: "¿Aplicar esta plantilla? Se reemplazarán los campos clínicos actuales (texto, exploración podológica y secciones personalizadas).",
      imageOnlyAllowed: "Solo se permiten imágenes (JPEG, PNG, WebP).",
      imageReadError: "No se pudo leer la imagen",
      imageProcessError: "Error al procesar la imagen.",
      saveFailed: "No se pudo guardar la sesión.",
      selectPatientAlert: "Seleccione un paciente.",
      gracePeriodMessage: "Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevas sesiones clínicas.",
      gracePeriodTitle: "No puedes crear nuevas sesiones en este momento",
      saveError: "Ha ocurrido un error al guardar la sesión.",
      confirmDelete: "¿Eliminar esta sesión?",
      deleteFailed: "No se pudo eliminar la sesión.",
      deleteError: "Ha ocurrido un error al eliminar la sesión.",
      exportOnlyPodiatrists: "Solo los podólogos pueden exportar historias clínicas.",
      exportFailed: "No se pudo exportar la historia clínica",
      prescriptionRequireContent: "Escribe las indicaciones en «Prescripción / Indicaciones» o en «Medicamentos / Tratamientos».",
      patientLoadFailed: "No se pudieron cargar los datos del paciente. Cierra el formulario, abre la sesión de nuevo e inténtalo otra vez.",
      noPhotos: "No hay fotos en esta sesión. Súbelas al crear o editar el borrador.",
      imageAlt: "Imagen {n}",
      folioLabel: "Folio:",
      medicationsLabel: "Medicamentos:",
      noPrescriptions: "No hay recetas para esta sesión",
      patientPrefix: "Paciente:",
      professionalFallback: "Profesional",
      userFallback: "Usuario",
      printTitlePrefix: "Podólogo",
      weightPlaceholder: "Ej. 72.5",
      heightPlaceholder: "Ej. 165",
      anamnesisPlaceholder: "Motivo de consulta, antecedentes...",
      examPlaceholder: "Hallazgos de la exploración...",
      diagnosisPlaceholder: "Diagnóstico podológico...",
      treatmentPlaceholder: "Plan de tratamiento...",
      notesPlaceholder: "Notas adicionales...",
      patientData: "Datos del paciente",
      idOrCurp: "DNI / CURP",
      age: "Edad",
      professionalData: "Datos del profesional",
      professional: "Profesional",
      professionalLicense: "Cédula profesional",
      licensePlaceholder: "Número de cédula",
      prescriptionIndications: "Prescripción / Indicaciones *",
      prescriptionIndicationsPlaceholder: "Describa las indicaciones y recomendaciones para el paciente...",
      medicationsTreatments: "Medicamentos / Tratamientos",
      medicationsTreatmentsPlaceholder: "Liste los medicamentos o tratamientos recomendados...",
      additionalNotes: "Notas Adicionales",
      prescriptionMinContent: "Completa al menos «Prescripción / Indicaciones» o «Medicamentos / Tratamientos».",
      loadingPatients: "Cargando pacientes…",
      selectEllipsis: "Seleccionar...",
      incompleteData: " (datos incompletos)",
      incompletePatientWarning: "Faltan datos obligatorios del paciente (nombre, apellido, fecha nacimiento, género, DNI). Para menores use el DNI del padre/tutor. Edite la ficha del paciente para poder guardar la sesión.",
      editPatientLink: "Editar paciente →",
      refreshPatientData: "Actualizar datos (si ya editó el paciente)",
      vitalsHint: "Se guarda en esta sesión y actualiza el expediente del paciente.",
      sessionTemplate: "Plantilla de sesión",
      noTemplate: "Sin plantilla",
      templateClinic: " (consultorio)",
      templatePersonal: " (personal)",
      noTemplatesBefore: "No hay plantillas. Créalas en",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Herramientas clínicas",
      templateApplyHint: "Al elegir una plantilla se aplican automáticamente el contenido y las secciones visibles (p. ej. sin helomas en procedimientos quirúrgicos).",
      templateFilteredView: "Vista filtrada por plantilla: {n} secciones visibles. Elige «Sin plantilla» para ver el formulario completo.",
      templateNoSections: "Esta plantilla no tiene secciones definidas. Edítala en Herramientas clínicas, marca qué incluir y guarda de nuevo.",
      selectPatientTitle: "Seleccione un paciente",
      completePatientDataTitle: "Complete los datos obligatorios del paciente (nombre, apellido, fecha nacimiento, género, DNI)",
      completePatientDataHint: "Para guardar borrador o completar la sesión, primero complete los datos del paciente y haga clic en \\"Actualizar datos\\" arriba.",
      loadMoreSessions: "Cargar más sesiones",
      loadingMore: "Cargando…",
      reschedule: "Reprogramar",
      rescheduleTitle: "Reprogramar próxima cita",
      daysOverdue: "{n} días atrasado",
      scheduleAppointment: "Programar cita →",
      todayRel: "Hoy",
      tomorrowRel: "Mañana",
      inDays: "En {n} días",
      exportJson: "Exportar JSON",
      yearsOld: "{n} años",
`;

const sessionsEn = `
      reasons: {
        routine_checkup: "Routine checkup",
        treatment_continuation: "Treatment continuation",
        post_procedure_review: "Post-procedure review",
        new_symptoms: "New symptoms",
        follow_up: "Follow-up",
        other: "Other",
      },
      appointmentReason: "Appointment reason",
      followUpInstructions: "Follow-up instructions",
      followUpInstructionsPlaceholder: "Instructions for the patient, medication, care...",
      unknownPatient: "Unknown patient",
      podiatryExamTitle: "Podiatric examination",
      confirmApplyTemplate: "Apply this template? Current clinical fields (text, podiatric exam and custom sections) will be replaced.",
      imageOnlyAllowed: "Only images are allowed (JPEG, PNG, WebP).",
      imageReadError: "Could not read the image",
      imageProcessError: "Error processing the image.",
      saveFailed: "Could not save the session.",
      selectPatientAlert: "Please select a patient.",
      gracePeriodMessage: "Your account is in a grace period due to overpayment. For 30 days you can view your data, but you cannot create new clinical sessions.",
      gracePeriodTitle: "You cannot create new sessions right now",
      saveError: "An error occurred while saving the session.",
      confirmDelete: "Delete this session?",
      deleteFailed: "Could not delete the session.",
      deleteError: "An error occurred while deleting the session.",
      exportOnlyPodiatrists: "Only podiatrists can export clinical histories.",
      exportFailed: "Could not export the clinical history",
      prescriptionRequireContent: "Enter indications in «Prescription / Instructions» or «Medications / Treatments».",
      patientLoadFailed: "Could not load patient data. Close the form, open the session again and try once more.",
      noPhotos: "No photos in this session. Upload them when creating or editing the draft.",
      imageAlt: "Image {n}",
      folioLabel: "Folio:",
      medicationsLabel: "Medications:",
      noPrescriptions: "No prescriptions for this session",
      patientPrefix: "Patient:",
      professionalFallback: "Professional",
      userFallback: "User",
      printTitlePrefix: "Podiatrist",
      weightPlaceholder: "e.g. 72.5",
      heightPlaceholder: "e.g. 165",
      anamnesisPlaceholder: "Chief complaint, history...",
      examPlaceholder: "Examination findings...",
      diagnosisPlaceholder: "Podiatric diagnosis...",
      treatmentPlaceholder: "Treatment plan...",
      notesPlaceholder: "Additional notes...",
      patientData: "Patient data",
      idOrCurp: "ID / CURP",
      age: "Age",
      professionalData: "Professional data",
      professional: "Professional",
      professionalLicense: "Professional license",
      licensePlaceholder: "License number",
      prescriptionIndications: "Prescription / Instructions *",
      prescriptionIndicationsPlaceholder: "Describe indications and recommendations for the patient...",
      medicationsTreatments: "Medications / Treatments",
      medicationsTreatmentsPlaceholder: "List recommended medications or treatments...",
      additionalNotes: "Additional notes",
      prescriptionMinContent: "Fill in at least «Prescription / Instructions» or «Medications / Treatments».",
      loadingPatients: "Loading patients…",
      selectEllipsis: "Select...",
      incompleteData: " (incomplete data)",
      incompletePatientWarning: "Required patient fields are missing (first name, last name, date of birth, gender, ID). For minors use the parent/guardian ID. Edit the patient record to save the session.",
      editPatientLink: "Edit patient →",
      refreshPatientData: "Refresh data (if you already edited the patient)",
      vitalsHint: "Saved with this session and updates the patient record.",
      sessionTemplate: "Session template",
      noTemplate: "No template",
      templateClinic: " (clinic)",
      templatePersonal: " (personal)",
      noTemplatesBefore: "No templates. Create them in",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Clinical tools",
      templateApplyHint: "Choosing a template automatically applies content and visible sections (e.g. no helomas in surgical procedures).",
      templateFilteredView: "Template-filtered view: {n} visible sections. Choose «No template» to see the full form.",
      templateNoSections: "This template has no sections defined. Edit it in Clinical tools, mark what to include and save again.",
      selectPatientTitle: "Select a patient",
      completePatientDataTitle: "Complete required patient fields (first name, last name, date of birth, gender, ID)",
      completePatientDataHint: "To save a draft or complete the session, first complete the patient data and click \\"Refresh data\\" above.",
      loadMoreSessions: "Load more sessions",
      loadingMore: "Loading…",
      reschedule: "Reschedule",
      rescheduleTitle: "Reschedule next appointment",
      daysOverdue: "{n} days overdue",
      scheduleAppointment: "Schedule appointment →",
      todayRel: "Today",
      tomorrowRel: "Tomorrow",
      inDays: "In {n} days",
      exportJson: "Export JSON",
      yearsOld: "{n} years",
`;

const sessionsPt = `
      reasons: {
        routine_checkup: "Revisão de rotina",
        treatment_continuation: "Continuação do tratamento",
        post_procedure_review: "Revisão pós-procedimento",
        new_symptoms: "Novos sintomas",
        follow_up: "Acompanhamento",
        other: "Outro",
      },
      appointmentReason: "Motivo da consulta",
      followUpInstructions: "Instruções de acompanhamento",
      followUpInstructionsPlaceholder: "Instruções para o paciente, medicação, cuidados...",
      unknownPatient: "Paciente desconhecido",
      podiatryExamTitle: "Exploração podológica",
      confirmApplyTemplate: "Aplicar este modelo? Os campos clínicos atuais (texto, exploração podológica e secções personalizadas) serão substituídos.",
      imageOnlyAllowed: "Só são permitidas imagens (JPEG, PNG, WebP).",
      imageReadError: "Não foi possível ler a imagem",
      imageProcessError: "Erro ao processar a imagem.",
      saveFailed: "Não foi possível guardar a sessão.",
      selectPatientAlert: "Selecione um paciente.",
      gracePeriodMessage: "A sua conta está em período de graça por excesso de pagamento. Durante 30 dias pode ver os seus dados, mas não criar novas sessões clínicas.",
      gracePeriodTitle: "Não pode criar novas sessões neste momento",
      saveError: "Ocorreu um erro ao guardar a sessão.",
      confirmDelete: "Eliminar esta sessão?",
      deleteFailed: "Não foi possível eliminar a sessão.",
      deleteError: "Ocorreu um erro ao eliminar a sessão.",
      exportOnlyPodiatrists: "Só os podólogos podem exportar histórias clínicas.",
      exportFailed: "Não foi possível exportar a história clínica",
      prescriptionRequireContent: "Escreva as indicações em «Prescrição / Indicações» ou em «Medicamentos / Tratamentos».",
      patientLoadFailed: "Não foi possível carregar os dados do paciente. Feche o formulário, abra a sessão novamente e tente outra vez.",
      noPhotos: "Não há fotos nesta sessão. Carregue-as ao criar ou editar o rascunho.",
      imageAlt: "Imagem {n}",
      folioLabel: "Folio:",
      medicationsLabel: "Medicamentos:",
      noPrescriptions: "Não há receitas para esta sessão",
      patientPrefix: "Paciente:",
      professionalFallback: "Profissional",
      userFallback: "Utilizador",
      printTitlePrefix: "Podólogo",
      weightPlaceholder: "Ex. 72.5",
      heightPlaceholder: "Ex. 165",
      anamnesisPlaceholder: "Motivo da consulta, antecedentes...",
      examPlaceholder: "Achados da exploração...",
      diagnosisPlaceholder: "Diagnóstico podológico...",
      treatmentPlaceholder: "Plano de tratamento...",
      notesPlaceholder: "Notas adicionais...",
      patientData: "Dados do paciente",
      idOrCurp: "Documento / CURP",
      age: "Idade",
      professionalData: "Dados do profissional",
      professional: "Profissional",
      professionalLicense: "Cédula profissional",
      licensePlaceholder: "Número da cédula",
      prescriptionIndications: "Prescrição / Indicações *",
      prescriptionIndicationsPlaceholder: "Descreva as indicações e recomendações para o paciente...",
      medicationsTreatments: "Medicamentos / Tratamentos",
      medicationsTreatmentsPlaceholder: "Liste os medicamentos ou tratamentos recomendados...",
      additionalNotes: "Notas adicionais",
      prescriptionMinContent: "Preencha pelo menos «Prescrição / Indicações» ou «Medicamentos / Tratamentos».",
      loadingPatients: "A carregar pacientes…",
      selectEllipsis: "Selecionar...",
      incompleteData: " (dados incompletos)",
      incompletePatientWarning: "Faltam dados obrigatórios do paciente (nome, apelido, data de nascimento, género, documento). Para menores use o documento do pai/tutor. Edite a ficha do paciente para poder guardar a sessão.",
      editPatientLink: "Editar paciente →",
      refreshPatientData: "Atualizar dados (se já editou o paciente)",
      vitalsHint: "Guarda-se nesta sessão e atualiza o expediente do paciente.",
      sessionTemplate: "Modelo de sessão",
      noTemplate: "Sem modelo",
      templateClinic: " (consultório)",
      templatePersonal: " (pessoal)",
      noTemplatesBefore: "Não há modelos. Crie-os em",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Ferramentas clínicas",
      templateApplyHint: "Ao escolher um modelo aplicam-se automaticamente o conteúdo e as secções visíveis (p. ex. sem helomas em procedimentos cirúrgicos).",
      templateFilteredView: "Vista filtrada pelo modelo: {n} secções visíveis. Escolha «Sem modelo» para ver o formulário completo.",
      templateNoSections: "Este modelo não tem secções definidas. Edite-o em Ferramentas clínicas, marque o que incluir e guarde novamente.",
      selectPatientTitle: "Selecione um paciente",
      completePatientDataTitle: "Complete os dados obrigatórios do paciente (nome, apelido, data de nascimento, género, documento)",
      completePatientDataHint: "Para guardar rascunho ou concluir a sessão, primeiro complete os dados do paciente e clique em \\"Atualizar dados\\" acima.",
      loadMoreSessions: "Carregar mais sessões",
      loadingMore: "A carregar…",
      reschedule: "Reagendar",
      rescheduleTitle: "Reagendar próxima consulta",
      daysOverdue: "{n} dias de atraso",
      scheduleAppointment: "Agendar consulta →",
      todayRel: "Hoje",
      tomorrowRel: "Amanhã",
      inDays: "Em {n} dias",
      exportJson: "Exportar JSON",
      yearsOld: "{n} anos",
`;

const sessionsFr = `
      reasons: {
        routine_checkup: "Contrôle de routine",
        treatment_continuation: "Suite de traitement",
        post_procedure_review: "Contrôle post-procédure",
        new_symptoms: "Nouveaux symptômes",
        follow_up: "Suivi",
        other: "Autre",
      },
      appointmentReason: "Motif du rendez-vous",
      followUpInstructions: "Instructions de suivi",
      followUpInstructionsPlaceholder: "Instructions pour le patient, médication, soins...",
      unknownPatient: "Patient inconnu",
      podiatryExamTitle: "Examen podologique",
      confirmApplyTemplate: "Appliquer ce modèle ? Les champs cliniques actuels (texte, examen podologique et sections personnalisées) seront remplacés.",
      imageOnlyAllowed: "Seules les images sont autorisées (JPEG, PNG, WebP).",
      imageReadError: "Impossible de lire l'image",
      imageProcessError: "Erreur lors du traitement de l'image.",
      saveFailed: "Impossible d'enregistrer la séance.",
      selectPatientAlert: "Veuillez sélectionner un patient.",
      gracePeriodMessage: "Votre compte est en période de grâce pour trop-perçu. Pendant 30 jours vous pouvez consulter vos données, mais pas créer de nouvelles séances cliniques.",
      gracePeriodTitle: "Vous ne pouvez pas créer de nouvelles séances pour le moment",
      saveError: "Une erreur s'est produite lors de l'enregistrement de la séance.",
      confirmDelete: "Supprimer cette séance ?",
      deleteFailed: "Impossible de supprimer la séance.",
      deleteError: "Une erreur s'est produite lors de la suppression de la séance.",
      exportOnlyPodiatrists: "Seuls les podologues peuvent exporter les dossiers cliniques.",
      exportFailed: "Impossible d'exporter le dossier clinique",
      prescriptionRequireContent: "Saisissez les indications dans « Prescription / Indications » ou « Médicaments / Traitements ».",
      patientLoadFailed: "Impossible de charger les données du patient. Fermez le formulaire, rouvrez la séance et réessayez.",
      noPhotos: "Aucune photo dans cette séance. Ajoutez-les lors de la création ou de la modification du brouillon.",
      imageAlt: "Image {n}",
      folioLabel: "Folio :",
      medicationsLabel: "Médicaments :",
      noPrescriptions: "Aucune ordonnance pour cette séance",
      patientPrefix: "Patient :",
      professionalFallback: "Professionnel",
      userFallback: "Utilisateur",
      printTitlePrefix: "Podologue",
      weightPlaceholder: "ex. 72,5",
      heightPlaceholder: "ex. 165",
      anamnesisPlaceholder: "Motif de consultation, antécédents...",
      examPlaceholder: "Résultats de l'examen...",
      diagnosisPlaceholder: "Diagnostic podologique...",
      treatmentPlaceholder: "Plan de traitement...",
      notesPlaceholder: "Notes supplémentaires...",
      patientData: "Données du patient",
      idOrCurp: "ID / CURP",
      age: "Âge",
      professionalData: "Données du professionnel",
      professional: "Professionnel",
      professionalLicense: "Numéro d'ordre / licence",
      licensePlaceholder: "Numéro de licence",
      prescriptionIndications: "Prescription / Indications *",
      prescriptionIndicationsPlaceholder: "Décrivez les indications et recommandations pour le patient...",
      medicationsTreatments: "Médicaments / Traitements",
      medicationsTreatmentsPlaceholder: "Listez les médicaments ou traitements recommandés...",
      additionalNotes: "Notes supplémentaires",
      prescriptionMinContent: "Remplissez au moins « Prescription / Indications » ou « Médicaments / Traitements ».",
      loadingPatients: "Chargement des patients…",
      selectEllipsis: "Sélectionner...",
      incompleteData: " (données incomplètes)",
      incompletePatientWarning: "Des champs obligatoires du patient manquent (prénom, nom, date de naissance, genre, pièce d'identité). Pour les mineurs, utilisez la pièce du parent/tuteur. Modifiez la fiche patient pour pouvoir enregistrer la séance.",
      editPatientLink: "Modifier le patient →",
      refreshPatientData: "Actualiser les données (si vous avez déjà modifié le patient)",
      vitalsHint: "Enregistré avec cette séance et met à jour le dossier du patient.",
      sessionTemplate: "Modèle de séance",
      noTemplate: "Sans modèle",
      templateClinic: " (cabinet)",
      templatePersonal: " (personnel)",
      noTemplatesBefore: "Aucun modèle. Créez-les dans",
      noTemplatesAfter: ".",
      clinicalToolsLink: "Outils cliniques",
      templateApplyHint: "Choisir un modèle applique automatiquement le contenu et les sections visibles (p. ex. sans hélomes en procédures chirurgicales).",
      templateFilteredView: "Vue filtrée par modèle : {n} sections visibles. Choisissez « Sans modèle » pour voir le formulaire complet.",
      templateNoSections: "Ce modèle n'a pas de sections définies. Modifiez-le dans Outils cliniques, cochez ce qu'il faut inclure et enregistrez à nouveau.",
      selectPatientTitle: "Sélectionnez un patient",
      completePatientDataTitle: "Complétez les champs obligatoires du patient (prénom, nom, date de naissance, genre, pièce d'identité)",
      completePatientDataHint: "Pour enregistrer un brouillon ou terminer la séance, complétez d'abord les données du patient et cliquez sur \\"Actualiser les données\\" ci-dessus.",
      loadMoreSessions: "Charger plus de séances",
      loadingMore: "Chargement…",
      reschedule: "Reprogrammer",
      rescheduleTitle: "Reprogrammer le prochain rendez-vous",
      daysOverdue: "{n} jours de retard",
      scheduleAppointment: "Planifier un rendez-vous →",
      todayRel: "Aujourd'hui",
      tomorrowRel: "Demain",
      inDays: "Dans {n} jours",
      exportJson: "Exporter JSON",
      yearsOld: "{n} ans",
`;

const clinicEs = `
    clinic: {
      tabOverview: "Resumen",
      tabPodiatrists: "Podólogos",
      tabPatients: "Pacientes",
      tabReceptionists: "Recepcionistas",
      statPodiatrists: "Podólogos",
      statTotalPatients: "Total Pacientes",
      statSessionsThisMonth: "Sesiones este mes",
      vsPreviousMonth: "% vs. mes anterior",
      agendaTitle: "Agenda (últimos 30 días)",
      agendaSubtitle: "Pacientes atendidos, no-show y cancelaciones registradas en el calendario",
      allPodiatrists: "Todos los podólogos",
      attended: "Atendidos",
      noShow: "No asistieron",
      noShowRateOfResolved: "{n}% del total resuelto",
      cancelled: "Canceladas",
      cancellationRate: "Tasa cancelación: {n}%",
      pending: "Pendientes",
      demandTitle: "Demanda de agenda",
      demandHint: "Total demanda (30 días): {n} citas. Detalle de horas pico, ocupación y cierre diario en Cobros → Agenda.",
      openCheckoutAgenda: "Abrir Cobros → Agenda",
      attendedPerDay: "Atendidos por día",
      loadingAgendaMetrics: "Cargando métricas de agenda…",
      activityByPodiatrist: "Actividad por podólogo",
      sessionsCount: "{n} sesiones",
      podiatristsLimit: "Podólogos: {current} de {limit} (límite definido por PodoAdmin)",
      podiatristsNoLimit: "Podólogos de la clínica. Sin límite definido.",
      createPodiatrist: "Crear podólogo",
      colPodiatrist: "Podólogo",
      colEmail: "Email",
      colLicense: "Licencia",
      colPatients: "Pacientes",
      colSessionsMonth: "Sesiones (mes)",
      licenseNotRegistered: "No registrada",
      noPodiatrists: "No hay podólogos en esta clínica",
      totalIndexed: "Total indexados",
      searchPatientPlaceholder: "Buscar paciente (nombre, email, teléfono)...",
      activityAll: "Actividad: todos",
      visitsRangeChip: "Visitas {min}–{max}",
      loadingPatients: "Cargando pacientes…",
      colPhone: "Teléfono",
      colVisits: "Visitas",
      colAssignedPodiatrist: "Podólogo asignado",
      colLastSession: "Última sesión",
      colActions: "Acciones",
      reassign: "Reasignar",
      noPatientsFound: "No se encontraron pacientes",
      receptionistsHint: "Las recepcionistas tienen acceso sin créditos a crear pacientes, crear y editar citas en el calendario de los podólogos que les asignes.",
      receptionistsActive: "Activas: {active} / {max}. Deben cambiar la contraseña en el primer inicio de sesión.",
      createReceptionist: "Crear recepcionista",
      colName: "Nombre",
      colAssignedPodiatrists: "Podólogos asignados",
      unassigned: "Sin asignar",
      podiatristsAction: "Podólogos",
      unblock: "Desbloquear",
      block: "Bloquear",
      enable: "Habilitar",
      disable: "Deshabilitar",
      noReceptionists: "No hay recepcionistas. Crear una para que gestione citas y pacientes de los podólogos de la clínica.",
      reassignTitle: "Reasignar paciente",
      reassignUseCase: "Caso de uso: Cuando un podólogo no puede atender citas por ausencia o indisponibilidad, puede reasignar sus pacientes a otro profesional de la clínica.",
      currentPodiatrist: "Podólogo actual",
      newPodiatrist: "Nuevo podólogo asignado",
      selectPodiatrist: "Seleccionar podólogo...",
      unknownPodiatrist: "Desconocido",
      createPodiatristSubtitle: "El nuevo podólogo será asignado a tu clínica.",
      initialPasswordMin8: "Contraseña inicial (mín. 8 caracteres)",
      createReceptionistSubtitle: "Se asignarán todos los podólogos de la clínica. Deberá cambiar la contraseña en su primer acceso.",
      initialPassword: "Contraseña inicial",
      assignedPodiatristsTitle: "Podólogos asignados",
      noPodiatristsInClinic: "No hay podólogos en la clínica.",
      confirmDeleteReceptionist: "¿Eliminar a la recepcionista {name} ({email})? Esta acción no se puede deshacer.",
      maxActiveReceptionists: "Máximo {max} recepcionistas activas en la clínica.",
      emailTaken: "Ya existe una cuenta con este correo electrónico",
      createReceptionistError: "Error al crear recepcionista",
      saveAssignmentError: "Error al guardar asignación",
      createPodiatristError: "Error al crear podólogo",
      passwordMin8: "La contraseña debe tener al menos 8 caracteres",
    },
`;

const clinicEn = `
    clinic: {
      tabOverview: "Overview",
      tabPodiatrists: "Podiatrists",
      tabPatients: "Patients",
      tabReceptionists: "Receptionists",
      statPodiatrists: "Podiatrists",
      statTotalPatients: "Total patients",
      statSessionsThisMonth: "Sessions this month",
      vsPreviousMonth: "% vs. previous month",
      agendaTitle: "Agenda (last 30 days)",
      agendaSubtitle: "Patients seen, no-shows and cancellations recorded in the calendar",
      allPodiatrists: "All podiatrists",
      attended: "Attended",
      noShow: "No-shows",
      noShowRateOfResolved: "{n}% of resolved total",
      cancelled: "Cancelled",
      cancellationRate: "Cancellation rate: {n}%",
      pending: "Pending",
      demandTitle: "Agenda demand",
      demandHint: "Total demand (30 days): {n} appointments. Peak hours, occupancy and daily close details are in Checkout → Agenda.",
      openCheckoutAgenda: "Open Checkout → Agenda",
      attendedPerDay: "Attended per day",
      loadingAgendaMetrics: "Loading agenda metrics…",
      activityByPodiatrist: "Activity by podiatrist",
      sessionsCount: "{n} sessions",
      podiatristsLimit: "Podiatrists: {current} of {limit} (limit set by PodoAdmin)",
      podiatristsNoLimit: "Clinic podiatrists. No limit defined.",
      createPodiatrist: "Create podiatrist",
      colPodiatrist: "Podiatrist",
      colEmail: "Email",
      colLicense: "License",
      colPatients: "Patients",
      colSessionsMonth: "Sessions (month)",
      licenseNotRegistered: "Not registered",
      noPodiatrists: "No podiatrists in this clinic",
      totalIndexed: "Total indexed",
      searchPatientPlaceholder: "Search patient (name, email, phone)...",
      activityAll: "Activity: all",
      visitsRangeChip: "Visits {min}–{max}",
      loadingPatients: "Loading patients…",
      colPhone: "Phone",
      colVisits: "Visits",
      colAssignedPodiatrist: "Assigned podiatrist",
      colLastSession: "Last session",
      colActions: "Actions",
      reassign: "Reassign",
      noPatientsFound: "No patients found",
      receptionistsHint: "Receptionists can create patients and create/edit appointments on the calendars of assigned podiatrists, without using credits.",
      receptionistsActive: "Active: {active} / {max}. They must change the password on first sign-in.",
      createReceptionist: "Create receptionist",
      colName: "Name",
      colAssignedPodiatrists: "Assigned podiatrists",
      unassigned: "Unassigned",
      podiatristsAction: "Podiatrists",
      unblock: "Unblock",
      block: "Block",
      enable: "Enable",
      disable: "Disable",
      noReceptionists: "No receptionists. Create one to manage appointments and patients for clinic podiatrists.",
      reassignTitle: "Reassign patient",
      reassignUseCase: "Use case: When a podiatrist cannot take appointments due to absence or unavailability, you can reassign their patients to another professional at the clinic.",
      currentPodiatrist: "Current podiatrist",
      newPodiatrist: "New assigned podiatrist",
      selectPodiatrist: "Select podiatrist...",
      unknownPodiatrist: "Unknown",
      createPodiatristSubtitle: "The new podiatrist will be assigned to your clinic.",
      initialPasswordMin8: "Initial password (min. 8 characters)",
      createReceptionistSubtitle: "All clinic podiatrists will be assigned. They must change the password on first access.",
      initialPassword: "Initial password",
      assignedPodiatristsTitle: "Assigned podiatrists",
      noPodiatristsInClinic: "No podiatrists in the clinic.",
      confirmDeleteReceptionist: "Delete receptionist {name} ({email})? This cannot be undone.",
      maxActiveReceptionists: "Maximum {max} active receptionists in the clinic.",
      emailTaken: "An account with this email already exists",
      createReceptionistError: "Error creating receptionist",
      saveAssignmentError: "Error saving assignment",
      createPodiatristError: "Error creating podiatrist",
      passwordMin8: "Password must be at least 8 characters",
    },
`;

const clinicPt = `
    clinic: {
      tabOverview: "Resumo",
      tabPodiatrists: "Podólogos",
      tabPatients: "Pacientes",
      tabReceptionists: "Recepcionistas",
      statPodiatrists: "Podólogos",
      statTotalPatients: "Total de pacientes",
      statSessionsThisMonth: "Sessões este mês",
      vsPreviousMonth: "% vs. mês anterior",
      agendaTitle: "Agenda (últimos 30 dias)",
      agendaSubtitle: "Pacientes atendidos, faltas e cancelamentos registados no calendário",
      allPodiatrists: "Todos os podólogos",
      attended: "Atendidos",
      noShow: "Faltaram",
      noShowRateOfResolved: "{n}% do total resolvido",
      cancelled: "Canceladas",
      cancellationRate: "Taxa de cancelamento: {n}%",
      pending: "Pendentes",
      demandTitle: "Procura da agenda",
      demandHint: "Procura total (30 dias): {n} consultas. Detalhe de horas de pico, ocupação e fecho diário em Cobranças → Agenda.",
      openCheckoutAgenda: "Abrir Cobranças → Agenda",
      attendedPerDay: "Atendidos por dia",
      loadingAgendaMetrics: "A carregar métricas da agenda…",
      activityByPodiatrist: "Atividade por podólogo",
      sessionsCount: "{n} sessões",
      podiatristsLimit: "Podólogos: {current} de {limit} (limite definido pela PodoAdmin)",
      podiatristsNoLimit: "Podólogos da clínica. Sem limite definido.",
      createPodiatrist: "Criar podólogo",
      colPodiatrist: "Podólogo",
      colEmail: "Email",
      colLicense: "Licença",
      colPatients: "Pacientes",
      colSessionsMonth: "Sessões (mês)",
      licenseNotRegistered: "Não registada",
      noPodiatrists: "Não há podólogos nesta clínica",
      totalIndexed: "Total indexados",
      searchPatientPlaceholder: "Pesquisar paciente (nome, email, telefone)...",
      activityAll: "Atividade: todos",
      visitsRangeChip: "Visitas {min}–{max}",
      loadingPatients: "A carregar pacientes…",
      colPhone: "Telefone",
      colVisits: "Visitas",
      colAssignedPodiatrist: "Podólogo atribuído",
      colLastSession: "Última sessão",
      colActions: "Ações",
      reassign: "Reatribuir",
      noPatientsFound: "Nenhum paciente encontrado",
      receptionistsHint: "As recepcionistas têm acesso sem créditos para criar pacientes e criar/editar consultas no calendário dos podólogos que lhes atribuir.",
      receptionistsActive: "Ativas: {active} / {max}. Devem alterar a palavra-passe no primeiro início de sessão.",
      createReceptionist: "Criar recepcionista",
      colName: "Nome",
      colAssignedPodiatrists: "Podólogos atribuídos",
      unassigned: "Sem atribuição",
      podiatristsAction: "Podólogos",
      unblock: "Desbloquear",
      block: "Bloquear",
      enable: "Ativar",
      disable: "Desativar",
      noReceptionists: "Não há recepcionistas. Crie uma para gerir consultas e pacientes dos podólogos da clínica.",
      reassignTitle: "Reatribuir paciente",
      reassignUseCase: "Caso de uso: Quando um podólogo não pode atender por ausência ou indisponibilidade, pode reatribuir os pacientes a outro profissional da clínica.",
      currentPodiatrist: "Podólogo atual",
      newPodiatrist: "Novo podólogo atribuído",
      selectPodiatrist: "Selecionar podólogo...",
      unknownPodiatrist: "Desconhecido",
      createPodiatristSubtitle: "O novo podólogo será atribuído à sua clínica.",
      initialPasswordMin8: "Palavra-passe inicial (mín. 8 caracteres)",
      createReceptionistSubtitle: "Serão atribuídos todos os podólogos da clínica. Deverá alterar a palavra-passe no primeiro acesso.",
      initialPassword: "Palavra-passe inicial",
      assignedPodiatristsTitle: "Podólogos atribuídos",
      noPodiatristsInClinic: "Não há podólogos na clínica.",
      confirmDeleteReceptionist: "Eliminar a recepcionista {name} ({email})? Esta ação não pode ser desfeita.",
      maxActiveReceptionists: "Máximo de {max} recepcionistas ativas na clínica.",
      emailTaken: "Já existe uma conta com este email",
      createReceptionistError: "Erro ao criar recepcionista",
      saveAssignmentError: "Erro ao guardar atribuição",
      createPodiatristError: "Erro ao criar podólogo",
      passwordMin8: "A palavra-passe deve ter pelo menos 8 caracteres",
    },
`;

const clinicFr = `
    clinic: {
      tabOverview: "Aperçu",
      tabPodiatrists: "Podologues",
      tabPatients: "Patients",
      tabReceptionists: "Réceptionnistes",
      statPodiatrists: "Podologues",
      statTotalPatients: "Total patients",
      statSessionsThisMonth: "Séances ce mois",
      vsPreviousMonth: "% vs. mois précédent",
      agendaTitle: "Agenda (30 derniers jours)",
      agendaSubtitle: "Patients vus, absences et annulations enregistrées dans le calendrier",
      allPodiatrists: "Tous les podologues",
      attended: "Vus",
      noShow: "Absents",
      noShowRateOfResolved: "{n}% du total résolu",
      cancelled: "Annulés",
      cancellationRate: "Taux d'annulation : {n}%",
      pending: "En attente",
      demandTitle: "Demande d'agenda",
      demandHint: "Demande totale (30 jours) : {n} rendez-vous. Détail des heures de pointe, occupation et clôture quotidienne dans Encaissements → Agenda.",
      openCheckoutAgenda: "Ouvrir Encaissements → Agenda",
      attendedPerDay: "Vus par jour",
      loadingAgendaMetrics: "Chargement des métriques d'agenda…",
      activityByPodiatrist: "Activité par podologue",
      sessionsCount: "{n} séances",
      podiatristsLimit: "Podologues : {current} sur {limit} (limite définie par PodoAdmin)",
      podiatristsNoLimit: "Podologues de la clinique. Aucune limite définie.",
      createPodiatrist: "Créer un podologue",
      colPodiatrist: "Podologue",
      colEmail: "E-mail",
      colLicense: "Licence",
      colPatients: "Patients",
      colSessionsMonth: "Séances (mois)",
      licenseNotRegistered: "Non enregistrée",
      noPodiatrists: "Aucun podologue dans cette clinique",
      totalIndexed: "Total indexés",
      searchPatientPlaceholder: "Rechercher un patient (nom, e-mail, téléphone)...",
      activityAll: "Activité : tous",
      visitsRangeChip: "Visites {min}–{max}",
      loadingPatients: "Chargement des patients…",
      colPhone: "Téléphone",
      colVisits: "Visites",
      colAssignedPodiatrist: "Podologue assigné",
      colLastSession: "Dernière séance",
      colActions: "Actions",
      reassign: "Réassigner",
      noPatientsFound: "Aucun patient trouvé",
      receptionistsHint: "Les réceptionnistes peuvent créer des patients et créer/modifier des rendez-vous sur les calendriers des podologues assignés, sans utiliser de crédits.",
      receptionistsActive: "Actives : {active} / {max}. Elles doivent changer le mot de passe à la première connexion.",
      createReceptionist: "Créer une réceptionniste",
      colName: "Nom",
      colAssignedPodiatrists: "Podologues assignés",
      unassigned: "Non assigné",
      podiatristsAction: "Podologues",
      unblock: "Débloquer",
      block: "Bloquer",
      enable: "Activer",
      disable: "Désactiver",
      noReceptionists: "Aucune réceptionniste. Créez-en une pour gérer les rendez-vous et patients des podologues de la clinique.",
      reassignTitle: "Réassigner le patient",
      reassignUseCase: "Cas d'usage : lorsqu'un podologue ne peut pas assurer les rendez-vous en raison d'une absence ou indisponibilité, vous pouvez réassigner ses patients à un autre professionnel de la clinique.",
      currentPodiatrist: "Podologue actuel",
      newPodiatrist: "Nouveau podologue assigné",
      selectPodiatrist: "Sélectionner un podologue...",
      unknownPodiatrist: "Inconnu",
      createPodiatristSubtitle: "Le nouveau podologue sera assigné à votre clinique.",
      initialPasswordMin8: "Mot de passe initial (min. 8 caractères)",
      createReceptionistSubtitle: "Tous les podologues de la clinique seront assignés. Le mot de passe devra être changé au premier accès.",
      initialPassword: "Mot de passe initial",
      assignedPodiatristsTitle: "Podologues assignés",
      noPodiatristsInClinic: "Aucun podologue dans la clinique.",
      confirmDeleteReceptionist: "Supprimer la réceptionniste {name} ({email}) ? Cette action est irréversible.",
      maxActiveReceptionists: "Maximum {max} réceptionnistes actives dans la clinique.",
      emailTaken: "Un compte avec cet e-mail existe déjà",
      createReceptionistError: "Erreur lors de la création de la réceptionniste",
      saveAssignmentError: "Erreur lors de l'enregistrement de l'assignation",
      createPodiatristError: "Erreur lors de la création du podologue",
      passwordMin8: "Le mot de passe doit comporter au moins 8 caractères",
    },
`;

function injectPatients(langBlockStartHint, block) {
  // Insert before engagement in each language patients object
  const marker = "engagement: {\n        segmentNew:";
  // Find within language - use unique context: after totalSessions of that language's patients
  // Safer: find first occurrence after langBlockStartHint of totalSessions line then engagement
  const langIdx = src.indexOf(langBlockStartHint);
  if (langIdx < 0) throw new Error("lang start not found " + langBlockStartHint);
  const sub = src.slice(langIdx);
  const engRel = sub.indexOf(marker);
  if (engRel < 0) throw new Error("engagement not found after " + langBlockStartHint);
  const abs = langIdx + engRel;
  if (src.slice(Math.max(0, abs - 80), abs).includes("personalData:")) return; // already
  // Check nearby for personalData
  const nearby = src.slice(abs - 200, abs + 50);
  if (nearby.includes("personalData:")) return;
  src = src.slice(0, abs) + block + "      " + src.slice(abs);
}

function injectSessions(langBlockStartHint, block) {
  const marker = "followUp: {\n        overdueBanner:";
  const langIdx = src.indexOf(langBlockStartHint);
  if (langIdx < 0) throw new Error("lang start not found " + langBlockStartHint);
  // Find sessions: after this lang - look for sessions that contains createFirstSession then followUp
  let searchFrom = langIdx;
  const sessionsLabel = "\n    sessions: {";
  const sessIdx = src.indexOf(sessionsLabel, searchFrom);
  if (sessIdx < 0) throw new Error("sessions not found");
  const sub = src.slice(sessIdx);
  const rel = sub.indexOf(marker);
  if (rel < 0) throw new Error("followUp not found in sessions");
  const abs = sessIdx + rel;
  if (src.slice(abs - 120, abs).includes("reasons:")) return;
  src = src.slice(0, abs) + block + "      " + src.slice(abs);
}

function injectClinic(langBlockStartHint, block) {
  const langIdx = src.indexOf(langBlockStartHint);
  if (langIdx < 0) throw new Error("lang start not found");
  // Insert before // Calendar or calendar: after sessions of this language
  const calMarkers = ["\n    calendar: {", "\n    // Calendar"];
  let abs = -1;
  for (const m of calMarkers) {
    const i = src.indexOf(m, langIdx);
    if (i >= 0 && (abs < 0 || i < abs)) abs = i;
  }
  if (abs < 0) throw new Error("calendar not found after " + langBlockStartHint);
  // Avoid double insert - clinic should be right before calendar for this lang
  const before = src.slice(abs - 40, abs);
  if (src.slice(abs - 200, abs).includes("createPodiatristError:")) return;
  src = src.slice(0, abs) + block + src.slice(abs);
}

injectPatients('es: {\n    common:', patientsEs);
injectPatients('en: {\n    common:', patientsEn);
injectPatients('pt: {\n    common:', patientsPt);
injectPatients('fr: {\n    common:', patientsFr);

injectSessions('es: {\n    common:', sessionsEs);
injectSessions('en: {\n    common:', sessionsEn);
injectSessions('pt: {\n    common:', sessionsPt);
injectSessions('fr: {\n    common:', sessionsFr);

injectClinic('es: {\n    common:', clinicEs);
injectClinic('en: {\n    common:', clinicEn);
injectClinic('pt: {\n    common:', clinicPt);
injectClinic('fr: {\n    common:', clinicFr);

fs.writeFileSync(path, src);
console.log("Patched translations.ts OK, length=", src.length);
