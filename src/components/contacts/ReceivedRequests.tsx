
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
          throw new Error('Not authenticated');
        }

        console.log('Fetching requests for user ID:', user.id);
        
        // Get contact requests for the current user
        const { data: requestsData, error: requestsError } = await supabase
          .from('contact_requests')
          .select('id, sender_id, recipient_id, status')
          .eq('recipient_id', user.id)
          .eq('status', 'pending');

        if (requestsError) {
          console.error('Error fetching requests:', requestsError);
          throw new Error(`Error fetching requests: ${requestsError.message}`);
        }

        console.log('Requests data:', requestsData);

        if (!requestsData || requestsData.length === 0) {
          return [] as ContactRequest[];
        }

        // Get profiles for the senders
        const senderIds = requestsData.map(request => request.sender_id);
        console.log('Fetching profiles for sender IDs:', senderIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', senderIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw new Error(`Error fetching profiles: ${profilesError.message}`);
        }

        console.log('Profiles data:', profilesData);

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
        toast.error(error instanceof Error ? error.message : 'Failed to fetch requests');
        return [] as ContactRequest[];
      }
    },
  });

  const handleRequest = async (requestId: string, accept: boolean) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      console.log(`Processing request ${requestId}, accept: ${accept}`);
      
      const { data: request, error: fetchError } = await supabase
        .from('contact_requests')
        .select('sender_id')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        console.error('Error fetching request details:', fetchError);
        throw new Error('Request not found');
      }

      if (accept) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        console.log(`Creating contact: user_id=${user.id}, contact_id=${request.sender_id}`);
        
        const { error: insertError } = await supabase
          .from('contacts')
          .insert([
            { user_id: user.id, contact_id: request.sender_id }
          ]);

        if (insertError) {
          console.error('Error creating contact:', insertError);
          throw insertError;
        }
      }

      console.log(`Updating request status to: ${accept ? 'accepted' : 'rejected'}`);
      
      const { error: updateError } = await supabase
        .from('contact_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
      }

      toast.success(`Request ${accept ? 'accepted' : 'rejected'} successfully`);
      refetch();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
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
