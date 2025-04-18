import { Header } from "@/components/home/Header";
import { BottomNavigation } from "@/components/home/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { ConnectionsList } from "@/components/contacts/ConnectionsList";
import { SentRequests } from "@/components/contacts/SentRequests";
import { ReceivedRequests } from "@/components/contacts/ReceivedRequests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useRequestCounts } from "@/hooks/use-request-counts";

export default function Contacts() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: requestCounts } = useRequestCounts();
  
  const activeTab = searchParams.get("tab") || "contacts";
  
  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "contacts" });
    }
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };
  
  const handleLogout = async () => {
    try {
      localStorage.clear();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error("Failed to log out. Please try again.");
        return;
      }
      
      navigate("/");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred during logout");
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-background w-full max-w-full">
      <Header 
        isSearching={false}
        searchQuery=""
        onSearchChange={() => {}}
        onSearchToggle={() => {}}
      />
      
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="px-2 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
              <TabsTrigger value="sent" className="flex-1 relative">
                Sent
                {requestCounts?.sent > 0 && (
                  <Badge 
                    variant="whispr" 
                    className="absolute -top-1 -right-1 min-w-[18px] h-4 flex items-center justify-center text-[10px]"
                  >
                    {requestCounts.sent}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="received" className="flex-1 relative">
                Received
                {requestCounts?.received > 0 && (
                  <Badge 
                    variant="whispr"
                    className="absolute -top-1 -right-1 min-w-[18px] h-4 flex items-center justify-center text-[10px]"
                  >
                    {requestCounts.received}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contacts" className="mt-0">
            <div className="relative">
              <div className="absolute right-4 top-4">
                <AddContactDialog />
              </div>
              <ConnectionsList />
            </div>
          </TabsContent>

          <TabsContent value="sent" className="mt-0">
            <SentRequests />
          </TabsContent>

          <TabsContent value="received" className="mt-0">
            <ReceivedRequests />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation 
        activeTab="contacts"
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
    </div>
  );
}
