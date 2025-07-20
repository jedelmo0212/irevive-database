import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRepair } from "@/lib/context/repair-context";
import { useAuth } from "@/lib/context/auth-context";
import { ModeOfTransaction, RepairRecord, RepairStatus, ShippingStatus, WorkWeek } from "@/lib/types";

interface RepairFormProps {
  repair?: RepairRecord;
  onSuccess: () => void;
}

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required",
  }),
  workWeek: z.string({
    required_error: "Please select a work week",
  }),
  clientName: z.string().min(1, "Client name is required"),
  contactNo: z.string().min(1, "Contact number is required"),
  unit: z.string().min(1, "Unit details are required"),
  declaredIssue: z.string().min(1, "Issue description is required"),
  repairCost: z.number().min(0, "Repair cost must be a valid number"),
  technicianInCharge: z.string({
    required_error: "Please select a technician",
  }),
  modeOfTransaction: z.string({
    required_error: "Please select a mode of transaction",
  }),
  shippingStatus: z.string({
    required_error: "Please select a shipping status",
  }),
  repairStatus: z.string({
    required_error: "Please select a repair status",
  }),
  repairReport: z.string().optional(),
});

export function RepairForm({ repair, onSuccess }: RepairFormProps) {
  const { user } = useAuth();
  const { addRepair, updateRepair, technicians } = useRepair();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: repair
      ? {
          date: new Date(repair.date),
          workWeek: repair.workWeek,
          clientName: repair.clientName,
          contactNo: repair.contactNo,
          unit: repair.unit,
          declaredIssue: repair.declaredIssue,
          repairCost: repair.repairCost,
          technicianInCharge: repair.technicianInCharge,
          modeOfTransaction: repair.modeOfTransaction,
          shippingStatus: repair.shippingStatus,
          repairStatus: repair.repairStatus,
          repairReport: repair.repairReport,
        }
      : {
          date: new Date(),
          workWeek: "Week 1" as WorkWeek,
          clientName: "",
          contactNo: "",
          unit: "",
          declaredIssue: "",
          repairCost: 0,
          technicianInCharge: "",
          modeOfTransaction: "Walk-in" as ModeOfTransaction,
          shippingStatus: "Received" as ShippingStatus,
          repairStatus: "Processing" as RepairStatus,
          repairReport: "",
        },
  });

  // Check if user is a technician - they can only edit certain fields
  const isTechnician = user?.role === "technician";

  // Check what fields a technician can edit
  const canEditRepairStatus = true;
  const canEditRepairReport = true;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (repair) {
        // Update existing repair record
        if (isTechnician) {
          // Technician can only update specific fields
          updateRepair(
            repair.id,
            {
              repairStatus: values.repairStatus as RepairStatus,
              repairReport: values.repairReport,
            },
            user.role
          );
        } else {
          // Admin/CSR can update all fields
          updateRepair(
            repair.id,
            {
              date: format(values.date, "yyyy-MM-dd"),
              workWeek: values.workWeek as WorkWeek,
              clientName: values.clientName,
              contactNo: values.contactNo,
              unit: values.unit,
              declaredIssue: values.declaredIssue,
              repairCost: values.repairCost,
              technicianInCharge: values.technicianInCharge,
              modeOfTransaction: values.modeOfTransaction as ModeOfTransaction,
              shippingStatus: values.shippingStatus as ShippingStatus,
              repairStatus: values.repairStatus as RepairStatus,
              repairReport: values.repairReport,
            },
            user.role
          );
        }
      } else {
        // Add new repair record
        addRepair({
          date: format(values.date, "yyyy-MM-dd"),
          workWeek: values.workWeek as WorkWeek,
          clientName: values.clientName,
          contactNo: values.contactNo,
          unit: values.unit,
          declaredIssue: values.declaredIssue,
          repairCost: values.repairCost,
          technicianInCharge: values.technicianInCharge,
          modeOfTransaction: values.modeOfTransaction as ModeOfTransaction,
          shippingStatus: values.shippingStatus as ShippingStatus,
          repairStatus: values.repairStatus as RepairStatus,
          repairReport: values.repairReport || "",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting repair form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date field */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isTechnician}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Work Week field */}
          <FormField
            control={form.control}
            name="workWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Week</FormLabel>
                <Select
                  disabled={isTechnician}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a work week" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Week 1">Week 1</SelectItem>
                    <SelectItem value="Week 2">Week 2</SelectItem>
                    <SelectItem value="Week 3">Week 3</SelectItem>
                    <SelectItem value="Week 4">Week 4</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Client Name field */}
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input disabled={isTechnician} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact No field */}
          <FormField
            control={form.control}
            name="contactNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact No</FormLabel>
                <FormControl>
                  <Input disabled={isTechnician} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit field */}
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input disabled={isTechnician} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Declared Issue field */}
          <FormField
            control={form.control}
            name="declaredIssue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Declared Issue</FormLabel>
                <FormControl>
                  <Textarea disabled={isTechnician} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Repair Cost field - only for Admin and CSR */}
          {!isTechnician && (
            <FormField
              control={form.control}
              name="repairCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repair Cost (₱)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Technician in Charge field */}
          <FormField
            control={form.control}
            name="technicianInCharge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technician in Charge</FormLabel>
                <Select
                  disabled={isTechnician}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a technician" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech} value={tech}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mode of Transaction field */}
          <FormField
            control={form.control}
            name="modeOfTransaction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mode of Transaction</FormLabel>
                <Select
                  disabled={isTechnician}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode of transaction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Lalamove">Lalamove</SelectItem>
                    <SelectItem value="Courier">Courier</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Shipping Status field */}
          <FormField
            control={form.control}
            name="shippingStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Status</FormLabel>
                <Select
                  disabled={isTechnician}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shipping status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Repair Status field */}
          <FormField
            control={form.control}
            name="repairStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repair Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isTechnician && !canEditRepairStatus}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repair status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Monitoring">Monitoring</SelectItem>
                    <SelectItem value="Unit OK">Unit OK</SelectItem>
                    <SelectItem value="RTO">RTO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Repair Report field */}
          <FormField
            control={form.control}
            name="repairReport"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Repair Report</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isTechnician && !canEditRepairReport}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : repair ? "Update Repair" : "Add Repair"}
        </Button>
      </form>
    </Form>
  );
}