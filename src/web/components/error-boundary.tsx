import { Component, ReactNode } from "react";
import { semanticStatusIconErrorClass } from "@/lib/form-field-classes";
import { Sentry, isSentryInitialized } from "@/lib/sentry";
import { useLanguage } from "@/contexts/language-context";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ERROR_BOUNDARY_FALLBACK = {
  title: "Something went wrong",
  message: "An unexpected error occurred. Please reload the page.",
  reload: "Reload page",
} as const;

function ErrorBoundaryFallback({ error }: { error: Error }) {
  const { t } = useLanguage();
  const eb = t?.errorBoundary;
  const title = eb?.title ?? ERROR_BOUNDARY_FALLBACK.title;
  const message = eb?.message ?? ERROR_BOUNDARY_FALLBACK.message;
  const reload = eb?.reload ?? ERROR_BOUNDARY_FALLBACK.reload;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">
        <div className={`${semanticStatusIconErrorClass} mb-6`}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-brand-ink mb-2">{title}</h1>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <p className="text-gray-400 text-xs font-mono mb-6 truncate" title={error.message}>
          {error.message}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-[#333] transition-colors"
        >
          {reload}
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    if (isSentryInitialized()) {
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorBoundaryFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
