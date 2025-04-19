import { AvatarStack } from "@/components/home/AvatarStack";
import { BackButton } from "@/components/home/BackButton";
import { useParticipants } from "@/hooks/use-participants";
import { CallButton } from "@/components/call/CallButton";
import { Menu, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export function ChatHeader({ conversationId }: { conversationId: string }) {
  const { data: participants } = useParticipants(conversationId);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b py-3 sticky top-0 bg-background z-10">
      <div className="flex items-center gap-2">
        <BackButton />
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
                  ? `${participants[0].language || "Unknown language"}`
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearching(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        {participants && participants.length === 1 && (
          <>
            <CallButton 
              recipientId={participants[0].id}
              recipientName={participants[0].first_name && participants[0].last_name 
                ? `${participants[0].first_name} ${participants[0].last_name}` 
                : "Unknown User"
              }
            />
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
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
            {/* Menu content will be implemented based on requirements */}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
