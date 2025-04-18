
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
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Auth error:", userError);
        throw new Error('Authentication error occurred');
      }
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
        console.error("Error creating conversation:", {
          error: conversationError,
          message: conversationError.message,
          details: conversationError.details
        });
        throw new Error('Failed to create conversation');
      }

      if (!conversation) {
        throw new Error('No conversation was created');
      }
      
      console.log("Conversation created:", conversation.id);

      try {
        // Add both users as participants
        const participants = [
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: contact.contact.id }
        ];

        console.log("Adding participants:", participants);

        const { data: participantsData, error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participants)
          .select();

        if (participantsError) {
          console.error("Participant insertion error:", {
            error: participantsError,
            message: participantsError.message,
            details: participantsError.details,
            participants
          });
          throw new Error('Failed to add participants to conversation');
        }

        console.log("Participants added successfully:", participantsData);
        toast.success("Conversation started");
        onOpenChange(false);
        navigate(`/chat/${conversation.id}`);
      } catch (participantError) {
        console.error("Error in participant creation, cleaning up conversation:", participantError);
        const { error: cleanupError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
          
        if (cleanupError) {
          console.error("Failed to cleanup conversation:", cleanupError);
        }
        throw participantError;
      }
      
    } catch (error) {
      console.error('Error in conversation creation:', error);
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
