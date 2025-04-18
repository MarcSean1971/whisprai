
import { Logo } from "@/components/Logo";
import { SearchBar } from "./SearchBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare, Users } from "lucide-react";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  const getHeaderContent = () => {
    switch (location.pathname) {
      case '/chats':
        return { title: 'Chats', icon: <MessageSquare className="h-5 w-5" /> };
      case '/contacts':
        return { title: 'Contacts', icon: <Users className="h-5 w-5" /> };
      default:
        return null;
    }
  };

  const headerContent = getHeaderContent();

  return (
    <header className="flex flex-col border-b">
      {/* Top section with logo and search */}
      <div className="flex items-center justify-between p-2">
        <Logo variant={isMobile ? "icon" : "full"} />
        <div className="flex items-center gap-1">
          <SearchBar
            isSearching={isSearching}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSearchToggle={onSearchToggle}
          />
        </div>
      </div>
      
      {/* Title section */}
      {headerContent && (
        <div className="flex items-center gap-2 px-4 py-3 bg-background z-10">
          {headerContent.icon}
          <h1 className="text-xl font-semibold">{headerContent.title}</h1>
        </div>
      )}
    </header>
  );
}
