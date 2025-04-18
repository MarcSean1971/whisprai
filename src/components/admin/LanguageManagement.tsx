
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { languageNames } from '@/lib/languages';
import { Loader2, Trash2 } from 'lucide-react';

export function LanguageManagement() {
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [languages, setLanguages] = useState<{ [key: string]: string }>({}); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'language_list')
          .single();

        if (error) {
          // If no language list exists yet, initialize with default languages
          if (error.code === 'PGRST116') {
            await supabase
              .from('admin_settings')
              .insert({ key: 'language_list', value: languageNames });
            setLanguages(languageNames);
          } else {
            throw error;
          }
        } else if (data?.value) {
          setLanguages(data.value as { [key: string]: string });
        }
      } catch (error) {
        console.error('Error loading languages:', error);
        toast.error('Failed to load languages');
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, []);

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

      setLanguages(updatedLanguages);
      setNewLanguageCode('');
      setNewLanguageName('');
      toast.success('Language added successfully');
    } catch (error) {
      console.error('Error adding language:', error);
      toast.error('Failed to add language');
    }
  };

  const handleDeleteLanguage = async (code: string) => {
    try {
      const updatedLanguages = { ...languages };
      delete updatedLanguages[code];

      const { error } = await supabase
        .from('admin_settings')
        .update({ value: updatedLanguages })
        .eq('key', 'language_list');

      if (error) throw error;

      setLanguages(updatedLanguages);
      toast.success('Language removed successfully');
    } catch (error) {
      console.error('Error removing language:', error);
      toast.error('Failed to remove language');
    }
  };

  // Sort languages by name
  const sortedLanguages = Object.entries(languages)
    .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Language Management</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          placeholder="Language Code (e.g., en)"
          value={newLanguageCode}
          onChange={(e) => setNewLanguageCode(e.target.value)}
          maxLength={2}
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
        {sortedLanguages.map(([code, name]) => (
          <div 
            key={code} 
            className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
          >
            <span className="flex-1">{name} ({code})</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteLanguage(code)}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
