import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Créer le store avec le middleware devtools pour le débogage
export const useStore = create(devtools((set) => ({
  // état et actions du store
})));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
