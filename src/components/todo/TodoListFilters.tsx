import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface TodoListFiltersProps {
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: TodoFilter) => void;
}

export type TodoFilter = {
  status: 'all' | 'pending' | 'completed';
  dueDate: 'all' | 'today' | 'week' | 'month';
  assignee: 'all' | 'me' | 'others';
}

export function TodoListFilters({ onSearchChange, onFilterChange }: TodoListFiltersProps) {
  const [filter, setFilter] = useState<TodoFilter>({
    status: 'all',
    dueDate: 'all',
    assignee: 'all'
  });

  const handleFilterChange = (key: keyof TodoFilter, value: string) => {
    const newFilter = { ...filter, [key]: value } as TodoFilter;
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 p-4 border-b">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search todos..."
          className="pl-8 w-full"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px] sm:w-48">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFilterChange('status', 'all')}>
            All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange('status', 'pending')}>
            Pending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange('status', 'completed')}>
            Completed
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Due Date</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFilterChange('dueDate', 'all')}>
            All Time
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange('dueDate', 'today')}>
            Today
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange('dueDate', 'week')}>
            This Week
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange('dueDate', 'month')}>
            This Month
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Assigned To</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFilterChange('assignee', 'all')}>
            Everyone
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange('assignee', 'me')}>
            Me
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFilterChange('assignee', 'others')}>
            Others
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
