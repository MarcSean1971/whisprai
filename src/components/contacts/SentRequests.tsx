
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { ContactProfileDialog } from "@/components/contacts/ContactProfileDialog";
import { SentRequestListItem } from "./SentRequestListItem";

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
  recipient_email: string;
  status: string;
  recipient: {
    profile: Profile | null;
  } | null;
}

export function SentRequests() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    email: string;
    profile: Profile | null;
  } | null>(null);
  
  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['sent-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contact_requests')
        .select(`
          id,
          recipient_email,
          status,
          recipient:recipient_id (
            profile:profiles (
              first_name,
              last_name,
              avatar_url,
              bio,
              tagline,
              birthdate
            )
          )
        `)
        .eq('status', 'pending')
        .eq('sender_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const handleWithdraw = async (requestId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: 'withdrawn' })
        .eq('id', requestId);

      if (error) throw error;
      
      toast.success('Request withdrawn successfully');
      refetch();
    } catch (error) {
      console.error('Error withdrawing request:', error);
      toast.error('Failed to withdraw request');
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
        <SentRequestListItem
          key={request.id}
          id={request.id}
          recipientEmail={request.recipient_email}
          profile={request.recipient?.profile || null}
          isProcessing={processingIds.has(request.id)}
          onWithdraw={handleWithdraw}
          onViewProfile={() => {
            setSelectedContact({
              id: '',  // We don't have access to the ID directly
              email: request.recipient_email,
              profile: request.recipient?.profile || null
            });
          }}
        />
      ))}
      {(!requests || requests.length === 0) && (
        <div className="text-center p-4 text-muted-foreground">
          No pending sent requests
        </div>
      )}
      <ContactProfileDialog
        open={selectedContact !== null}
        onOpenChange={(open) => !open && setSelectedContact(null)}
        contact={selectedContact ? {
          id: selectedContact.id,
          email: selectedContact.email,
          profile: selectedContact.profile
        } : undefined}
      />
    </div>
  );
}
