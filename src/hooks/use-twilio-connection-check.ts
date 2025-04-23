
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to test Twilio connectivity by attempting to retrieve TURN credentials.
 */
export function useTwilioConnectionCheck() {
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-turn-credentials", {
        body: { timestamp: Date.now() }
      });
      setIsChecking(false);
      if (error) {
        console.error("[TwilioConnectionCheck] Error getting TURN credentials:", error);
        return false;
      }
      if (!data?.ice_servers || !Array.isArray(data.ice_servers)) {
        console.error("[TwilioConnectionCheck] Invalid TURN credentials response.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("[TwilioConnectionCheck] Exception:", err);
      setIsChecking(false);
      return false;
    }
  };

  return { checkConnection, isChecking };
}
