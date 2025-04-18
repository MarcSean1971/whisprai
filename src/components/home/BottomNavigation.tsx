
import { Button } from "@/components/ui/button";
import { 
  MessageSquarePlus, 
  Users, 
  Settings, 
  Shield, 
  LogOut 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BottomNavigationProps {
  activeTab?: 'chats' | 'contacts' | 'settings' | 'admin';
  onLogout: () => void;
  isAdmin: boolean;
}

export function BottomNavigation({ 
  activeTab, 
  onLogout,
  isAdmin 
}: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use location to determine active tab if not explicitly provided
  const currentPath = location.pathname;
  let currentTab = activeTab;
  
  if (!currentTab) {
    if (currentPath.includes('/profile-setup')) {
      currentTab = 'settings';
    } else if (currentPath.includes('/admin')) {
      currentTab = 'admin';
    } else if (currentPath.includes('/contacts')) {
      currentTab = 'contacts';
    } else if (currentPath.includes('/chats') || currentPath === '/home') {
      currentTab = 'chats';
    }
  }

  const handleLogout = async () => {
    try {
      // Clear local storage to remove any cached user data
      localStorage.clear();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error("Failed to log out. Please try again.");
        return;
      }
      
      // Clear any application state if needed
      // You might want to use a global state management solution like context or zustand
      
      // Navigate to the login page
      navigate("/");
      
      // Show success toast
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred during logout");
    }
  };

  return (
    <div className="border-t bg-background py-2 px-2 fixed bottom-0 left-0 right-0">
      <div className="flex justify-between w-full max-w-screen-xl mx-auto">
        <Button
          variant={currentTab === 'chats' ? 'default' : 'ghost'}
          className="flex-1 h-auto flex flex-col items-center justify-center py-1 gap-1 min-w-0"
          onClick={() => navigate('/chats')}
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span className="text-xs truncate">Chats</span>
        </Button>
        <Button
          variant={currentTab === 'contacts' ? 'default' : 'ghost'}
          className="flex-1 h-auto flex flex-col items-center justify-center py-1 gap-1 min-w-0"
          onClick={() => navigate('/contacts')}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs truncate">Contacts</span>
        </Button>
        <Button
          variant={currentTab === 'settings' ? 'default' : 'ghost'}
          className="flex-1 h-auto flex flex-col items-center justify-center py-1 gap-1 min-w-0"
          onClick={() => navigate('/profile-setup')}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs truncate">Settings</span>
        </Button>
        {isAdmin && (
          <Button
            variant={currentTab === 'admin' ? 'default' : 'ghost'}
            className="flex-1 h-auto flex flex-col items-center justify-center py-1 gap-1 min-w-0"
            onClick={() => navigate('/admin')}
          >
            <Shield className="h-5 w-5" />
            <span className="text-xs truncate">Admin</span>
          </Button>
        )}
        <Button
          variant="ghost"
          className="flex-1 h-auto flex flex-col items-center justify-center py-1 gap-1 min-w-0 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs truncate">Logout</span>
        </Button>
      </div>
    </div>
  );
}
