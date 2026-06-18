import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster 
      position="top-center" 
      reverseOrder={false} 
      containerStyle={{
        top: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
      }}
      toastOptions={{
        style: {
          background: '#ffffff',
          color: '#1A1A2E',
          border: '3px solid #1A1A2E',
          borderRadius: '14px',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: '700',
          fontSize: '14px',
          boxShadow: '4px 4px 0px #1A1A2E',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#0A7A4A',
            secondary: '#EAFAF3',
          },
        },
        error: {
          iconTheme: {
            primary: '#FF6B35',
            secondary: '#FFF0EA',
          },
        },
      }}
    />
    <App />
  </StrictMode>,
)
