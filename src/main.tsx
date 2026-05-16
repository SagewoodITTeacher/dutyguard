import { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[DutyGuard] Booting main entry point...');

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DutyGuard] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#020617', 
          color: '#ef4444', 
          padding: '40px', 
          fontFamily: 'sans-serif', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ color: 'white', marginBottom: '16px', fontSize: '24px' }}>Interface Deployment Failure</h1>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>The tactical interface encountered a critical runtime exception.</p>
            <div style={{ 
              background: '#0f172a', 
              padding: '20px', 
              borderRadius: '16px', 
              fontSize: '12px', 
              color: '#facc15', 
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '400px',
              border: '1px solid #1e293b'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{this.state.error?.name}: {this.state.error?.message}</p>
              <pre style={{ margin: 0 }}>{this.state.error?.stack}</pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '32px',
                padding: '12px 24px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reboot Matrix
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[DutyGuard] Critical: Root element not found');
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    console.log('[DutyGuard] React tree mounted successfully');
  } catch (err) {
    console.error('[DutyGuard] Mount failed:', err);
  }
}
