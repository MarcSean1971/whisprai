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
      console.log("Starting conversation creation...");
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        throw new Error('You must be logged in to start a conversation');
      }

      console.log("Creating conversation...");
      
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
        console.error("Conversation creation error:", conversationError);
        throw conversationError;
      }

      // Add both participants in a single insert to avoid race conditions
      console.log("Adding participants...");
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: contact.contact.id }
        ]);

      if (participantsError) {
        console.error("Adding participants error:", participantsError);
        throw participantsError;
      }

      console.log("Conversation created successfully!");
      toast.success("Conversation created");
      onOpenChange(false);
      navigate(`/chat/${conversation.id}`);
      
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
