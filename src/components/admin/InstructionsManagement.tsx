
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Instruction {
  id: string;
  name: string;
  content: string;
}

export function InstructionsManagement() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstructions();
  }, []);

  const loadInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_instructions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstructions(data);
    } catch (error) {
      console.error('Error loading instructions:', error);
      toast.error('Failed to load AI instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newName.trim() || !newContent.trim()) {
      toast.error('Name and content are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_instructions')
        .insert([{ name: newName, content: newContent }]);

      if (error) throw error;

      toast.success('Instruction added successfully');
      setNewName('');
      setNewContent('');
      loadInstructions();
    } catch (error) {
      console.error('Error saving instruction:', error);
      toast.error('Failed to save instruction');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Instruction deleted successfully');
      loadInstructions();
    } catch (error) {
      console.error('Error deleting instruction:', error);
      toast.error('Failed to delete instruction');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add New Instruction</h3>
        <Input
          placeholder="Instruction Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Textarea
          placeholder="Instruction Content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[100px]"
        />
        <Button onClick={handleSave} className="w-full">Add Instruction</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Existing Instructions</h3>
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
                    onClick={() => handleDelete(instruction.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
