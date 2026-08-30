import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught exception caught by GLASSEA Error Boundary:", error, errorInfo);
    (this as any).setState({ errorInfo });
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    const self = this as any;
    if (self.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          {/* Subtle neon matrix background decor */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,163,204,0.1),transparent_50%)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(224,0,150,0.08),transparent_50%)] pointer-events-none"></div>

          <div className="w-full max-w-xl bg-slate-900/80 border border-red-500/30 rounded-3xl p-8 backdrop-blur-xl relative shadow-2xl glow-neon-pink text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">Application Error</span>
              <h1 className="text-2xl font-bold tracking-tight font-display">Something Went Wrong</h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                An unexpected error occurred while rendering this page. You can reload the page or return to the homepage.
              </p>
            </div>

            {/* Debug Console */}
            {self.state.error && (
              <div className="text-left bg-black/50 rounded-2xl p-4 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 max-h-48 overflow-y-auto shadow-inner">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-red-400 font-bold uppercase tracking-wider text-[10px]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Error Details</span>
                </div>
                <p className="font-bold text-red-300">{self.state.error.toString()}</p>
                {self.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                    {self.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return self.props.children;
  }
}
