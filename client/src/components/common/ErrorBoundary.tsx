import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#2C221E] flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full bg-white rounded-3xl border-2 border-[#E5DACB] p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
            <div className="h-3 w-full brick-gradient absolute top-0 left-0 right-0" />

            <div className="w-16 h-16 rounded-2xl bg-[#FAF0E6] text-[#9E2A2B] flex items-center justify-center mx-auto border border-[#E8D6C3] shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#9E2A2B] bg-[#FAF0E6] px-3 py-1 rounded-full border border-[#E8D6C3]">
                Application Notice
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2C221E] tracking-tight pt-1">
                Something Went Wrong
              </h1>
              <p className="text-xs sm:text-sm text-[#7C6E63] leading-relaxed max-w-md mx-auto">
                An unexpected interface issue occurred. You can reload the current view or return to the CSEPL match hub safely.
              </p>
            </div>

            {/* Error Message Preview */}
            {this.state.error && (
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCF] text-left">
                <p className="text-[11px] font-mono font-bold text-[#9E2A2B] break-words">
                  {this.state.error.message || "Unknown error"}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#9E2A2B] hover:bg-[#842021] text-white text-xs font-black shadow-md shadow-[#9E2A2B]/20 transition-all hover:scale-102"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#2C221E] border border-[#E5DACB] text-xs font-black shadow-xs transition-all"
              >
                <Home className="w-4 h-4 text-[#7C6E63]" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
