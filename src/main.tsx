import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, refresh needed!')
  },
  onOfflineReady() {
    console.log('App ready to work offline!')
  },
})



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position='top-right'/>
    <App/>
  </StrictMode>,
)
