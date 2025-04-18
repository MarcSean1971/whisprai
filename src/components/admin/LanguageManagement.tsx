
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EditLanguageDialog } from './EditLanguageDialog';
import { AddLanguageForm } from './languages/AddLanguageForm';
import { LanguageList } from './languages/LanguageList';

export function LanguageManagement() {
  const [languages, setLanguages] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [editLanguage, setEditLanguage] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'language_list')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // If language list doesn't exist, create a default one
            const defaultLanguages = { 
              en: "English", 
              es: "Spanish", 
              fr: "French" 
            };
            
            await supabase
              .from('admin_settings')
              .insert({ key: 'language_list', value: defaultLanguages });
            setLanguages(defaultLanguages);
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

  const handleEditClick = (code: string, name: string) => {
    setEditLanguage({ code, name });
  };

  const handleEditComplete = () => {
    const loadLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'language_list')
          .single();

        if (error) throw error;
        if (data?.value) {
          setLanguages(data.value as { [key: string]: string });
        }
      } catch (error) {
        console.error('Error reloading languages:', error);
        toast.error('Failed to reload languages');
      }
    };

    loadLanguages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddLanguageForm 
        languages={languages}
        onLanguageAdded={setLanguages}
      />

      <LanguageList 
        languages={languages}
        onLanguageDeleted={setLanguages}
        onEditClick={handleEditClick}
      />

      {editLanguage && (
        <EditLanguageDialog
          open={!!editLanguage}
          onOpenChange={(open) => !open && setEditLanguage(null)}
          languageCode={editLanguage.code}
          languageName={editLanguage.name}
          onSave={handleEditComplete}
        />
      )}
    </div>
  );
}
