
import { AvatarStack } from "@/components/home/AvatarStack";
import { BackButton } from "@/components/ui/back-button";
import { useParticipants } from "@/hooks/use-participants";
import { Menu, Search, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { VoiceCallDialog } from "./voice-call/VoiceCallDialog";

export function ChatHeader({ conversationId }: { conversationId: string }) {
  const { data: participants } = useParticipants(conversationId);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate("/chats");
  };
  
  const singleParticipant = participants?.length === 1 ? participants[0] : null;
  
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b py-3 sticky top-0 bg-background z-10">
      <div className="flex items-center gap-2">
        <BackButton onBack={handleBack} />
        {participants && participants.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <AvatarStack
                users={participants.map((user) => ({
                  name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : "Unknown User",
                  image: user.avatar_url
                }))}
                limit={3}
              />
            </div>
            <div>
              <div className="font-medium truncate">
                {participants.map(p => p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : "Unknown User").join(", ")}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {participants.length === 1 
                  ? `${participants[0].tagline || "No tagline set"}`
                  : `${participants.length} participants`
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="h-8 flex items-center">
            <div className="font-medium">Loading...</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSearching ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-[200px]"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearching(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {singleParticipant && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCallDialogOpen(true)}
              >
                <PhoneCall className="h-4 w-4" />
              </Button>
            )}
          </>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Chat Settings</SheetTitle>
              <SheetDescription>
                Configure chat preferences and options
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>

      {singleParticipant && (
        <VoiceCallDialog
          isOpen={isCallDialogOpen}
          onClose={() => setIsCallDialogOpen(false)}
          recipientId={singleParticipant.id}
          recipientName={`${singleParticipant.first_name || ''} ${singleParticipant.last_name || ''}`.trim()}
          conversationId={conversationId}
        />
      )}
    </div>
  );
}
