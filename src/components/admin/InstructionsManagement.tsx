
import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/use-admin';
import { useInstructions } from '@/hooks/use-instructions';
import { AddInstructionForm } from './instructions/AddInstructionForm';
import { InstructionsTable } from './instructions/InstructionsTable';
import { SearchInstructions } from './instructions/SearchInstructions';
import type { Instruction } from './instructions/types';

const ITEMS_PER_PAGE = 10;

export function InstructionsManagement() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { 
    instructions, 
    loading, 
    error, 
    loadInstructions, 
    deleteInstruction 
  } = useInstructions();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter instructions based on search query
  const filteredInstructions = instructions.filter((instruction: Instruction) => {
    const query = searchQuery.toLowerCase();
    return (
      instruction.name.toLowerCase().includes(query) ||
      instruction.content.toLowerCase().includes(query)
    );
  });

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredInstructions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInstructions = filteredInstructions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <AddInstructionForm onInstructionAdded={loadInstructions} />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Existing Instructions</h3>
        <SearchInstructions onSearch={setSearchQuery} />
        <InstructionsTable 
          instructions={paginatedInstructions}
          onDelete={deleteInstruction}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
}
