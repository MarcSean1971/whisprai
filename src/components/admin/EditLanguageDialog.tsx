
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languageCode: string;
  languageName: string;
  onSave: () => void;
}

export function EditLanguageDialog({
  open,
  onOpenChange,
  languageCode,
  languageName,
  onSave
}: EditLanguageDialogProps) {
  const [name, setName] = useState(languageName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Language name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const { data: currentData } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'language_list')
        .single();

      if (!currentData) throw new Error('No language data found');

      const updatedLanguages = {
        ...currentData.value,
        [languageCode]: name.trim()
      };

      const { error } = await supabase
        .from('admin_settings')
        .update({ value: updatedLanguages })
        .eq('key', 'language_list');

      if (error) throw error;

      toast.success('Language updated successfully');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error('Failed to update language');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Language</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language Code</label>
            <Input value={languageCode} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Language Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter language name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
