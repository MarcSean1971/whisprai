
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Instruction } from '@/components/admin/instructions/types';

export function useInstructions() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInstructions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_instructions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstructions(data || []);
      setError(null);
    } catch (error) {
      console.error('Error loading instructions:', error);
      toast.error('Failed to load AI instructions');
      setError('Could not load instructions. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInstruction = useCallback(async (instruction: Instruction) => {
    try {
      const { error } = await supabase
        .from('ai_instructions')
        .update({
          name: instruction.name,
          content: instruction.content,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', instruction.id);

      if (error) throw error;
      await loadInstructions();
    } catch (error) {
      console.error('Error updating instruction:', error);
      throw error;
    }
  }, [loadInstructions]);

  const toggleInstructionSuspension = useCallback(async (id: string, suspended: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_instructions')
        .update({
          suspended,
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;
      await loadInstructions();
    } catch (error) {
      console.error('Error toggling instruction suspension:', error);
      throw error;
    }
  }, [loadInstructions]);

  const deleteInstruction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Instruction deleted successfully');
      await loadInstructions();
    } catch (error) {
      console.error('Error deleting instruction:', error);
      toast.error('Failed to delete instruction');
    }
  }, [loadInstructions]);

  return {
    instructions,
    loading,
    error,
    loadInstructions,
    updateInstruction,
    toggleInstructionSuspension,
    deleteInstruction
  };
}
