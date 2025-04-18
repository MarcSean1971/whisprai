
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  isSearching: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchToggle: () => void;
}

export function SearchBar({ 
  isSearching, 
  searchQuery, 
  onSearchChange, 
  onSearchToggle 
}: SearchBarProps) {
  return isSearching ? (
    <div className="flex items-center relative">
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-[150px] pr-8 h-8"
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 h-8 w-8"
        onClick={() => {
          onSearchChange("");
          onSearchToggle();
        }}
      >
        <Search className="h-3.5 w-3.5" />
      </Button>
    </div>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={onSearchToggle}
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}
