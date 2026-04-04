import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { GOOGLE_OAUTH_CLIENT_ID } from './config.js'
import './index.css'

if (import.meta.env.DEV && !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.info(
    '[auth] Using default Google web client id. Set VITE_GOOGLE_CLIENT_ID in .env and add this origin in Google Cloud Console (Authorized JavaScript origins), e.g. http://localhost:5173'
  )
}

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_OAUTH_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)
