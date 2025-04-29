
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useAuthCheck() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check failed:', error);
          setAuthError(error);
          toast.error('Authentication error: ' + error.message);
        } else {
          setUserId(data.user?.id || null);
          console.log('User authenticated in useMessages:', data.user?.id);
          setAuthError(null);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setAuthError(err instanceof Error ? err : new Error('Authentication check failed'));
      } finally {
        setIsAuthChecked(true);
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in useMessages:', event);
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      
      // If auth state changes, invalidate messages to refetch with new user context
      if (newUserId !== userId) {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient, userId]);

  return { isAuthChecked, userId, authError };
}
