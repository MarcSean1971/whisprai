
import { Logo } from "@/components/Logo";
import { SearchBar } from "./SearchBar";
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
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Logo variant="full" />
          {headerContent && (
            <div className="flex items-center gap-2">
              {headerContent.icon}
              <h1 className="text-xl font-semibold">{headerContent.title}</h1>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 py-2 border-t">
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
