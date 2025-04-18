
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface ContactRequest {
  id: string;
  recipient_email: string;
  status: string;
}

export function SentRequests() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['sent-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contact_requests')
        .select('id, recipient_email, status')
        .eq('status', 'pending')
        .eq('sender_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading requests...</div>;
  }

  return (
    <div className="space-y-2">
      {requests?.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {request.recipient_email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{request.recipient_email}</div>
              <div className="text-sm text-muted-foreground">
                Request pending
              </div>
            </div>
          </div>
        </div>
      ))}
      {(!requests || requests.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No pending sent requests
        </div>
      )}
    </div>
  );
}
