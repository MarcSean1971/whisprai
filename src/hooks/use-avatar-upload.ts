
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAvatarUpload() {
  const uploadAvatar = useCallback(async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      toast.error('Error uploading avatar');
      console.error('Error:', error);
      return null;
    }
  }, []);

  return { uploadAvatar };
}
