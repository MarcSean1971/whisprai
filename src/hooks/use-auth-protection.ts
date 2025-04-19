
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAuthProtection() {
  const navigate = useNavigate();
  
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      console.log('Fetching auth session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
        throw error;
      }
      
      console.log('Session fetched:', session ? 'exists' : 'none');
      return session;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isLoading && !session) {
      console.log('No session found, redirecting to auth');
      navigate('/auth', { replace: true });
    }
  }, [session, isLoading, navigate]);

  return { 
    isLoading, 
    isAuthenticated: !!session,
    session,
    error 
  };
}
