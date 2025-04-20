
import { ContactProfileContent } from "@/components/contacts/ContactProfileContent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateConversation } from "@/hooks/use-create-conversation";

interface ChatParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    tagline: string | null;
  };
}

export function ChatParticipantDialog({ 
  open, 
  onOpenChange, 
  participant 
}: ChatParticipantDialogProps) {
  const { isCreating, createConversation } = useCreateConversation({
    onSuccess: () => onOpenChange(false)
  });
  
  if (!participant) return null;

  // Since we're already in a chat, we don't need the "Start Chat" functionality
  const handleStartChat = () => {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <ContactProfileContent 
          contact={{
            id: participant.id,
            email: '', // We don't have this in the chat context
            profile: {
              first_name: participant.first_name,
              last_name: participant.last_name,
              avatar_url: participant.avatar_url,
              bio: null,
              tagline: participant.tagline,
              birthdate: null
            }
          }}
          isCreating={false}
          onStartChat={handleStartChat}
        />
      </DialogContent>
    </Dialog>
  );
}
