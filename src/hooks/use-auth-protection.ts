
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAuthProtection() {
  const navigate = useNavigate();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      try {
        console.log('Fetching auth session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          throw error;
        }
        
        if (!session) {
          console.log('No session found, will redirect to auth');
          throw new Error('No active session');
        }
        
        console.log('Session fetched successfully:', session.user?.id);
        return session;
      } catch (error) {
        console.error('Session fetch error:', error);
        throw error;
      } finally {
        setHasCheckedSession(true);
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (hasCheckedSession && !isLoading && !session) {
      console.log('No session found after check, redirecting to auth');
      navigate('/auth', { replace: true });
    }
  }, [session, isLoading, navigate, hasCheckedSession]);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, changedSession) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        navigate('/auth', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { 
    isLoading, 
    isAuthenticated: !!session,
    session,
    error 
  };
}
