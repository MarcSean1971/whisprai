
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to provide a function to fetch a user's profile name and set it in state.
 */
export function useCallParticipantNames() {
  const fetchProfileName = useCallback(async (userId: string, setName: (name: string) => void) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      if (error) throw error;
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      setName(fullName || 'User');
    } catch (error) {
      setName('User');
    }
  }, []);

  return { fetchProfileName };
}
