-- Asientos adicionales de podólogo ($10 USD/mes c/u), comprados por el clinic_admin.
-- Se suman a los incluidos por tier (Base=3, Premium=6). clinics.podiatrist_limit pasa a ser
-- solo override manual de super_admin/legacy: el límite efectivo es max(override, incluidos+extra).
ALTER TABLE subscriptions ADD COLUMN extra_podiatrist_seats INTEGER NOT NULL DEFAULT 0;
