-- Imágenes de sesión en tabla dedicada (notes JSON queda ligero)

CREATE TABLE IF NOT EXISTS `clinical_session_images` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0,
  `data_uri` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`session_id`) REFERENCES `clinical_sessions`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `clinical_session_images_session_idx` ON `clinical_session_images` (`session_id`, `sort_order`);
