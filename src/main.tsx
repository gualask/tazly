import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { NewTab } from '@/NewTab'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root non trovato')

createRoot(rootElement).render(
  <StrictMode>
    <NewTab />
  </StrictMode>,
)
