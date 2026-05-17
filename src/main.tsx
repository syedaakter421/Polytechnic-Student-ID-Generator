import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign WebSocket errors that occur due to HMR being disabled in this environment
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WebSocket') || (typeof event.reason === 'string' && event.reason.includes('WebSocket'))) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (event.message?.includes('WebSocket')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
