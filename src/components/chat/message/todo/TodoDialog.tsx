
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (assignedTo: string, dueDate: Date) => void;
}

export function TodoDialog({ open, onOpenChange, onSubmit }: TodoDialogProps) {
  const [date, setDate] = useState<Date>();
  const [selectedContactId, setSelectedContactId] = useState<string>();
  const { data: contacts } = useContacts();

  const handleSubmit = () => {
    if (date && selectedContactId) {
      onSubmit(selectedContactId, date);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Todo List</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Assign to</label>
            <select
              className="w-full rounded-md border p-2"
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
            >
              <option value="">Select a contact</option>
              {contacts?.map((contact) => (
                <option key={contact.contact_id} value={contact.contact_id}>
                  {contact.contact_profile?.first_name} {contact.contact_profile?.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!date || !selectedContactId}>
            Add Todo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
