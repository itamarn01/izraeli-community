import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
