/** Clases compartidas para login, registro y otras pantallas públicas (soportan modo oscuro). */
export const authPage = {
  shell: "min-h-screen bg-brand-surface flex overflow-hidden",
  formColumn: "w-full lg:w-1/2 flex flex-col bg-brand-surface",
  formColumnScroll: "w-full lg:w-1/2 flex flex-col h-screen min-h-0 overflow-y-auto bg-brand-surface",
  heading: "text-brand-ink text-3xl font-semibold mb-2",
  subheading: "text-brand-muted",
  mobileLogo: "text-brand-ink text-4xl font-light tracking-tight",
  label: "block text-sm font-medium text-brand-ink mb-2",
  labelTight: "block text-sm font-medium text-brand-ink mb-1",
  hint: "text-xs text-brand-muted mb-2",
  input:
    "w-full px-4 py-3.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-ink placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink",
  inputWithIcon:
    "w-full px-4 py-3.5 pr-11 bg-brand-canvas border border-brand-border rounded-lg text-brand-ink placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink",
  termsBox:
    "flex items-start gap-3 cursor-pointer rounded-lg border-2 border-brand-border bg-brand-canvas p-4 hover:border-brand-muted/50 transition-colors has-[:checked]:border-brand-ink has-[:checked]:bg-brand-surface",
  primaryBtn:
    "w-full py-3.5 bg-brand-ink text-brand-ink-fg font-medium rounded-lg hover:bg-brand-ink-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden",
  link: "text-brand-ink font-medium hover:underline",
  muted: "text-sm text-brand-muted",
  bodyText: "text-sm text-brand-muted",
  error:
    "bg-semantic-error-bg border border-semantic-error/30 text-semantic-error px-4 py-3 rounded-lg text-sm",
  amber:
    "rounded-lg border border-semantic-warning/30 bg-semantic-warning-bg px-4 py-3 text-sm text-semantic-warning",
  spinner: "animate-spin h-8 w-8 text-brand-ink",
  dividerLine: "bg-brand-surface px-2 text-brand-muted",
  googleBtn:
    "w-full py-3.5 bg-brand-surface border border-brand-border text-brand-ink font-medium rounded-lg hover:bg-brand-canvas transition-all disabled:opacity-50 flex items-center justify-center gap-2",
} as const;
