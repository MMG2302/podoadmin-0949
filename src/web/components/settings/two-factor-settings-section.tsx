import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { api } from "../../lib/api-client";
import { useLanguage } from "../../contexts/language-context";

/**
 * Alta y baja de la verificación en dos pasos.
 *
 * El alta va en dos llamadas: `/2fa/setup` devuelve el secreto sin guardarlo, y
 * `/2fa/enable` lo persiste solo si el código que manda el usuario valida contra él. Por
 * eso el secreto vive en el estado de este componente entre un paso y el otro.
 */

type Paso = "cargando" | "inactivo" | "escanear" | "codigos" | "desactivar";

export function TwoFactorSettingsSection() {
  const { t } = useLanguage();
  const s = t.settings.twoFactor;

  const [paso, setPaso] = useState<Paso>("cargando");
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [codigo, setCodigo] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const cargarEstado = useCallback(async () => {
    const res = await api.get<{ enabled: boolean }>("/2fa/status");
    setPaso(res.data?.enabled ? "desactivar" : "inactivo");
  }, []);

  useEffect(() => {
    void cargarEstado();
  }, [cargarEstado]);

  const iniciar = async () => {
    setError("");
    setOcupado(true);
    const res = await api.post<{ secret: string; qrCodeUrl: string }>("/2fa/setup", {});
    setOcupado(false);

    if (!res.success || !res.data) {
      setError(res.error || s.errorGeneric);
      return;
    }
    setSecret(res.data.secret);
    setQrDataUrl(await QRCode.toDataURL(res.data.qrCodeUrl, { width: 220, margin: 1 }));
    setCodigo("");
    setPaso("escanear");
  };

  const activar = async () => {
    setError("");
    setOcupado(true);
    const res = await api.post<{ backupCodes: string[] }>("/2fa/enable", {
      secret,
      verificationCode: codigo.trim(),
    });
    setOcupado(false);

    if (!res.success || !res.data) {
      setError(res.error || s.errorInvalidCode);
      return;
    }
    setBackupCodes(res.data.backupCodes);
    setSecret("");
    setQrDataUrl("");
    setCodigo("");
    setPaso("codigos");
  };

  const desactivar = async () => {
    setError("");
    setOcupado(true);
    const res = await api.post("/2fa/disable", { verificationCode: codigo.trim() });
    setOcupado(false);

    if (!res.success) {
      setError(res.error || s.errorInvalidCode);
      return;
    }
    setCodigo("");
    setPaso("inactivo");
  };

  const campoCodigo = (onSubmit: () => void, etiqueta: string) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-brand-ink">{s.codeLabel}</label>
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="000000"
          inputMode="text"
          autoComplete="one-time-code"
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-center font-mono tracking-[0.3em] text-brand-ink"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={ocupado || codigo.trim().length < 6}
        className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-medium text-brand-ink-fg disabled:opacity-40"
      >
        {etiqueta}
      </button>
    </div>
  );

  return (
    <section className="rounded-2xl border border-brand-border bg-brand-surface p-6">
      <h3 className="text-base font-semibold text-brand-ink">{s.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-brand-muted">{s.description}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-semantic-error-bg px-3 py-2 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {paso === "cargando" && <p className="mt-4 text-sm text-brand-muted">{s.loading}</p>}

      {paso === "inactivo" && (
        <div className="mt-4 flex items-center gap-3">
          <span className="rounded-full bg-brand-canvas px-3 py-1 text-xs text-brand-muted">
            {s.statusDisabled}
          </span>
          <button
            type="button"
            onClick={iniciar}
            disabled={ocupado}
            className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-medium text-brand-ink-fg disabled:opacity-40"
          >
            {s.enableCta}
          </button>
        </div>
      )}

      {paso === "escanear" && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-brand-ink">{s.scanInstructions}</p>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={s.qrAlt}
              className="rounded-lg border border-brand-border bg-white p-2"
              width={220}
              height={220}
            />
          )}
          <div>
            <p className="text-xs text-brand-muted">{s.manualKey}</p>
            <code className="mt-1 block break-all rounded-lg bg-brand-canvas px-3 py-2 font-mono text-sm text-brand-ink">
              {secret}
            </code>
          </div>
          {campoCodigo(activar, s.verifyCta)}
          <button
            type="button"
            onClick={() => {
              setPaso("inactivo");
              setSecret("");
              setQrDataUrl("");
              setError("");
            }}
            className="text-sm text-brand-muted underline"
          >
            {s.cancel}
          </button>
        </div>
      )}

      {paso === "codigos" && (
        <div className="mt-5 space-y-4">
          <p className="text-sm font-medium text-brand-ink">{s.backupTitle}</p>
          <p className="text-sm text-brand-muted">{s.backupWarning}</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {backupCodes.map((c) => (
              <li
                key={c}
                className="rounded-lg bg-brand-canvas px-3 py-2 text-center font-mono text-sm text-brand-ink"
              >
                {c}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setBackupCodes([]);
              void cargarEstado();
            }}
            className="rounded-lg bg-brand-ink px-4 py-2 text-sm font-medium text-brand-ink-fg"
          >
            {s.backupSavedCta}
          </button>
        </div>
      )}

      {paso === "desactivar" && (
        <div className="mt-4 space-y-4">
          <span className="inline-block rounded-full bg-semantic-success-bg px-3 py-1 text-xs text-semantic-success">
            {s.statusEnabled}
          </span>
          <p className="text-sm text-brand-muted">{s.disableInstructions}</p>
          {campoCodigo(desactivar, s.disableCta)}
        </div>
      )}
    </section>
  );
}
