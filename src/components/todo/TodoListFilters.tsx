
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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

  const activeFilters = Object.entries(filter).filter(([_, value]) => value !== 'all').length;

  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilters > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
              >
                {activeFilters}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuItem 
            className={filter.status === 'all' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('status', 'all')}
          >
            All
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={filter.status === 'pending' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('status', 'pending')}
          >
            Pending
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={filter.status === 'completed' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('status', 'completed')}
          >
            Completed
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Due Date</DropdownMenuLabel>
          <DropdownMenuItem 
            className={filter.dueDate === 'all' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('dueDate', 'all')}
          >
            All Time
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={filter.dueDate === 'today' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('dueDate', 'today')}
          >
            Today
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={filter.dueDate === 'week' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('dueDate', 'week')}
          >
            This Week
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={filter.dueDate === 'month' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('dueDate', 'month')}
          >
            This Month
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Assigned To</DropdownMenuLabel>
          <DropdownMenuItem 
            className={filter.assignee === 'all' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('assignee', 'all')}
          >
            Everyone
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={filter.assignee === 'me' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('assignee', 'me')}
          >
            Me
          </DropdownMenuItem>
          <DropdownMenuItem 
            className={filter.assignee === 'others' ? 'bg-accent' : ''} 
            onClick={() => handleFilterChange('assignee', 'others')}
          >
            Others
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
