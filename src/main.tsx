import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LoginPage from './login'
import RegisterPage from './register'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <LoginPage/>
   <RegisterPage/>
  </StrictMode>,
)
