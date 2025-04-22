
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContacts } from "@/hooks/use-contacts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TodoDialogProps {
  onSubmit: (assignedTo: string, dueDate: Date) => void;
  onClose: () => void;
}

export function TodoDialog({ onSubmit, onClose }: TodoDialogProps) {
  const [date, setDate] = useState<Date>();
  const [selectedContactId, setSelectedContactId] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: contacts } = useContacts();

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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedContactId(e.target.value);
  };

  return (
    <div className="p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">Add to Todo List</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Assign to</label>
        <select
          className="w-full rounded-md border p-2"
          value={selectedContactId || ""}
          onChange={handleSelectChange}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">Select a contact</option>
          {contacts?.map((contact) => (
            <option key={contact.contact_id} value={contact.contact_id}>
              {contact.contact_profile?.first_name} {contact.contact_profile?.last_name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Due Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="start"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!date || !selectedContactId || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Todo"}
        </Button>
      </div>
    </div>
  );
}
