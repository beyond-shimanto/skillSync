import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import { ApiProvider } from './ApiContext.jsx'
import {BrowserRouter} from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ApiProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        </ApiProvider>
    </AuthProvider>
  </StrictMode>,
)
