
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';
import { LanguageManagement } from '@/components/admin/LanguageManagement';
import { AISettings } from '@/components/admin/AISettings';
import { UserManagement } from '@/components/admin/UserManagement';
import { InstructionsManagement } from '@/components/admin/InstructionsManagement';

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/home');
    }
  }, [isAdmin, loading, navigate]);

  const handleExit = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleExit} 
          className="absolute top-0 left-0 gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-2xl font-bold mt-12">Admin Dashboard</h1>
        
        <Tabs defaultValue="languages" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="languages">
            <LanguageManagement />
          </TabsContent>
          
          <TabsContent value="ai">
            <AISettings />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="instructions">
            <InstructionsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
