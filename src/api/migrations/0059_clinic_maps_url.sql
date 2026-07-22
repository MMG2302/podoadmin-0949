-- Link directo de Google Maps para la clínica: fuente alternativa/precisa de ubicación
-- cuando la dirección en texto libre no basta para generar un enlace útil (variable {{maps}} de WhatsApp).
ALTER TABLE clinics ADD COLUMN maps_url TEXT;
