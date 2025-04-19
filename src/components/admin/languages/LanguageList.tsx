
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LanguageListProps {
  languages: { [key: string]: string };
  onLanguageDeleted: (updatedLanguages: { [key: string]: string }) => void;
  onEditClick: (code: string, name: string) => void;
}

export function LanguageList({ languages, onLanguageDeleted, onEditClick }: LanguageListProps) {
  const handleDeleteLanguage = async (code: string) => {
    try {
      const updatedLanguages = { ...languages };
      delete updatedLanguages[code];

      const { error } = await supabase
        .from('admin_settings')
        .update({ value: updatedLanguages })
        .eq('key', 'language_list');

      if (error) throw error;

      onLanguageDeleted(updatedLanguages);
      toast.success('Language removed successfully');
    } catch (error) {
      console.error('Error removing language:', error);
      toast.error('Failed to remove language');
    }
  };

  const sortedLanguages = Object.entries(languages)
    .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB));

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {sortedLanguages.map(([code, name]) => (
        <div 
          key={code} 
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
        >
          <span className="flex-1 truncate mr-2">{name} ({code})</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditClick(code, name)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteLanguage(code)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
