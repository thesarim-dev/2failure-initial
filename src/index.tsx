import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <AuthProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </AuthProvider>
);