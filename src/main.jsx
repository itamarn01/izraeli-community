import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import AccessibilityWidget from './components/accessibility/AccessibilityWidget.jsx';
import { useA11yPrefs } from './lib/a11yPrefs.js';
import './index.css';

function Root() {
  const { reduceMotion } = useA11yPrefs();
  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                style: { fontFamily: 'Rubik, Alef, sans-serif', direction: 'rtl' },
                success: { iconTheme: { primary: '#AFC072', secondary: '#fff' } },
                error: { iconTheme: { primary: '#CB8333', secondary: '#fff' } },
              }}
            />
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
      <AccessibilityWidget />
    </MotionConfig>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
