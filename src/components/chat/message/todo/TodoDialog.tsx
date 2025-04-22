
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TodoDialogProps {
  onSubmit: (assignedTo: string, dueDate: Date) => void;
  onClose: () => void;
}

export function TodoDialog({ onSubmit, onClose }: TodoDialogProps) {
  const [date, setDate] = useState<Date>();
  const [selectedContactId, setSelectedContactId] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: contacts, isLoading: isLoadingContacts } = useContacts();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleYearSelect = (year: string) => {
    if (!date) {
      const newDate = new Date();
      newDate.setFullYear(parseInt(year));
      newDate.setDate(1);
      setDate(newDate);
      return;
    }

    const newDate = new Date(date);
    newDate.setFullYear(parseInt(year));
    
    const daysInMonth = new Date(parseInt(year), date.getMonth() + 1, 0).getDate();
    if (date.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    setDate(newDate);
  };

  const handleMonthSelect = (monthName: string) => {
    if (!date) {
      const newDate = new Date();
      newDate.setMonth(months.indexOf(monthName));
      newDate.setDate(1);
      setDate(newDate);
      return;
    }

    const newDate = new Date(date);
    const newMonth = months.indexOf(monthName);
    
    const daysInMonth = new Date(date.getFullYear(), newMonth + 1, 0).getDate();
    if (date.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    newDate.setMonth(newMonth);
    setDate(newDate);
  };

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

  const handleWrapperClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className="p-6 space-y-4" 
      onClick={handleWrapperClick}
      onMouseDown={handleWrapperClick}
    >
      <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">
        Add to Todo List
      </h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Assign to</label>
        <Select
          value={selectedContactId}
          onValueChange={setSelectedContactId}
          disabled={isLoadingContacts}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a contact" />
          </SelectTrigger>
          <SelectContent>
            {contacts?.map((contact) => (
              <SelectItem 
                key={contact.contact_id} 
                value={contact.contact_id}
              >
                {contact.contact_profile?.first_name} {contact.contact_profile?.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              onClick={handleWrapperClick}
              onMouseDown={handleWrapperClick}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="start"
            onMouseDown={handleWrapperClick}
          >
            <div className="flex gap-2 border-b p-3">
              <Select 
                value={date ? months[date.getMonth()] : undefined}
                onValueChange={handleMonthSelect}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={date ? date.getFullYear().toString() : undefined}
                onValueChange={handleYearSelect}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          onMouseDown={handleWrapperClick}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          onMouseDown={handleWrapperClick}
          disabled={!date || !selectedContactId || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Todo"}
        </Button>
      </div>
    </div>
  );
}
