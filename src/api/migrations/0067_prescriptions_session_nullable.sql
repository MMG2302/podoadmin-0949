-- Las recetas pivotan sobre el paciente (patient_id), no sobre la sesión que las originó.
-- session_id pasa a ser opcional: al borrar la sesión, la receta se desvincula (SET NULL)
-- en vez de destruirse (sigue siendo consultable por paciente vía GET /prescriptions?patientId=).
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text REFERENCES clinical_sessions(id),
	`patient_id` text NOT NULL REFERENCES patients(id),
	`patient_name` text NOT NULL,
	`patient_dob` text NOT NULL,
	`patient_dni` text NOT NULL,
	`podiatrist_id` text NOT NULL,
	`podiatrist_name` text NOT NULL,
	`podiatrist_license` text,
	`prescription_date` text NOT NULL,
	`prescription_text` text NOT NULL,
	`medications` text DEFAULT '' NOT NULL,
	`next_visit_date` text,
	`notes` text DEFAULT '' NOT NULL,
	`folio` text NOT NULL,
	`patient_age_years` integer,
	`patient_weight_kg` text,
	`patient_height_cm` text,
	`podiatrist_cedula` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`clinic_id` text
);
--> statement-breakpoint
INSERT INTO `__new_prescriptions`("id", "session_id", "patient_id", "patient_name", "patient_dob", "patient_dni", "podiatrist_id", "podiatrist_name", "podiatrist_license", "prescription_date", "prescription_text", "medications", "next_visit_date", "notes", "folio", "patient_age_years", "patient_weight_kg", "patient_height_cm", "podiatrist_cedula", "created_at", "created_by", "clinic_id") SELECT "id", "session_id", "patient_id", "patient_name", "patient_dob", "patient_dni", "podiatrist_id", "podiatrist_name", "podiatrist_license", "prescription_date", "prescription_text", "medications", "next_visit_date", "notes", "folio", "patient_age_years", "patient_weight_kg", "patient_height_cm", "podiatrist_cedula", "created_at", "created_by", "clinic_id" FROM `prescriptions`;--> statement-breakpoint
DROP TABLE `prescriptions`;--> statement-breakpoint
ALTER TABLE `__new_prescriptions` RENAME TO `prescriptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
