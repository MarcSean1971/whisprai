
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";

interface OnlineUser {
  id: string;
  last_seen_at: string;
}

export function useUserPresence(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);
  const { profile } = useProfile();
  
  useEffect(() => {
    if (!userId || !profile) return;
    
    // First check the current status using a REST call instead of typed client
    const checkInitialStatus = async () => {
      const response = await fetch(`https://vmwiigfhjvwecnlwppnj.supabase.co/rest/v1/user_presence?user_id=eq.${userId}`, {
        headers: {
          'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd2lpZ2ZoanZ3ZWNubHdwcG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NDE1NzEsImV4cCI6MjA2MDUxNzU3MX0.bHAZN8-ToQfcxPfhHgLQbUnXXwBkpmachGanLaZpwPo",
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd2lpZ2ZoanZ3ZWNubHdwcG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NDE1NzEsImV4cCI6MjA2MDUxNzU3MX0.bHAZN8-ToQfcxPfhHgLQbUnXXwBkpmachGanLaZpwPo`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Consider online if seen in the last 2 minutes
          const lastSeen = new Date(data[0].last_seen_at);
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          setIsOnline(lastSeen > twoMinutesAgo);
        }
      }
    };
    
    checkInitialStatus();
    
    // Update our own presence
    const updateMyPresence = async () => {
      // Use the REST API to avoid type issues
      await fetch(`https://vmwiigfhjvwecnlwppnj.supabase.co/rest/v1/user_presence`, {
        method: 'POST',
        headers: {
          'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd2lpZ2ZoanZ3ZWNubHdwcG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NDE1NzEsImV4cCI6MjA2MDUxNzU3MX0.bHAZN8-ToQfcxPfhHgLQbUnXXwBkpmachGanLaZpwPo",
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd2lpZ2ZoanZ3ZWNubHdwcG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NDE1NzEsImV4cCI6MjA2MDUxNzU3MX0.bHAZN8-ToQfcxPfhHgLQbUnXXwBkpmachGanLaZpwPo`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: profile.id,
          last_seen_at: new Date().toISOString()
        })
      });
    };
    
    // Update presence immediately and every 30 seconds
    updateMyPresence();
    const presenceInterval = setInterval(updateMyPresence, 30000);
    
    // Subscribe to realtime changes for the specific user
    const channel = supabase
      .channel(`presence_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const userData = payload.new as OnlineUser;
          const lastSeen = new Date(userData.last_seen_at);
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          setIsOnline(lastSeen > twoMinutesAgo);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(presenceInterval);
    };
  }, [userId, profile]);
  
  return { isOnline };
}
