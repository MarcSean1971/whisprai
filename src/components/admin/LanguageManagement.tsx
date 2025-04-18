
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { languageNames } from '@/lib/languages';

export function LanguageManagement() {
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [languages, setLanguages] = useState(languageNames);

  const handleAddLanguage = async () => {
    if (!newLanguageCode || !newLanguageName) {
      toast.error('Please enter both language code and name');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          value: { ...languages, [newLanguageCode]: newLanguageName }
        })
        .eq('key', 'language_list');

      if (error) throw error;

      setLanguages(prev => ({ ...prev, [newLanguageCode]: newLanguageName }));
      setNewLanguageCode('');
      setNewLanguageName('');
      toast.success('Language added successfully');
    } catch (error) {
      console.error('Error adding language:', error);
      toast.error('Failed to add language');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Language Management</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          placeholder="Language Code (e.g., en)"
          value={newLanguageCode}
          onChange={(e) => setNewLanguageCode(e.target.value)}
        />
        <Input
          placeholder="Language Name (e.g., English)"
          value={newLanguageName}
          onChange={(e) => setNewLanguageName(e.target.value)}
        />
      </div>
      
      <Button onClick={handleAddLanguage} className="w-full md:w-auto">
        Add Language
      </Button>

      <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(languages).map(([code, name]) => (
          <div key={code} className="flex items-center justify-between p-2 border rounded">
            <span>{code}: {name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
