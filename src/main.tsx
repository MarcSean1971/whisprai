
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize CSS variables for safe areas
document.documentElement.style.setProperty(
  '--sab', 
  window.getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0px'
);

createRoot(document.getElementById("root")!).render(<App />);
