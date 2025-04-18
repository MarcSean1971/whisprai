import { Logo } from "@/components/Logo";
import { SearchBar } from "./SearchBar";
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
  onSearchToggle
}: HeaderProps) {
  const location = useLocation();
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
  return <header className="flex flex-col border-b">
      
      
      <div className="px-4 py-2 border-t">
        <SearchBar isSearching={isSearching} searchQuery={searchQuery} onSearchChange={onSearchChange} onSearchToggle={onSearchToggle} />
      </div>
    </header>;
}