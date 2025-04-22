
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MessageUserAuthProps {
  onUserIdChange: (userId: string | null) => void;
  onError: (error: Error) => void;
}

export function MessageUserAuth({ onUserIdChange, onError }: MessageUserAuthProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        onUserIdChange(data.user?.id || null);
      } catch (err) {
        console.error('Error fetching user ID:', err);
        onError(err instanceof Error ? err : new Error('Failed to get user information'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserId();
  }, [onUserIdChange, onError]);

  return null;
}
