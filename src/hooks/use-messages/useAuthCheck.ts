
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
    let isMounted = true;
    console.log('useAuthCheck: Starting auth check process');
    
    // First set up auth state listener to catch any changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in useAuthCheck:', event, 'User ID:', session?.user?.id);
      
      if (!isMounted) return;
      
      const newUserId = session?.user?.id || null;
      
      // Only update if the ID has changed to avoid unnecessary re-renders
      if (newUserId !== userId) {
        console.log('User ID changed from', userId, 'to', newUserId);
        setUserId(newUserId);
        
        // If auth state changes, invalidate messages to refetch with new user context
        if (queryClient && newUserId !== userId) {
          console.log('Invalidating messages queries due to auth change');
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      }
    });
    
    // Then check for existing session
    const checkAuth = async () => {
      try {
        console.log('Checking existing auth session');
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth check failed:', error);
          if (isMounted) {
            setAuthError(error);
            setIsAuthChecked(true);
            toast.error('Authentication error: ' + error.message);
          }
          return;
        } 
        
        const currentUserId = data.user?.id || null;
        console.log('Auth check completed. User ID:', currentUserId);
        
        if (isMounted) {
          setUserId(currentUserId);
          setAuthError(null);
          setIsAuthChecked(true);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        if (isMounted) {
          setAuthError(err instanceof Error ? err : new Error('Authentication check failed'));
          setIsAuthChecked(true);
        }
      }
    };
    
    checkAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
      console.log('useAuthCheck: Cleaned up auth listener');
    };
  }, [queryClient, userId]);

  return { isAuthChecked, userId, authError };
}
