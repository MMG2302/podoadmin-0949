-- Listas de registro pendientes (vendedores/soporte -> super_admin para aprobación)
CREATE TABLE IF NOT EXISTS `pending_registration_lists` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `created_by` text NOT NULL,
  `status` text NOT NULL DEFAULT 'draft',
  `submitted_at` text,
  `reviewed_by` text,
  `reviewed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

-- Entradas de cada lista
CREATE TABLE IF NOT EXISTS `pending_registration_entries` (
  `id` text PRIMARY KEY NOT NULL,
  `list_id` text NOT NULL REFERENCES `pending_registration_lists`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `role` text NOT NULL DEFAULT 'podiatrist',
  `clinic_id` text,
  `clinic_mode` text,
  `notes` text,
  `sort_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL
);
