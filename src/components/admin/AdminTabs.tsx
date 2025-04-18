
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageManagement } from './LanguageManagement';
import { AISettings } from './AISettings';
import { UserManagement } from './UserManagement';
import { InstructionsManagement } from './InstructionsManagement';

export function AdminTabs() {
  return (
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
  );
}
