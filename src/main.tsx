import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppWrapper } from './components/AppWrapper'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><AppWrapper /></StrictMode>
)
