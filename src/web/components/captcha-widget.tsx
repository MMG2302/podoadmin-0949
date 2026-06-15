import { useEffect, useRef } from "react";

export type CaptchaProvider = "turnstile" | "hcaptcha" | "recaptcha";

type CaptchaWidgetProps = {
  provider: CaptchaProvider;
  siteKey: string;
  onToken: (token: string | null) => void;
  className?: string;
};

declare global {
  interface Window {
    turnstile?: {
      ready?: (fn: () => void) => void;
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
    hcaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    onTurnstileLoad?: () => void;
    onHcaptchaLoad?: () => void;
    onRecaptchaLoad?: () => void;
  }
}

function loadScript(src: string, id: string): Promise<void> {
  if (document.getElementById(id)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureCaptchaScript(provider: CaptchaProvider): Promise<void> {
  switch (provider) {
    case "turnstile":
      await loadScript(
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
        "cf-turnstile-script"
      );
      break;
    case "hcaptcha":
      await loadScript("https://js.hcaptcha.com/1/api.js?render=explicit", "hcaptcha-script");
      break;
    case "recaptcha":
      await loadScript("https://www.google.com/recaptcha/api.js?render=explicit", "recaptcha-script");
      break;
  }
}

/**
 * Widget CAPTCHA según proveedor configurado en el backend (Turnstile, hCaptcha, reCAPTCHA).
 */
export function CaptchaWidget({ provider, siteKey, onToken, className }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    onTokenRef.current(null);
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current) return;

      const emit = (token: string | null) => onTokenRef.current(token);

      if (provider === "turnstile" && window.turnstile) {
        if (widgetIdRef.current != null) {
          try {
            window.turnstile.remove(String(widgetIdRef.current));
          } catch {
            /* */
          }
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => emit(token),
          "expired-callback": () => emit(null),
          "error-callback": () => emit(null),
        });
      } else if (provider === "hcaptcha" && window.hcaptcha) {
        if (widgetIdRef.current != null) {
          try {
            window.hcaptcha.remove(String(widgetIdRef.current));
          } catch {
            /* */
          }
        }
        widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => emit(token),
          "expired-callback": () => emit(null),
          "error-callback": () => emit(null),
        });
      } else if (provider === "recaptcha" && window.grecaptcha) {
        containerRef.current.innerHTML = "";
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => emit(token),
          "expired-callback": () => emit(null),
        });
      }
    };

    const mount = async () => {
      try {
        await ensureCaptchaScript(provider);
        if (cancelled) return;
        if (provider === "turnstile" && window.turnstile?.ready) {
          window.turnstile.ready(renderWidget);
        } else {
          renderWidget();
        }
      } catch (err) {
        console.error("Error cargando CAPTCHA:", err);
        onTokenRef.current(null);
      }
    };

    mount();

    return () => {
      cancelled = true;
      if (provider === "turnstile" && window.turnstile && widgetIdRef.current != null) {
        try {
          window.turnstile.remove(String(widgetIdRef.current));
        } catch {
          /* */
        }
      } else if (provider === "hcaptcha" && window.hcaptcha && widgetIdRef.current != null) {
        try {
          window.hcaptcha.remove(String(widgetIdRef.current));
        } catch {
          /* */
        }
      }
      widgetIdRef.current = null;
    };
  }, [provider, siteKey]);

  return <div ref={containerRef} className={className} aria-label="CAPTCHA" />;
}
