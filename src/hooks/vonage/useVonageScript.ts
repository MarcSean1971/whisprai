
import { useEffect, useRef, useState } from "react";
import { loadVonageScript } from "@/lib/vonage-loader";
import { VonageError } from "./types";
import { toast } from "sonner";

export function useVonageScript(setError: (e: VonageError) => void) {
  const scriptLoaded = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadAttempts = useRef(0);
  const maxLoadAttempts = 3;

  useEffect(() => {
    if (scriptLoaded.current || isLoading) {
      return;
    }

    const loadScript = async () => {
      if (loadAttempts.current >= maxLoadAttempts) {
        setError({
          type: 'INITIALIZATION_ERROR',
          message: `Failed to load Vonage SDK after ${maxLoadAttempts} attempts`,
        });
        return;
      }

      setIsLoading(true);
      loadAttempts.current += 1;

      try {
        console.log("[Vonage Script] Loading Vonage SDK (attempt", loadAttempts.current, ")");
        await loadVonageScript();
        
        if (window.OT) {
          console.log("[Vonage Script] Vonage SDK loaded successfully");
          scriptLoaded.current = true;
          // Test basic SDK functionality
          const version = window.OT.version;
          console.log("[Vonage Script] SDK version:", version);
        } else {
          throw new Error("Vonage SDK not available after loading");
        }
      } catch (err) {
        console.error("[Vonage Script] Error loading SDK:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        
        // If we haven't reached max attempts, try again after delay
        if (loadAttempts.current < maxLoadAttempts) {
          console.log("[Vonage Script] Retrying in 2 seconds...");
          setTimeout(loadScript, 2000);
        } else {
          setError({
            type: 'INITIALIZATION_ERROR',
            message: "Failed to load Vonage SDK: " + errorMessage,
            originalError: err
          });
          toast.error("Could not load call service");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadScript();
  }, [setError, isLoading]);

  return {
    scriptLoaded: scriptLoaded.current,
    isLoading
  };
}
