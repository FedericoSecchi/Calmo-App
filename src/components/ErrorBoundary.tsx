import { Component, ReactNode } from "react";
import { DICTS, getAppLang } from "@/lib/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Error boundary runs outside the router, read language directly from
      // the storage/browser instead of a hook.
      const copy = DICTS[getAppLang()].errorBoundary;
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-foreground">{copy.title}</h1>
            <p className="text-muted-foreground mb-4">{copy.body}</p>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                  {copy.detailsSummary}
                </summary>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {copy.reload}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
