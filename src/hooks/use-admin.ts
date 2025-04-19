
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useAdmin = () => {
  const { data: isAdmin, isLoading: loading } = useQuery({
    queryKey: ['admin-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email === 'marc.s@seelenbinderconsulting.com';
    },
    initialData: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return { isAdmin, loading };
};
