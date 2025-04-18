
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Instruction } from './types';

interface InstructionsTableProps {
  instructions: Instruction[];
  onDelete: (id: string) => void;
}

export function InstructionsTable({ instructions, onDelete }: InstructionsTableProps) {
  if (instructions.length === 0) {
    return <p className="text-muted-foreground">No instructions found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Content</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instructions.map((instruction) => (
          <TableRow key={instruction.id}>
            <TableCell>{instruction.name}</TableCell>
            <TableCell className="max-w-md truncate">{instruction.content}</TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(instruction.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
