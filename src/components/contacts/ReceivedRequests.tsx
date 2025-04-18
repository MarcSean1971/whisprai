import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface ContactRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  recipient_email: string;
  status: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function ReceivedRequests() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['received-requests'],
    queryFn: async () => {
      console.log('Fetching received requests...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('Not authenticated');
      }

      // First, get all pending requests where the current user is the recipient
      const { data: requestsData, error: requestsError } = await supabase
        .from('contact_requests')
        .select('id, sender_id, recipient_id, recipient_email, status')
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        throw requestsError;
      }

      console.log(`Found ${requestsData?.length || 0} pending requests`);
      if (!requestsData || requestsData.length === 0) return [];

      // For each request, fetch the sender's profile
      const requestsWithProfiles = await Promise.all(
        requestsData.map(async (request) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', request.sender_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile for sender:', request.sender_id, profileError);
          }

          return {
            ...request,
            profile: profileError ? null : profile
          };
        })
      );

      console.log('Successfully fetched requests with profiles');
      return requestsWithProfiles;
    },
  });

  const handleRequest = async (requestId: string, accept: boolean) => {
    console.log(`Processing request ${requestId}, action: ${accept ? 'accept' : 'reject'}`);
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const { data: request } = await supabase
        .from('contact_requests')
        .select('sender_id')
        .eq('id', requestId)
        .single();

      if (!request) {
        console.error('Request not found:', requestId);
        throw new Error('Request not found');
      }

      if (accept) {
        console.log('Creating bidirectional contact connection...');
        const { error: insertError } = await supabase
          .from('contacts')
          .insert([
            {
              user_id: request.sender_id,
              contact_id: (await supabase.auth.getUser()).data.user?.id,
            },
          ]);

        if (insertError) {
          console.error('Error creating contact connection:', insertError);
          throw insertError;
        }
      }

      const { error: updateError } = await supabase
        .from('contact_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
        throw updateError;
      }

      console.log(`Request ${requestId} successfully ${accept ? 'accepted' : 'rejected'}`);
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
      {requests?.map((request) => (
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
      ))}
      {(!requests || requests.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No pending received requests
        </div>
      )}
    </div>
  );
}
