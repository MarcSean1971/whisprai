
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
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      console.log("Starting conversation creation with contact:", contact.contact.id);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        throw new Error('You must be logged in to start a conversation');
      }

      // First create the conversation
      console.log("Creating conversation...");
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        console.error("Error creating conversation:", conversationError);
        throw conversationError;
      }

      if (!conversation) {
        throw new Error('Failed to create conversation');
      }
      
      console.log("Conversation created:", conversation.id);

      try {
        // Then add the participants
        console.log("Adding participants...");
        const participants = [
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: contact.contact.id }
        ];

        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participants);

        if (participantsError) {
          console.error("Error adding participants:", participantsError);
          throw participantsError;
        }

        console.log("Participants added successfully");
        toast.success("Conversation started");
        onOpenChange(false);
        navigate(`/chat/${conversation.id}`);
      } catch (participantError) {
        // If adding participants fails, cleanup the conversation
        console.error("Error adding participants, cleaning up conversation:", participantError);
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
        throw participantError;
      }
      
    } catch (error) {
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
