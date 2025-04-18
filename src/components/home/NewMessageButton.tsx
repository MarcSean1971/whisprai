
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { CreateChatDialog } from "@/components/chat/CreateChatDialog";

export function NewMessageButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="fixed right-3 bottom-16 z-10">
        <Button 
          size="icon" 
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={() => setShowDialog(true)}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>

      <CreateChatDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
