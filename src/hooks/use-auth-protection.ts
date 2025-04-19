
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAuthProtection() {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isLoading && !session && !isRedirecting) {
      console.log('No session found, redirecting to auth');
      setIsRedirecting(true);
      navigate('/auth', { replace: true });
    }
  }, [session, isLoading, navigate, isRedirecting]);

  return { 
    isLoading, 
    isAuthenticated: !!session,
    session 
  };
}
