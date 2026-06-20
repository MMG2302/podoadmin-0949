-- Stock inicial / cantidad en inventario de material consumible

ALTER TABLE `inventory_items` ADD COLUMN `quantity` real NOT NULL DEFAULT 0;
