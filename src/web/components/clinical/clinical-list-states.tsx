/** Indicador de carga para listas clínicas (pacientes / sesiones). */
export function ClinicalListLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-12 text-center">
      <svg
        className="animate-spin h-8 w-8 text-brand-ink mx-auto mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className="text-sm text-brand-muted">{label}</p>
    </div>
  );
}

export function ClinicalListError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-6 text-center">
      <p className="text-sm text-red-800 dark:text-red-200 mb-3">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium bg-brand-surface border border-semantic-error/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
