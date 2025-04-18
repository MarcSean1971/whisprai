
import { Logo } from "@/components/Logo";
import { SearchBar } from "./SearchBar";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  isSearching: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchToggle: () => void;
}

export function Header({
  isSearching,
  searchQuery,
  onSearchChange,
  onSearchToggle,
}: HeaderProps) {
  const isMobile = useIsMobile();

  return (
    <header className="flex items-center justify-between p-2 border-b">
      <Logo variant={isMobile ? "icon" : "full"} />
      <div className="flex items-center gap-1">
        <SearchBar
          isSearching={isSearching}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSearchToggle={onSearchToggle}
        />
      </div>
    </header>
  );
}
