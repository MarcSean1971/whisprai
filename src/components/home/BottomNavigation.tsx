
import { Button } from "@/components/ui/button";
import { 
  MessageSquarePlus, 
  Users, 
  Settings, 
  Shield,
  Loader2,
  ListTodo
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { TodoListDrawer } from "@/components/todo/TodoListDrawer";
import { cn } from "@/lib/utils";

interface BottomNavigationProps { 
  activeTab?: 'chats' | 'contacts' | 'profile' | 'admin';
  isAdmin?: boolean | null;
  isLoading?: boolean;
}

export function BottomNavigation({ 
  activeTab, 
  isAdmin,
  isLoading = false
}: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [todoDrawerOpen, setTodoDrawerOpen] = useState(false);
  
  // Use location to determine active tab if not explicitly provided
  const currentPath = location.pathname;
  let currentTab = activeTab;
  
  if (!currentTab) {
    if (currentPath.includes('/profile-setup')) {
      currentTab = 'profile';
    } else if (currentPath.includes('/admin')) {
      currentTab = 'admin';
    } else if (currentPath.includes('/contacts')) {
      currentTab = 'contacts';
    } else if (currentPath.includes('/chats') || currentPath === '/home' || currentPath === '/') {
      currentTab = 'chats';
    }
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "safe-area-bottom" // Add safe area padding for mobile devices
    )}>
      <div className="flex justify-around w-full max-w-screen-xl mx-auto px-2 py-1">
        <Button
          variant={currentTab === 'chats' ? 'default' : 'ghost'}
          className="w-[70px] px-2 h-auto flex flex-col items-center justify-center py-1 gap-1"
          onClick={() => navigate('/chats')}
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span className="text-xs truncate">Chats</span>
        </Button>
        <Button
          variant={currentTab === 'contacts' ? 'default' : 'ghost'}
          className="w-[70px] px-2 h-auto flex flex-col items-center justify-center py-1 gap-1"
          onClick={() => navigate('/contacts')}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs truncate">Contacts</span>
        </Button>
        <Button
          variant="ghost"
          className="w-[70px] px-2 h-auto flex flex-col items-center justify-center py-1 gap-1"
          onClick={() => setTodoDrawerOpen(true)}
        >
          <ListTodo className="h-5 w-5" />
          <span className="text-xs truncate">To Do</span>
        </Button>
        <Button
          variant={currentTab === 'profile' ? 'default' : 'ghost'}
          className="w-[70px] px-2 h-auto flex flex-col items-center justify-center py-1 gap-1"
          onClick={() => navigate('/profile-setup')}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs truncate">Profile</span>
        </Button>
        {isLoading ? (
          <Button
            variant="ghost"
            className="w-[70px] px-2 h-auto flex flex-col items-center justify-center py-1 gap-1"
            disabled
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs truncate">Loading</span>
          </Button>
        ) : isAdmin ? (
          <Button
            variant={currentTab === 'admin' ? 'default' : 'ghost'}
            className="w-[70px] px-2 h-auto flex flex-col items-center justify-center py-1 gap-1"
            onClick={() => navigate('/admin')}
          >
            <Shield className="h-5 w-5" />
            <span className="text-xs truncate">Admin</span>
          </Button>
        ) : null}
      </div>
      <TodoListDrawer 
        open={todoDrawerOpen}
        onOpenChange={setTodoDrawerOpen}
      />
    </div>
  );
}
