import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import './i18n'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { GroupProvider } from './contexts/GroupContext'
import { DialogProvider } from './contexts/DialogContext'
import { installGlobalHaptic } from './utils/haptic'
import { PWARegister } from './components/PWARegister'

installGlobalHaptic()

if (import.meta.env.VITE_APP_ENV === 'production') {
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  s.setAttribute('data-cf-beacon', '{"token":"a372bca91b9e4934b5d5de2785c009cc"}')
  document.head.appendChild(s)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
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
        <PWARegister />
        <DialogProvider>
          <AuthProvider>
            <GroupProvider>
              <App />
            </GroupProvider>
          </AuthProvider>
        </DialogProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
