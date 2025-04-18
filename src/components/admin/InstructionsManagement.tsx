
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Zod schema for validation
const instructionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  content: z.string().min(1, "Content is required").max(5000, "Content must be less than 5000 characters")
});

export function InstructionsManagement() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof instructionSchema>>({
    resolver: zodResolver(instructionSchema),
    defaultValues: {
      name: '',
      content: ''
    }
  });

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

  const onSubmit = async (values: z.infer<typeof instructionSchema>) => {
    try {
      const { error } = await supabase
        .from('ai_instructions')
        .insert([{ 
          name: values.name, 
          content: values.content 
        }]);

      if (error) throw error;

      toast.success('Instruction added successfully');
      form.reset(); // Reset form after successful submission
      loadInstructions(); // Refresh the list
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <h3 className="text-lg font-medium">Add New Instruction</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instruction Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter instruction name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instruction Content</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter instruction content" 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">Add Instruction</Button>
        </form>
      </Form>

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
