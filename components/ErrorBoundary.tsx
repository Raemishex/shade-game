"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark p-6">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="text-5xl">🦊</div>
            <h1 className="text-xl font-bold text-cream">
              Xəta baş verdi
            </h1>
            <p className="text-cream/60 text-sm">
              {this.state.error?.message || "Bilinməyən xəta"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/home";
              }}
              className="px-6 py-3 bg-gold/20 text-gold rounded-xl border border-gold/30 hover:bg-gold/30 transition-colors"
            >
              Ana səhifəyə qayıt
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="block mx-auto text-cream/40 text-sm hover:text-cream/60 transition-colors"
            >
              Səhifəni yenilə
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
