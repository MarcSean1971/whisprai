
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRequestCounts() {
  return useQuery({
    queryKey: ['request-counts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get sent requests count
      const { count: sentCount, error: sentError } = await supabase
        .from('contact_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Get received requests count
      const { count: receivedCount, error: receivedError } = await supabase
        .from('contact_requests')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      return {
        sent: sentCount || 0,
        received: receivedCount || 0
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
