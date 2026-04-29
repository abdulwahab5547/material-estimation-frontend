import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

/**
 * Top-level boundary wrapped around the whole app. Catches render-time
 * exceptions in descendants and shows a branded fallback instead of a
 * white screen of death. Errors are logged to the console so the dev
 * still gets the stack trace.
 *
 * Client-side error boundaries cannot catch:
 *  - errors in event handlers (sonner toasts already handle those)
 *  - errors in async code (TanStack Query surfaces those as isError)
 *  - errors in SSR (we're SPA-only)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    this.setState({ info });
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-blueprint px-4 py-12">
        <div className="max-w-lg w-full rounded-2xl border border-destructive/40 bg-card/90 backdrop-blur p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Something broke in the UI</h1>
              <p className="text-xs text-muted-foreground">
                The rest of the app kept running — this view crashed.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background/60 p-3 mb-4 font-mono text-xs text-destructive overflow-x-auto">
            {this.state.error.message || "Unknown error"}
          </div>

          <p className="text-sm text-muted-foreground mb-5">
            If this keeps happening, open your browser console for the full stack trace, then report
            with the steps that triggered it.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Home className="h-3.5 w-3.5" /> Back home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
