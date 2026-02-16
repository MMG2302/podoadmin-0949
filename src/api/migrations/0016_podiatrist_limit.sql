-- Límite de podólogos por clínica (super_admin lo define; clinic_admin crea dentro del límite)
ALTER TABLE `clinics` ADD COLUMN `podiatrist_limit` integer;
