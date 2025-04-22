
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Todo } from "@/hooks/use-todos";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Textarea } from "../ui/textarea";
import { ContactSelect } from "../chat/message/todo/components/ContactSelect";

interface TodoEditorProps {
  todo: Todo & { 
    profiles: { first_name: string | null; last_name: string | null },
    conversation_participants?: Array<{ id: string; first_name: string | null; last_name: string | null }>
  };
  onUpdate: (data: { 
    assigned_to?: string; 
    due_date?: Date; 
    status?: 'pending' | 'completed';
    comment?: string;
  }) => void;
  onClose: () => void;
}

export function TodoEditor({ todo, onUpdate, onClose }: TodoEditorProps) {
  const [date, setDate] = useState<Date | undefined>(new Date(todo.due_date));
  const [comment, setComment] = useState(todo.comment || '');
  const [selectedContactId, setSelectedContactId] = useState<string>(todo.assigned_to);

  const handleSave = () => {
    const updates: {
      due_date?: Date;
      comment?: string;
      assigned_to?: string;
    } = {};

    if (date) updates.due_date = date;
    if (comment !== todo.comment) updates.comment = comment;
    if (selectedContactId !== todo.assigned_to) updates.assigned_to = selectedContactId;

    onUpdate(updates);
    onClose();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Assigned To</label>
        <ContactSelect
          selectedContactId={selectedContactId}
          onSelect={setSelectedContactId}
        />
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
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Comment</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
