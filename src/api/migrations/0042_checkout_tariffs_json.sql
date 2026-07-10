-- Tarifas rápidas de cobro (JSON) por podólogo y por clínica
ALTER TABLE professional_info ADD COLUMN checkout_tariffs_json TEXT;
ALTER TABLE clinics ADD COLUMN checkout_tariffs_json TEXT;
