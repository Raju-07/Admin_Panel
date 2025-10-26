import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      showOutsideDays
      className="rounded-lg border bg-white p-2"
    />
  );
}