
import { Button } from "@/components/ui/button";
import { 
  MessageSquarePlus, 
  Users, 
  Settings, 
  Shield, 
  LogOut 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BottomNavigationProps {
  activeTab: 'messages' | 'contacts';
  setActiveTab: (tab: 'messages' | 'contacts') => void;
  onLogout: () => void;
  isAdmin: boolean;
}

export function BottomNavigation({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  isAdmin 
}: BottomNavigationProps) {
  const navigate = useNavigate();

  return (
    <div className="border-t bg-background py-2 px-2">
      <div className="grid grid-cols-4 gap-1">
        <Button
          variant={activeTab === 'messages' ? 'default' : 'ghost'}
          className="h-auto flex flex-col items-center justify-center py-1 gap-1"
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span className="text-xs">Chats</span>
        </Button>
        <Button
          variant={activeTab === 'contacts' ? 'default' : 'ghost'}
          className="h-auto flex flex-col items-center justify-center py-1 gap-1"
          onClick={() => setActiveTab('contacts')}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Contacts</span>
        </Button>
        <Button
          variant="ghost"
          className="h-auto flex flex-col items-center justify-center py-1 gap-1"
          onClick={() => navigate('/profile-setup')}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Settings</span>
        </Button>
        {isAdmin ? (
          <Button
            variant="ghost"
            className="h-auto flex flex-col items-center justify-center py-1 gap-1"
            onClick={() => navigate('/admin')}
          >
            <Shield className="h-5 w-5" />
            <span className="text-xs">Admin</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="h-auto flex flex-col items-center justify-center py-1 gap-1 text-destructive hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs">Logout</span>
          </Button>
        )}
      </div>
    </div>
  );
}
