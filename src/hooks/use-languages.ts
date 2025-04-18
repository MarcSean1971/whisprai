
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useLanguages() {
  const [languages, setLanguages] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'language_list')
          .maybeSingle();

        if (error) throw error;
        
        if (data?.value) {
          setLanguages(data.value as { [key: string]: string });
        }
      } catch (error) {
        console.error('Error loading languages:', error);
        toast.error('Failed to load languages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return { languages, isLoading };
}
