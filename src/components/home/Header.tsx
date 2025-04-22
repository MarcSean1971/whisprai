import { Logo } from "@/components/Logo";
import { SearchBar } from "./SearchBar";
import { useLocation } from "react-router-dom";
import { ShareButton } from "@/components/shared/ShareButton";
import { TodoListButton } from "@/components/todo/TodoListButton";
import { useState } from "react";
import { TodoListDrawer } from "@/components/todo/TodoListDrawer";

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
  const [todoDrawerOpen, setTodoDrawerOpen] = useState(false);
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
  
  return (
    <header className="flex flex-col border-b">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b">
        <Logo variant="full" />
        <ShareButton />
      </div>
      
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex-1">
          <SearchBar 
            isSearching={isSearching} 
            searchQuery={searchQuery} 
            onSearchChange={onSearchChange} 
            onSearchToggle={onSearchToggle} 
          />
        </div>
        <div className="flex items-center gap-2">
          <TodoListButton onClick={() => setTodoDrawerOpen(true)} />
          {rightAction}
        </div>
      </div>

      <TodoListDrawer 
        open={todoDrawerOpen}
        onOpenChange={setTodoDrawerOpen}
      />
    </header>
  );
}
