import { semanticAlertInfoClass, semanticAlertWarningClass } from "../../lib/form-field-classes";

interface EditCooldownNoticeProps {
  /** Aviso permanente: los datos quedan fijos 15 días tras guardar. */
  policyText: string;
  /** Si hay cooldown activo, fecha del próximo cambio permitido. */
  blockedUntil?: string | null;
  /** Texto cuando está bloqueado (puede incluir la fecha formateada). */
  blockedText?: string;
  className?: string;
}

/** Avisos de política de edición con cooldown de 15 días. */
export function EditCooldownNotice({
  policyText,
  blockedUntil,
  blockedText,
  className = "",
}: EditCooldownNoticeProps) {
  const isBlocked = !!blockedUntil && new Date(blockedUntil) > new Date();

  return (
    <div className={`space-y-3 mb-4 ${className}`}>
      <div className={`${semanticAlertInfoClass} !p-3`}>{policyText}</div>
      {isBlocked && blockedText && (
        <div className={`${semanticAlertWarningClass} !p-3`}>{blockedText}</div>
      )}
    </div>
  );
}
