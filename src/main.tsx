
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

// Add error handling to catch any rendering errors
try {
  console.log('Initializing application...');
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found in the DOM");
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('Application rendered successfully');
  }
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Create a basic error display if the app fails to render
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Something went wrong</h2>
        <p>The application failed to load. Please check the console for details.</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}
