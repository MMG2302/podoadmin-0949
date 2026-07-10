import { createPortal } from "react-dom";
import { useEffect, type ReactNode } from "react";

const MAX_WIDTH_CLASS = {
  md: "max-w-md",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
} as const;

export type AppModalMaxWidth = keyof typeof MAX_WIDTH_CLASS;

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: AppModalMaxWidth;
  zIndex?: number;
  panelClassName?: string;
  /** id del panel (p. ej. data-session-form) */
  panelId?: string;
};

/**
 * Modal a pantalla completa vía portal (document.body).
 * Evita problemas de `fixed` dentro de <main> con scroll y sidebar.
 */
export function AppModal({
  open,
  onClose,
  children,
  maxWidth = "3xl",
  zIndex = 50,
  panelClassName = "",
  panelId,
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        id={panelId}
        data-session-form={panelId === "session-form-panel" ? true : undefined}
        className={`relative z-10 flex w-full min-w-0 flex-col max-h-[95dvh] sm:max-h-[min(90dvh,100%)] ${MAX_WIDTH_CLASS[maxWidth]} rounded-t-2xl sm:rounded-2xl bg-brand-surface shadow-xl overflow-hidden ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function AppModalHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex-shrink-0 border-b border-brand-border bg-brand-surface px-4 py-4 sm:px-6 sm:py-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function AppModalBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain form-modal-scroll px-4 py-4 sm:px-6 sm:py-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function AppModalFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex-shrink-0 border-t border-brand-border bg-brand-surface px-4 py-4 sm:px-6 ${className}`}
    >
      {children}
    </div>
  );
}
