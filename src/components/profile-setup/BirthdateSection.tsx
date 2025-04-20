import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BirthdateSectionProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function BirthdateSection({ form }: BirthdateSectionProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    form.getValues("birthdate") ? new Date(form.getValues("birthdate")) : undefined
  );

  const handleYearSelect = (year: string) => {
    if (!selectedDate) {
      const newDate = new Date();
      newDate.setFullYear(parseInt(year));
      newDate.setDate(1);
      setSelectedDate(newDate);
      form.setValue("birthdate", format(newDate, "yyyy-MM-dd"));
      return;
    }

    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year));
    
    // Check if the day exists in the new month/year
    const daysInMonth = new Date(parseInt(year), selectedDate.getMonth() + 1, 0).getDate();
    if (selectedDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    setSelectedDate(newDate);
    form.setValue("birthdate", format(newDate, "yyyy-MM-dd"));
  };

  const handleMonthSelect = (monthName: string) => {
    if (!selectedDate) {
      const newDate = new Date();
      newDate.setMonth(months.indexOf(monthName));
      newDate.setDate(1);
      setSelectedDate(newDate);
      form.setValue("birthdate", format(newDate, "yyyy-MM-dd"));
      return;
    }

    const newDate = new Date(selectedDate);
    const newMonth = months.indexOf(monthName);
    
    // Check if the day exists in the new month
    const daysInMonth = new Date(selectedDate.getFullYear(), newMonth + 1, 0).getDate();
    if (selectedDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    newDate.setMonth(newMonth);
    setSelectedDate(newDate);
    form.setValue("birthdate", format(newDate, "yyyy-MM-dd"));
  };

  return (
    <FormField
      control={form.control}
      name="birthdate"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Date of Birth</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(new Date(field.value), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex gap-2 border-b p-3">
                <Select 
                  onValueChange={handleMonthSelect}
                  value={selectedDate ? months[selectedDate.getMonth()] : undefined}
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
                  onValueChange={handleYearSelect}
                  value={selectedDate ? selectedDate.getFullYear().toString() : undefined}
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
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                month={selectedDate}
                className={cn("p-3")}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
