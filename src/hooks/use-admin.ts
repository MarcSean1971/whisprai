
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdmin = () => {
  const { data: isAdmin, isLoading, error } = useQuery({
    queryKey: ['admin-status'],
    queryFn: async () => {
      console.log('Checking admin status...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found');
        return false;
      }
      
      console.log('Checking email:', user.email);
      const isAdminUser = user.email === 'marc.s@seelenbinderconsulting.com';
      console.log('Is admin?', isAdminUser);
      return isAdminUser;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
    staleTime: 1000 * 30, // Cache for 30 seconds
  });

  if (error) {
    console.error('Error checking admin status:', error);
  }

  return { 
    isAdmin: Boolean(isAdmin), 
    loading: isLoading,
    error 
  };
};
