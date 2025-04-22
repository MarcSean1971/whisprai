
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentUserId() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setCurrentUserId(data.user?.id || null);
      } catch (err) {
        console.error('Error fetching user ID:', err);
        setError(err instanceof Error ? err : new Error('Failed to get user information'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserId();
  }, []);

  return { currentUserId, isLoading, error };
}
