import { Component } from 'react';
import { useLocation } from 'react-router-dom';

import type { ErrorInfo, ReactNode } from 'react';

interface BoundaryState {
  failed: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Route render failed', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }

    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center text-sm text-slate-700"
        role="alert"
      >
        <p>Не удалось показать страницу. Обновите её.</p>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-white"
          onClick={() => window.location.reload()}
        >
          Обновить страницу
        </button>
      </main>
    );
  }
}

/** Смена пути сбрасывает ошибку, не пересоздавая дерево маршрутов. */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}
