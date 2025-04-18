
import { useEffect } from 'react';
import { useAdmin } from '@/hooks/use-admin';
import { useInstructions } from '@/hooks/use-instructions';
import { AddInstructionForm } from './instructions/AddInstructionForm';
import { InstructionsTable } from './instructions/InstructionsTable';

export function InstructionsManagement() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { 
    instructions, 
    loading, 
    error, 
    loadInstructions, 
    deleteInstruction 
  } = useInstructions();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      return;
    }
    loadInstructions();
  }, [isAdmin, adminLoading, loadInstructions]);

  if (adminLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="text-red-500">Access Denied: Admin privileges required.</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (loading) {
    return <div>Loading instructions...</div>;
  }

  return (
    <div className="space-y-6">
      <AddInstructionForm onInstructionAdded={loadInstructions} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Existing Instructions</h3>
        <InstructionsTable 
          instructions={instructions} 
          onDelete={deleteInstruction}
        />
      </div>
    </div>
  );
}
