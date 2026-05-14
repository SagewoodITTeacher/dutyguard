import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[DutyGuard] Booting main entry point...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[DutyGuard] Root element not found');
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('[DutyGuard] React tree mounted successfully');
  } catch (err) {
    console.error('[DutyGuard] CRITICAL: Initial render failed:', err);
    rootElement.innerHTML = `
      <div style="background: #020617; color: #ef4444; padding: 40px; font-family: sans-serif; height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
        <div>
          <h1 style="color: white; margin-bottom: 16px;">Critical System Deficit</h1>
          <p style="color: #94a3b8; margin-bottom: 24px;">The tactical interface failed to deploy. Check system logs for the payload trace.</p>
          <pre style="background: #0f172a; padding: 20px; border-radius: 16px; font-size: 12px; color: #facc15; text-align: left;">${err instanceof Error ? err.stack : String(err)}</pre>
        </div>
      </div>
    `;
  }
}
