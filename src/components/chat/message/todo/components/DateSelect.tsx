
import { useState } from "react";
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

interface DateSelectProps {
  date?: Date;
  onSelect: (date: Date) => void;
  disabled?: boolean;
}

export function DateSelect({ date, onSelect, disabled }: DateSelectProps) {
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
      onSelect(newDate);
      return;
    }

    const newDate = new Date(date);
    newDate.setFullYear(parseInt(year));
    
    const daysInMonth = new Date(parseInt(year), date.getMonth() + 1, 0).getDate();
    if (date.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    onSelect(newDate);
  };

  const handleMonthSelect = (monthName: string) => {
    if (!date) {
      const newDate = new Date();
      newDate.setMonth(months.indexOf(monthName));
      newDate.setDate(1);
      onSelect(newDate);
      return;
    }

    const newDate = new Date(date);
    const newMonth = months.indexOf(monthName);
    
    const daysInMonth = new Date(date.getFullYear(), newMonth + 1, 0).getDate();
    if (date.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    newDate.setMonth(newMonth);
    onSelect(newDate);
  };

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
            onMouseDown={(e) => e.stopPropagation()}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 pointer-events-auto z-[99999]" 
          align="start"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 border-b p-3">
            <Select 
              value={date ? months[date.getMonth()] : undefined}
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
                    onMouseDown={(e) => e.stopPropagation()}
                  >
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
              <SelectContent className="pointer-events-auto z-[99999]">
                {years.map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year.toString()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
