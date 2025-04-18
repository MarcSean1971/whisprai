
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConnectionsList } from "@/components/contacts/ConnectionsList";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to start a conversation');
        return;
      }

      console.log('Creating conversation between:', user.id, 'and', contact.contact.id);

      // First create the conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        throw new Error('Failed to create conversation');
      }

      console.log('Created conversation:', conversation.id);

      // Then add both users as participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: contact.contact.id }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        throw new Error('Failed to add participants');
      }

      // Close dialog and navigate to chat
      onOpenChange(false);
      navigate(`/chat/${conversation.id}`);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation. Please try again.');
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
          <ConnectionsList onContactSelect={handleContactSelect} isSelectable />
        </div>
      </DialogContent>
    </Dialog>
  );
}
