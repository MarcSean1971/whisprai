
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ContactRequest {
  id: string;
  recipient_email: string;
  status: string;
}

export function SentRequests() {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const { data: requests, isLoading, refetch } = useQuery({
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleWithdraw(request.id)}
            disabled={processingIds.has(request.id)}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
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
