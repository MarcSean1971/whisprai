
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageManagement } from './LanguageManagement';
import { AISettings } from './AISettings';
import { UserManagement } from './UserManagement';
import { InstructionsManagement } from './InstructionsManagement';

export function AdminTabs() {
  return (
    <Tabs defaultValue="languages" className="w-full">
      <TabsList className="flex w-full">
        <TabsTrigger value="languages" className="flex-1">Languages</TabsTrigger>
        <TabsTrigger value="ai" className="flex-1">AI Settings</TabsTrigger>
        <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
        <TabsTrigger value="instructions" className="flex-1">Instructions</TabsTrigger>
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
  );
}

