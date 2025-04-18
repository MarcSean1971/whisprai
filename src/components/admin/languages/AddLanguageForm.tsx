
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AddLanguageFormProps {
  languages: { [key: string]: string };
  onLanguageAdded: (updatedLanguages: { [key: string]: string }) => void;
}

export function AddLanguageForm({ languages, onLanguageAdded }: AddLanguageFormProps) {
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');

  const handleAddLanguage = async () => {
    if (!newLanguageCode || !newLanguageName) {
      toast.error('Please enter both language code and name');
      return;
    }

    try {
      const updatedLanguages = { 
        ...languages, 
        [newLanguageCode.toLowerCase()]: newLanguageName 
      };

      const { error } = await supabase
        .from('admin_settings')
        .update({ value: updatedLanguages })
        .eq('key', 'language_list');

      if (error) throw error;

      onLanguageAdded(updatedLanguages);
      setNewLanguageCode('');
      setNewLanguageName('');
      toast.success('Language added successfully');
    } catch (error) {
      console.error('Error adding language:', error);
      toast.error('Failed to add language');
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="grid gap-4 md:grid-cols-2 w-full">
        <Input
          placeholder="Language Code (e.g., en)"
          value={newLanguageCode}
          onChange={(e) => setNewLanguageCode(e.target.value)}
          maxLength={2}
          className="w-full"
        />
        <Input
          placeholder="Language Name (e.g., English)"
          value={newLanguageName}
          onChange={(e) => setNewLanguageName(e.target.value)}
          className="w-full"
        />
      </div>
      <Button onClick={handleAddLanguage} className="w-full">
        Add Language
      </Button>
    </div>
  );
}
