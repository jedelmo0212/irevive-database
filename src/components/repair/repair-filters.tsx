import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useRepair } from "@/lib/context/repair-context";

interface RepairFiltersProps {
  onFilter: (filters: { workWeek?: string; technicianInCharge?: string; date?: string }) => void;
}

export function RepairFilters({ onFilter }: RepairFiltersProps) {
  const { technicians } = useRepair();
  const [filters, setFilters] = useState({
    workWeek: "All",
    technicianInCharge: "All",
    date: "",
  });
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      handleFilterChange("date", formattedDate);
    } else {
      handleFilterChange("date", "");
    }
  };

  const clearFilters = () => {
    setFilters({
      workWeek: "All",
      technicianInCharge: "All",
      date: "",
    });
    setDate(undefined);
    onFilter({
      workWeek: "All",
      technicianInCharge: "All",
      date: "",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="space-y-1">
        <p className="text-sm font-medium">Work Week</p>
        <Select
          value={filters.workWeek}
          onValueChange={(value) => handleFilterChange("workWeek", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Weeks</SelectItem>
            <SelectItem value="Week 1">Week 1</SelectItem>
            <SelectItem value="Week 2">Week 2</SelectItem>
            <SelectItem value="Week 3">Week 3</SelectItem>
            <SelectItem value="Week 4">Week 4</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium">Technician</p>
        <Select
          value={filters.technicianInCharge}
          onValueChange={(value) => handleFilterChange("technicianInCharge", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by technician" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Technicians</SelectItem>
            {technicians.map((tech) => (
              <SelectItem key={tech} value={tech}>
                {tech}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium">Date</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : "Select date"}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex items-end">
        <Button variant="ghost" onClick={clearFilters} className="h-10">
          Clear Filters
        </Button>
      </div>
    </div>
  );
}