/** Clases compartidas para inputs, textareas y selects legibles en claro y oscuro. */

export const formLabelClass =
  "block text-sm font-medium text-brand-ink";

export const formLabelClassXs =
  "block text-xs font-medium text-brand-muted";

export const formHintClass = "text-xs text-brand-muted";

export const formFieldClass =
  "w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent transition-all placeholder:text-brand-muted/70";

export const formFieldClassSm =
  "w-full px-3 py-2 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-brand-muted/70";

export const formFieldClassXs =
  "w-full px-2 py-1 bg-brand-surface text-brand-ink border border-brand-border rounded text-xs focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-brand-muted/70";

export const formFieldDisabledClass =
  "w-full px-4 py-2.5 bg-brand-canvas text-brand-muted border border-brand-border rounded-lg cursor-not-allowed";

export const formFieldDisabledClassSm =
  "w-full px-3 py-2 bg-brand-canvas text-brand-muted border border-brand-border rounded-lg cursor-not-allowed";

export const formPanelMutedClass =
  "rounded-lg border border-brand-border bg-brand-canvas p-4 text-brand-ink";

export const formPanelTitleClass = "text-sm font-medium text-brand-ink";

export const formTableClass =
  "w-full min-w-[280px] text-xs border border-brand-border rounded-lg overflow-hidden bg-brand-surface text-brand-ink";

export const formTableHeadClass = "bg-brand-canvas text-brand-muted";

export const formTableRowBorderClass = "border-t border-brand-border";

export const formFieldResizeClass = `${formFieldClass} resize-y`;
export const formFieldResizeNoneClass = `${formFieldClass} resize-none`;

/** Títulos y texto principal legible en claro y oscuro */
export const textPrimaryClass = "text-brand-ink";

export const textPrimarySmClass = "text-brand-ink";

export const formHeadingClass = "text-lg font-semibold text-brand-ink";

export const formHeadingSmClass = "text-sm font-semibold text-brand-ink";

export const formSubheadingClass = "font-medium text-brand-ink";

export const formLinkClass =
  "text-brand-ink underline hover:text-brand-ink-hover";

export const formCheckboxClass =
  "rounded border-brand-border text-brand-ink focus:ring-brand-ink";

export const formErrorClass = "text-sm text-semantic-error";

export const formSuccessClass = "text-sm text-semantic-success";

export const formWarningClass = "text-sm text-semantic-warning";

/** Cajas de alerta semánticas (respetan la paleta del usuario vía CSS vars). */
export const semanticAlertErrorClass =
  "rounded-lg border border-semantic-error bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error";

export const semanticAlertWarningClass =
  "rounded-lg border border-semantic-warning bg-semantic-warning-bg px-4 py-3 text-sm text-semantic-warning";

export const semanticAlertSuccessClass =
  "rounded-lg border border-semantic-success bg-semantic-success-bg px-4 py-3 text-sm text-semantic-success";

export const semanticAlertInfoClass =
  "rounded-lg border border-semantic-info bg-semantic-info-bg px-4 py-3 text-sm text-semantic-info";

/** Badge / chip semántico compacto */
export const semanticChipWarningClass =
  "inline-flex items-center rounded-full border border-semantic-warning bg-semantic-warning-bg px-2 py-0.5 text-xs font-medium text-semantic-warning";

export const semanticChipSuccessClass =
  "inline-flex items-center rounded-full border border-semantic-success bg-semantic-success-bg px-2 py-0.5 text-xs font-medium text-semantic-success";

export const semanticChipErrorClass =
  "inline-flex items-center rounded-full border border-semantic-error bg-semantic-error-bg px-2 py-0.5 text-xs font-medium text-semantic-error";

export const semanticChipInfoClass =
  "inline-flex items-center rounded-full border border-semantic-info bg-semantic-info-bg px-2 py-0.5 text-xs font-medium text-semantic-info";

/** Icono circular de estado (auth, verify, etc.) */
export const semanticStatusIconSuccessClass =
  "w-16 h-16 bg-semantic-success-bg rounded-full flex items-center justify-center mx-auto mb-4 text-semantic-success";

export const semanticStatusIconErrorClass =
  "w-16 h-16 bg-semantic-error-bg rounded-full flex items-center justify-center mx-auto mb-4 text-semantic-error";

/** Reglas de contraseña cumplidas */
export const semanticRuleOkTextClass = "text-semantic-success";

export const semanticRuleOkIconClass =
  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-semantic-success-bg text-semantic-success";

/** Botón/acción destructiva secundaria */
export const semanticDestructiveTextClass = "text-semantic-error hover:bg-semantic-error-bg";

/** Panel y botones de WhatsApp Web (paleta dedicada, independiente de estados semánticos). */
export const whatsappPanelClass =
  "rounded-xl border border-whatsapp-border bg-whatsapp-bg p-6";

export const whatsappPanelInnerClass =
  "rounded-lg border border-whatsapp-border/60 bg-brand-surface p-4";

export const whatsappMutedTextClass = "text-whatsapp-muted";

export const whatsappButtonClass =
  "inline-flex items-center justify-center px-4 py-2 rounded-lg bg-whatsapp text-whatsapp-fg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

export const whatsappButtonSmClass =
  "inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-whatsapp text-whatsapp-fg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed";

export const whatsappButtonXsClass =
  "inline-flex items-center justify-center px-3 py-1 rounded bg-whatsapp text-whatsapp-fg text-xs font-medium hover:opacity-90";

export const whatsappInputBorderClass =
  "border border-whatsapp-border rounded-lg";

export const whatsappListClass =
  "divide-y divide-whatsapp-border/40 bg-brand-surface rounded-lg border border-whatsapp-border/60 overflow-hidden";

export const whatsappOutlineButtonClass =
  "px-3 py-1.5 border border-whatsapp-border rounded-lg text-sm hover:bg-whatsapp-bg/50";
