
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInstructionsProps {
  onSearch: (query: string) => void;
}

export function SearchInstructions({ onSearch }: SearchInstructionsProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search instructions..."
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
