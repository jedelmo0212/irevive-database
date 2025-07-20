import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/auth-context";
import { useRepair } from "@/lib/context/repair-context";
import { RepairForm } from "@/components/repair/repair-form";
import { RepairFilters } from "@/components/repair/repair-filters";
import { RepairRecord, RepairStatus } from "@/lib/types";

export default function RepairsPage() {
  const { user } = useAuth();
  const { repairs, filterRepairs, clearHighlight, exportToExcel } = useRepair();
  const [filteredRepairs, setFilteredRepairs] = useState<RepairRecord[]>(repairs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | undefined>(undefined);
  const navigate = useNavigate();

  const isTechnician = user?.role === "technician";

  useEffect(() => {
    setFilteredRepairs(repairs);
  }, [repairs]);

  const handleFilter = (filters: {
    workWeek?: string;
    technicianInCharge?: string;
    date?: string;
  }) => {
    setFilteredRepairs(filterRepairs(filters));
  };

  const handleRowClick = (repair: RepairRecord) => {
    setSelectedRepair(repair);
    if (repair.updatedByTechnician && (user?.role === "admin" || user?.role === "csr")) {
      clearHighlight(repair.id);
    }
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case "Processing":
        return "bg-blue-500 hover:bg-blue-600";
      case "Monitoring":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Unit OK":
        return "bg-green-500 hover:bg-green-600";
      case "RTO":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const columns: ColumnDef<RepairRecord>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), "MMM d, yyyy"),
    },
    {
      accessorKey: "workWeek",
      header: "Work Week",
    },
    {
      accessorKey: "clientName",
      header: "Client Name",
      cell: ({ row }) => (
        <span className={row.original.updatedByTechnician ? "text-highlight font-medium" : ""}>
          {row.original.clientName}
        </span>
      ),
    },
    {
      accessorKey: "unit",
      header: "Unit",
    },
    {
      accessorKey: "technicianInCharge",
      header: "Technician",
    },
    {
      accessorKey: "repairStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={`${getStatusColor(row.original.repairStatus)} text-white`}>
          {row.original.repairStatus}
        </Badge>
      ),
    },
    ...(isTechnician
      ? []
      : [
          {
            accessorKey: "repairCost",
            header: "Cost",
            cell: ({ row }) => (
              <span>₱{row.original.repairCost.toLocaleString()}</span>
            ),
          } as ColumnDef<RepairRecord>,
        ]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Repair Records</h2>
          <p className="text-muted-foreground">
            Manage and track all repair orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Button onClick={exportToExcel} variant="outline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Export to Excel
            </Button>
          )}
          {!isTechnician && (
            <Button onClick={() => {
              setSelectedRepair(undefined);
              setIsDialogOpen(true);
            }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <line x1="12" x2="12" y1="5" y2="19" />
                <line x1="5" x2="19" y1="12" y2="12" />
              </svg>
              Add Record
            </Button>
          )}
        </div>
      </div>

      <RepairFilters onFilter={handleFilter} />

      <DataTable
        columns={columns}
        data={filteredRepairs}
        searchKey="clientName"
        onRowClick={handleRowClick}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRepair ? "Edit Repair Record" : "Add New Repair Record"}
            </DialogTitle>
            <DialogDescription>
              {selectedRepair
                ? "Update the details of this repair record."
                : "Fill in the details to create a new repair record."}
            </DialogDescription>
          </DialogHeader>
          <RepairForm
            repair={selectedRepair}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}