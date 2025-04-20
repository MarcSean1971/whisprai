
import { ChatProfileContent } from "./ChatProfileContent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    tagline: string | null;
    bio: string | null;
    birthdate: string | null;
    email: string | null;
  };
}

export function ChatParticipantDialog({ 
  open, 
  onOpenChange, 
  participant 
}: ChatParticipantDialogProps) {  
  if (!participant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <ChatProfileContent participant={participant} />
      </DialogContent>
    </Dialog>
  );
}
