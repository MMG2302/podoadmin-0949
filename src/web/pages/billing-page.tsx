import { useEffect } from "react";
import { useLocation } from "wouter";
import { buildBillingSettingsPath } from "../lib/billing-settings-path";

/** Redirige /billing (y callbacks de Stripe) a Configuración → Facturación. */
const BillingPage = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLocation(buildBillingSettingsPath(Object.fromEntries(params.entries())));
  }, [setLocation]);

  return null;
};

export default BillingPage;
