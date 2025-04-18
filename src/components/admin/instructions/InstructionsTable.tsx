
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { EditInstructionDialog } from './EditInstructionDialog';
import type { Instruction } from './types';

interface InstructionsTableProps {
  instructions: Instruction[];
  onDelete: (id: string) => void;
  onUpdate: (instruction: Instruction) => Promise<void>;
  onToggleSuspend: (id: string, suspended: boolean) => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export function InstructionsTable({ 
  instructions, 
  onDelete, 
  onUpdate,
  onToggleSuspend,
  currentPage, 
  totalPages,
  onPageChange,
  itemsPerPage = 10 
}: InstructionsTableProps) {
  if (instructions.length === 0) {
    return <p className="text-muted-foreground">No instructions found.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructions.map((instruction) => (
            <TableRow key={instruction.id} className={instruction.suspended ? 'opacity-50' : ''}>
              <TableCell>{instruction.name}</TableCell>
              <TableCell className="max-w-md truncate">{instruction.content}</TableCell>
              <TableCell>
                <Switch
                  checked={!instruction.suspended}
                  onCheckedChange={(checked) => onToggleSuspend(instruction.id, !checked)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EditInstructionDialog 
                    instruction={instruction}
                    onUpdate={onUpdate}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(instruction.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index + 1}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(index + 1);
                  }}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
