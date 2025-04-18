
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConnectionsList } from "@/components/contacts/ConnectionsList";
import { Loader2 } from "lucide-react";
import { useCreateConversation } from "@/hooks/use-create-conversation";

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
  const { isCreating, createConversation } = useCreateConversation({
    onSuccess: () => onOpenChange(false)
  });

  const handleContactSelect = async (contact: Contact) => {
    if (isCreating) return;
    createConversation(contact.contact.id);
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
