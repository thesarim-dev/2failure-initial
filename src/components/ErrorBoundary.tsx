import { Component, type ReactNode } from 'react';
import { reportError } from '../lib/errorTracking';

/**
 * Last line of defence: if a screen crashes, show a friendly message with a
 * reload button instead of a blank page, and report it. Saved progress is not
 * affected (sets waiting to sync stay on the phone).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    reportError(error, { componentStack: info.componentStack ?? undefined });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#1a1a1a',
          color: '#f4f4f0',
          fontFamily: 'system-ui, sans-serif'
        }}>
        <div style={{ fontSize: '2.5rem' }} aria-hidden="true">
          🔧
        </div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Something went wrong</h1>
        <p style={{ opacity: 0.75, maxWidth: '22rem', lineHeight: 1.4 }}>
          Your progress is safe. Reload to keep training.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '0.8rem 1.6rem',
            borderRadius: '0.9rem',
            border: 'none',
            fontWeight: 900,
            fontSize: '1rem',
            background: '#c8f032',
            color: '#0c0f02'
          }}>
          Reload
        </button>
      </div>
    );
  }
}
