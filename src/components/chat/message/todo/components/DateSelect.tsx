
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import { useDateSelect } from "@/hooks/use-date-select";

interface DateSelectProps {
  date?: Date;
  onSelect: (date: Date) => void;
  disabled?: boolean;
}

export function DateSelect({ date, onSelect, disabled }: DateSelectProps) {
  const {
    selectedDate,
    years,
    months,
    handleYearSelect,
    handleMonthSelect,
    handleDateSelect,
  } = useDateSelect(date, onSelect);

  return (
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
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 pointer-events-auto z-[99999]" 
          align="start"
        >
          <div className="flex gap-2 border-b p-3">
            <Select 
              value={selectedDate ? months[selectedDate.getMonth()] : undefined}
              onValueChange={handleMonthSelect}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto z-[99999]">
                {months.map((month) => (
                  <SelectItem 
                    key={month} 
                    value={month}
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedDate ? selectedDate.getFullYear().toString() : undefined}
              onValueChange={handleYearSelect}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto z-[99999]">
                {years.map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year.toString()}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            month={selectedDate}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
