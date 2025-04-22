
import { useState } from "react";

export function useDateSelect(initialDate?: Date, onChange?: (date: Date) => void) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);

  const handleYearSelect = (year: string) => {
    if (!selectedDate) {
      const newDate = new Date();
      newDate.setFullYear(parseInt(year));
      newDate.setDate(1);
      setSelectedDate(newDate);
      onChange?.(newDate);
      return;
    }

    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year));
    
    const daysInMonth = new Date(parseInt(year), selectedDate.getMonth() + 1, 0).getDate();
    if (selectedDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  const handleMonthSelect = (monthName: string) => {
    if (!selectedDate) {
      const newDate = new Date();
      newDate.setMonth(months.indexOf(monthName));
      newDate.setDate(1);
      setSelectedDate(newDate);
      onChange?.(newDate);
      return;
    }

    const newDate = new Date(selectedDate);
    const newMonth = months.indexOf(monthName);
    
    const daysInMonth = new Date(selectedDate.getFullYear(), newMonth + 1, 0).getDate();
    if (selectedDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }
    
    newDate.setMonth(newMonth);
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      onChange?.(date);
    }
  };

  return {
    selectedDate,
    years,
    months,
    handleYearSelect,
    handleMonthSelect,
    handleDateSelect,
    currentYear
  };
}
