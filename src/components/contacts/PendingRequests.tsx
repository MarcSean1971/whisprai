import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ContactRequest {
  id: string;
  sender_id: string;
  recipient_email: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export function PendingRequests() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current authenticated user:', user);
      setUserEmail(user?.email || null);
    };
    
    fetchUserEmail();
  }, []);

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        throw new Error('Not authenticated');
      }
      console.log('Fetching requests for user:', user.email);

      const { data: requestsData, error: requestsError } = await supabase
        .from('contact_requests')
        .select(`
          id,
          sender_id,
          recipient_email,
          status,
          sender:profiles!contact_requests_sender_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .eq('recipient_email', user.email);

      if (requestsError) {
        console.error('Error fetching contact requests:', requestsError);
        throw requestsError;
      }
      
      console.log('Contact requests raw data:', requestsData);

      if (!requestsData || requestsData.length === 0) {
        console.log('No pending requests found');
        return [];
      }

      const processedRequests: ContactRequest[] = requestsData.map((request) => ({
        id: request.id,
        sender_id: request.sender_id,
        recipient_email: request.recipient_email,
        status: request.status,
        first_name: request.sender?.first_name || null,
        last_name: request.sender?.last_name || null,
        avatar_url: request.sender?.avatar_url || null
      }));

      console.log('Final processed requests:', processedRequests);
      return processedRequests;
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

      if (!request) throw new Error('Request not found');

      if (accept) {
        const { error: insertError } = await supabase
          .from('contacts')
          .insert([
            {
              user_id: request.sender_id,
              contact_id: (await supabase.auth.getUser()).data.user?.id,
            },
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
      toast.error('Failed to process request');
      console.error('Error processing request:', error);
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
      {requests?.map((request) => {
        const isReceived = request.recipient_email === userEmail;
        
        return (
          <div key={request.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={request.avatar_url || undefined} />
                <AvatarFallback>
                  {request.first_name?.[0] || request.sender_id[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {request.first_name
                    ? `${request.first_name} ${request.last_name || ''}`
                    : request.sender_id}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isReceived ? 'Wants to connect with you' : `Sent to ${request.recipient_email}`}
                </div>
              </div>
            </div>
            {isReceived && (
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
            )}
          </div>
        );
      })}
      {(!requests || requests.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No pending requests
        </div>
      )}
    </div>
  );
}
