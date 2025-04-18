
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
  profile?: Profile;
}

export function ReceivedRequests() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['received-requests'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Authentication error');
          return [] as ContactRequest[];
        }

        // Get contact requests for the current user
        const { data: requestsData, error: requestsError } = await supabase
          .from('contact_requests')
          .select('id, sender_id, recipient_id, status')
          .eq('recipient_id', user.id)
          .eq('status', 'pending');

        if (requestsError) {
          console.error('Error fetching requests:', requestsError);
          toast.error('Error fetching requests');
          return [] as ContactRequest[];
        }

        if (!requestsData || requestsData.length === 0) {
          return [] as ContactRequest[];
        }

        // Get profiles for the senders
        const senderIds = requestsData.map(request => request.sender_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', senderIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          toast.error('Error fetching profiles');
        }

        // Create a map for quick profile lookup
        const profilesMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, {
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url
            });
          });
        }

        // Combine the data
        return requestsData.map(request => ({
          id: request.id,
          sender_id: request.sender_id,
          recipient_id: request.recipient_id,
          status: request.status,
          profile: profilesMap.get(request.sender_id) || {
            first_name: null,
            last_name: null,
            avatar_url: null
          }
        })) as ContactRequest[];

      } catch (error) {
        console.error('Failed to fetch requests:', error);
        toast.error('Failed to fetch requests');
        return [] as ContactRequest[];
      }
    },
  });

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

  if (isLoading) {
    return <div className="p-4">Loading requests...</div>;
  }

  return (
    <div className="space-y-2">
      {requests && requests.length > 0 ? (
        requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={request.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {request.profile?.first_name?.[0] || request.sender_id[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {request.profile?.first_name
                    ? `${request.profile.first_name} ${request.profile.last_name || ''}`
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
        ))
      ) : (
        <div className="text-center p-4 text-muted-foreground">
          No pending received requests
        </div>
      )}
    </div>
  );
}
