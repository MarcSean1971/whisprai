import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MessageUserAuthProps {
  onUserIdChange: (userId: string | null) => void;
  onError: (error: Error) => void;
}

export function MessageUserAuth({ onUserIdChange, onError }: MessageUserAuthProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setIsLoading(true);
        console.log("MessageUserAuth: Fetching user ID");
        
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("MessageUserAuth: Error fetching user ID:", error);
          throw error;
        }
        
        console.log("MessageUserAuth: User ID fetched successfully:", data.user?.id);
        onUserIdChange(data.user?.id || null);
      } catch (err) {
        console.error('Error fetching user ID:', err);
        onError(err instanceof Error ? err : new Error('Failed to get user information'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserId();
    
    // Also subscribe to auth changes to keep user ID updated
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      onUserIdChange(session?.user?.id || null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [onUserIdChange, onError]);

  return null;
}
