
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChatHeaderVideoCall } from "./ChatHeaderVideoCall";
import { ChatHeaderSearch } from "./ChatHeaderSearch";
import { Button } from "@/components/ui/button";

export function ChatHeaderActions() {
  // Fetch conversationId from pathname, mimic old logic
  const conversationId = window.location.pathname.match(/[0-9a-fA-F-]{36,}/)?.[0] ?? "";

  return (
    <div className="flex items-center gap-2">
      <ChatHeaderVideoCall conversationId={conversationId} />
      <ChatHeaderSearch />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem>License</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
