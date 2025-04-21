
/**
 * Dynamically loads the Vonage (OpenTok) Client SDK script
 */
export function loadVonageScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.OT) {
      console.log("[Vonage Loader] SDK already loaded");
      resolve();
      return;
    }

    // Check if script is already in the process of loading
    const existingScript = document.querySelector('script[src*="opentok.min.js"]');
    if (existingScript) {
      console.log("[Vonage Loader] SDK script already in DOM, waiting for load");
      existingScript.addEventListener('load', () => {
        if (window.OT) {
          console.log("[Vonage Loader] SDK loaded from existing script");
          resolve();
        } else {
          reject(new Error('Vonage SDK not available after script load'));
        }
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load existing Vonage SDK script'));
      });
      return;
    }

    console.log("[Vonage Loader] Adding SDK script to DOM");
    const script = document.createElement('script');
    script.src = 'https://static.opentok.com/v2/js/opentok.min.js';
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      // Verify that the SDK is actually available
      if (window.OT) {
        console.log("[Vonage Loader] SDK loaded successfully");
        resolve();
      } else {
        console.error("[Vonage Loader] Script loaded but SDK not available");
        reject(new Error('Vonage SDK not available after script load'));
      }
    };
    
    script.onerror = (error) => {
      console.error("[Vonage Loader] Script loading error:", error);
      reject(new Error('Failed to load Vonage Client SDK'));
    };
    
    document.head.appendChild(script);
  });
}

// Add global type definition for OpenTok in window object
declare global {
  interface Window {
    OT: any;
  }
}
