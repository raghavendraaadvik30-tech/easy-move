import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppWrapper } from './components/AppWrapper'
import './styles-premium.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><AppWrapper /></StrictMode>
)
