
import { useEffect, useRef } from "react";
import { loadVonageScript } from "@/lib/vonage-loader";
import { VonageError } from "./types";

export function useVonageScript(setError: (e: VonageError) => void) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!scriptLoaded.current) {
      loadVonageScript()
        .then(() => {
          scriptLoaded.current = true;
        })
        .catch((err) => {
          setError({
            type: 'INITIALIZATION_ERROR',
            message: "Failed to load Vonage SDK: " + err.message,
            originalError: err
          });
        });
    }
  }, [setError]);

  return {
    scriptLoaded: scriptLoaded.current
  };
}
