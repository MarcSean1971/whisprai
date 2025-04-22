
import { Button } from "@/components/ui/button";
import { 
  MessageSquarePlus, 
  Users, 
  Settings, 
  Shield,
  Loader2
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
    <div className="border-t bg-background py-2 px-2 fixed bottom-0 left-0 right-0">
      <div className="flex justify-around w-full max-w-screen-xl mx-auto">
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
    </div>
  );
}

