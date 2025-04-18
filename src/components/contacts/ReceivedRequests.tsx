import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface ContactRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: string;
  profiles: Profile;
}

export function ReceivedRequests() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const { data: requests, isLoading, refetch } = useQuery<ContactRequest[]>({
    queryKey: ['received-requests'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No authenticated user found');
          toast.error('Authentication error');
          throw new Error('Not authenticated');
        }

        const { data: requestsData, error: requestsError } = await supabase
          .from('contact_requests')
          .select(`
            id,
            sender_id,
            recipient_id,
            status,
            profiles!contact_requests_sender_id_fkey (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('recipient_id', user.id)
          .eq('status', 'pending');

        if (requestsError) {
          console.error('Error fetching requests:', requestsError);
          toast.error(`Error fetching requests: ${requestsError.message}`);
          throw requestsError;
        }

        if (!requestsData) return [];

        return requestsData.map(request => ({
          ...request,
          profiles: request.profiles || {
            first_name: null,
            last_name: null,
            avatar_url: null
          }
        }));
      } catch (error) {
        console.error('Failed to fetch requests:', error);
        toast.error('Failed to fetch requests');
        throw error;
      }
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading requests...</div>;
  }

  const handleRequest = async (requestId: string, accept: boolean) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const { data: request } = await supabase
        .from('contact_requests')
        .select('sender_id')
        .eq('id', requestId)
        .single();

      if (!request) {
        throw new Error('Request not found');
      }

      if (accept) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error: insertError } = await supabase
          .from('contacts')
          .insert([
            { user_id: user.id, contact_id: request.sender_id }
          ]);

        if (insertError) throw insertError;
      }

      const { error: updateError } = await supabase
        .from('contact_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast.success(`Request ${accept ? 'accepted' : 'rejected'} successfully`);
      refetch();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-2">
      {requests?.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={request.profiles.avatar_url || undefined} />
              <AvatarFallback>
                {request.profiles.first_name?.[0] || request.sender_id[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {request.profiles.first_name
                  ? `${request.profiles.first_name} ${request.profiles.last_name || ''}`
                  : request.sender_id}
              </div>
              <div className="text-sm text-muted-foreground">
                Wants to connect with you
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRequest(request.id, true)}
              disabled={processingIds.has(request.id)}
            >
              Accept
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRequest(request.id, false)}
              disabled={processingIds.has(request.id)}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
      {(!requests || requests.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No pending received requests
        </div>
      )}
    </div>
  );
}
