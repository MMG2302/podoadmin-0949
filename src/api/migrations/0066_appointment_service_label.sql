-- Servicio/tarifa asociado a la cita: permite unir el tiempo real registrado con la
-- pauta de duración de cada tarifa en la analítica "Tiempo por servicio".
ALTER TABLE appointments ADD COLUMN service_label TEXT;
