
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Mail, MessageSquare, Tag } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContactProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: {
    id: string;
    email: string;
    profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      tagline: string | null;
      birthdate: string | null;
    } | null;
  };
}

export function ContactProfileDialog({ open, onOpenChange, contact }: ContactProfileDialogProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  if (!contact) return null;

  const fullName = contact.profile?.first_name 
    ? `${contact.profile.first_name} ${contact.profile.last_name || ''}`
    : contact.email;

  const handleStartChat = async () => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Auth error:", userError);
        throw new Error('Not authenticated');
      }
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        console.error("Failed to create conversation:", conversationError);
        throw new Error('Failed to create conversation');
      }

      if (!conversation) {
        throw new Error('No conversation was created');
      }

      // Add participants
      const participants = [
        { conversation_id: conversation.id, user_id: user.id },
        { conversation_id: conversation.id, user_id: contact.id }
      ];

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) {
        // If adding participants fails, cleanup the conversation
        const { error: cleanupError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
          
        if (cleanupError) {
          console.error("Failed to cleanup conversation:", cleanupError);
        }
        throw new Error('Failed to add participants');
      }

      toast.success("Conversation started");
      onOpenChange(false);
      navigate(`/chat/${conversation.id}`);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={contact.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {contact.profile?.first_name?.[0] || contact.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{fullName}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{contact.email}</span>
            </div>

            {contact.profile?.tagline && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>{contact.profile.tagline}</span>
              </div>
            )}

            {contact.profile?.birthdate && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(contact.profile.birthdate).toLocaleDateString()}</span>
              </div>
            )}

            {contact.profile?.bio && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">About</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.profile.bio}</p>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleStartChat}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating chat...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Chat
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
