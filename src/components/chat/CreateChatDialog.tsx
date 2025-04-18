
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConnectionsList } from "@/components/contacts/ConnectionsList";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Contact {
  id: string;
  contact: {
    id: string;
    email: string;
    profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChatDialog({ open, onOpenChange }: CreateChatDialogProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleContactSelect = async (contact: Contact) => {
    if (isCreating) return; // Prevent multiple clicks
    
    try {
      setIsCreating(true);
      toast.loading("Creating conversation...");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to start a conversation');
        return;
      }

      // First create the conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Then add participants - with the new policy this should work without recursion
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: contact.contact.id }
        ]);

      if (participantsError) throw participantsError;

      // Close dialog and navigate to chat
      toast.dismiss();
      toast.success("Conversation created successfully");
      onOpenChange(false);
      navigate(`/chat/${conversation.id}`);
      
    } catch (error) {
      toast.dismiss();
      console.error('Error creating conversation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Contact</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isCreating ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Creating conversation...</span>
            </div>
          ) : (
            <ConnectionsList onContactSelect={handleContactSelect} isSelectable />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
