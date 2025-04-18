
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequestListItem } from "./RequestListItem";
import { useRequestHandler } from "@/hooks/use-request-handler";
import { ContactProfileDialog } from "./ContactProfileDialog";
import { useState } from "react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tagline: string | null;
  birthdate: string | null;
}

interface ContactRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: string;
  profile?: Profile;
}

export function ReceivedRequests() {
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['received-requests'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Not authenticated');
        }

        console.log('Fetching requests for user ID:', user.id);
        
        const { data: requestsData, error: requestsError } = await supabase
          .from('contact_requests')
          .select('id, sender_id, recipient_id, status')
          .eq('recipient_id', user.id)
          .eq('status', 'pending');

        if (requestsError) {
          console.error('Error fetching requests:', requestsError);
          throw new Error(`Error fetching requests: ${requestsError.message}`);
        }

        if (!requestsData || requestsData.length === 0) {
          return [] as ContactRequest[];
        }

        const senderIds = requestsData.map(request => request.sender_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, bio, tagline, birthdate')
          .in('id', senderIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw new Error(`Error fetching profiles: ${profilesError.message}`);
        }

        const profilesMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }

        return requestsData.map(request => ({
          ...request,
          profile: profilesMap.get(request.sender_id) || {
            first_name: null,
            last_name: null,
            avatar_url: null,
            bio: null,
            tagline: null,
            birthdate: null
          }
        })) as ContactRequest[];

      } catch (error) {
        console.error('Failed to fetch requests:', error);
        return [] as ContactRequest[];
      }
    },
  });

  const { processingIds, handleRequest } = useRequestHandler(refetch);

  if (isLoading) {
    return <div className="p-4">Loading requests...</div>;
  }

  return (
    <div className="space-y-2">
      {requests && requests.length > 0 ? (
        requests.map((request) => (
          <RequestListItem
            key={request.id}
            id={request.id}
            sender_id={request.sender_id}
            profile={request.profile}
            isProcessing={processingIds.has(request.id)}
            onAccept={(id) => handleRequest(id, true)}
            onReject={(id) => handleRequest(id, false)}
            onViewProfile={() => setSelectedRequest(request)}
          />
        ))
      ) : (
        <div className="text-center p-4 text-muted-foreground">
          No pending received requests
        </div>
      )}

      <ContactProfileDialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
        contact={selectedRequest ? {
          id: selectedRequest.id,
          email: `contact-${selectedRequest.sender_id}@example.com`,
          profile: selectedRequest.profile
        } : undefined}
      />
    </div>
  );
}
