
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const instructionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  content: z.string().min(1, "Content is required").max(5000, "Content must be less than 5000 characters")
});

interface AddInstructionFormProps {
  onInstructionAdded: () => void;
}

export function AddInstructionForm({ onInstructionAdded }: AddInstructionFormProps) {
  const form = useForm<z.infer<typeof instructionSchema>>({
    resolver: zodResolver(instructionSchema),
    defaultValues: {
      name: '',
      content: ''
    }
  });

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
      form.reset();
      onInstructionAdded();
    } catch (error) {
      console.error('Error saving instruction:', error);
      toast.error('Failed to save instruction');
    }
  };

  return (
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
  );
}
