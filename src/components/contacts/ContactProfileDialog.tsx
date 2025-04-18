
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateConversation } from "@/hooks/use-create-conversation";
import { ContactProfileContent } from "./ContactProfileContent";

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
  const { isCreating, createConversation } = useCreateConversation({
    onSuccess: () => onOpenChange(false)
  });

  if (!contact) return null;

  const handleStartChat = () => {
    // Use contact.id which is the actual user ID
    createConversation(contact.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Profile</DialogTitle>
        </DialogHeader>
        <ContactProfileContent 
          contact={contact}
          isCreating={isCreating}
          onStartChat={handleStartChat}
        />
      </DialogContent>
    </Dialog>
  );
}
