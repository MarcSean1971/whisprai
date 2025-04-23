
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Props {}

export function ChatHeaderSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return isSearching ? (
    <div className="flex items-center relative">
      <Input
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-[200px] h-9"
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 h-9 w-9"
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
      className="h-9 w-9"
      onClick={() => setIsSearching(true)}
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
