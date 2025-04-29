
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MessageUserAuthProps {
  onUserIdChange: (userId: string | null) => void;
  onError: (error: Error) => void;
}

export function MessageUserAuth({ onUserIdChange, onError }: MessageUserAuthProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUserId = async () => {
      try {
        setIsLoading(true);
        console.log("MessageUserAuth: Fetching user ID");
        
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("MessageUserAuth: Error fetching user ID:", error);
          if (isMounted) {
            onError(error);
            setIsLoading(false);
          }
          return;
        }
        
        const userId = data?.user?.id || null;
        console.log("MessageUserAuth: User ID fetched successfully:", userId);
        
        if (isMounted) {
          onUserIdChange(userId);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user ID:', err);
        if (isMounted) {
          onError(err instanceof Error ? err : new Error('Failed to get user information'));
          setIsLoading(false);
        }
      }
    };
    
    fetchUserId();
    
    // Also subscribe to auth changes to keep user ID updated
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      const userId = session?.user?.id || null;
      console.log("New user ID from auth state change:", userId);
      
      if (isMounted) {
        onUserIdChange(userId);
      }
    });
    
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [onUserIdChange, onError]);

  return isLoading;
}
