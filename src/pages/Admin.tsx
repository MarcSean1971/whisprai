
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/use-admin';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { BottomNavigation } from '@/components/home/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/home');
    }
  }, [isAdmin, loading, navigate]);

  const handleExit = () => {
    navigate('/home');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error("Failed to log out. Please try again.");
        return;
      }
      
      toast.success("Successfully logged out");
      navigate("/");
    } catch (error) {
      toast.error("An unexpected error occurred during logout");
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <div className="max-w-2xl mx-auto space-y-6 relative flex-1 overflow-y-auto p-4">
        <AdminHeader onExit={handleExit} />
        <AdminTabs />
      </div>
      
      <BottomNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
    </div>
  );
}
