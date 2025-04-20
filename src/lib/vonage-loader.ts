
/**
 * Dynamically loads the Vonage (OpenTok) Client SDK script
 */
export function loadVonageScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.OT) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.opentok.com/v2/js/opentok.min.js';
    script.async = true;
    
    script.onload = () => {
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Vonage Client SDK'));
    };
    
    document.head.appendChild(script);
  });
}
