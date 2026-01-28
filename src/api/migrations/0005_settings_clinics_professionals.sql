-- assigned_podiatrist_ids para receptionists en created_users
ALTER TABLE `created_users` ADD `assigned_podiatrist_ids` text;

-- Tablas para datos de configuración (settings)
CREATE TABLE `professional_info` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`license_number` text DEFAULT '' NOT NULL,
	`professional_license` text DEFAULT '' NOT NULL
);

CREATE TABLE `professional_licenses` (
	`user_id` text PRIMARY KEY NOT NULL,
	`license` text DEFAULT '' NOT NULL
);

CREATE TABLE `professional_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`cedula` text DEFAULT '' NOT NULL,
	`registro` text DEFAULT '' NOT NULL
);

CREATE TABLE `professional_logos` (
	`user_id` text PRIMARY KEY NOT NULL,
	`logo` text NOT NULL
);
