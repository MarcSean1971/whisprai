
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactSelect } from "./components/ContactSelect";
import { DateSelect } from "./components/DateSelect";

interface TodoDialogProps {
  onSubmit: (assignedTo: string, dueDate: Date) => void;
  onClose: () => void;
}

export function TodoDialog({ onSubmit, onClose }: TodoDialogProps) {
  const [date, setDate] = useState<Date>();
  const [selectedContactId, setSelectedContactId] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (date && selectedContactId && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(selectedContactId, date);
        setDate(undefined);
        setSelectedContactId(undefined);
        onClose();
      } catch (error) {
        console.error('Error submitting todo:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div 
      className="p-6 space-y-4 bg-popover pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">
        Add to Todo List
      </h2>
      
      <ContactSelect
        selectedContactId={selectedContactId}
        onSelect={setSelectedContactId}
        disabled={isSubmitting}
      />
      
      <DateSelect
        date={date}
        onSelect={setDate}
        disabled={isSubmitting}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={!date || !selectedContactId || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Todo"}
        </Button>
      </div>
    </div>
  );
}
