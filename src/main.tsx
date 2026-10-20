import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppWrapper } from './components/AppWrapper'
import './styles.css'
import './styles-enhance.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><AppWrapper /></StrictMode>
)
