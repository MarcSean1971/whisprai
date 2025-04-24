import { Logo } from "@/components/Logo";
import { SearchBar } from "./SearchBar";
import { useLocation } from "react-router-dom";
import { ShareButton } from "@/components/shared/ShareButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isSearching: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchToggle: () => void;
  rightAction?: React.ReactNode;
}

export function Header({
  isSearching,
  searchQuery,
  onSearchChange,
  onSearchToggle,
  rightAction
}: HeaderProps) {
  const location = useLocation();
  const { isMobile } = useIsMobile();
  
  const getHeaderContent = () => {
    switch (location.pathname) {
      case '/chats':
        return {
          title: 'Chats',
          icon: null
        };
      case '/contacts':
        return {
          title: 'Contacts',
          icon: null
        };
      default:
        return null;
    }
  };
  
  const headerContent = getHeaderContent();
  
  return (
    <header className="flex flex-col border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={cn(
        "flex items-center justify-between gap-4 border-b",
        isMobile ? "px-4 py-2" : "px-6 py-3"
      )}>
        <Logo variant="full" />
        <ShareButton />
      </div>
      
      <div className={cn(
        "flex items-center justify-between gap-2",
        isMobile ? "px-4 py-2" : "px-6 py-3"
      )}>
        <div className="flex-1">
          <SearchBar 
            isSearching={isSearching} 
            searchQuery={searchQuery} 
            onSearchChange={onSearchChange} 
            onSearchToggle={onSearchToggle} 
          />
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
