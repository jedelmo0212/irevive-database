export type UserRole = "admin" | "csr" | "technician";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export type WorkWeek = "Week 1" | "Week 2" | "Week 3" | "Week 4";

export type ModeOfTransaction = "Lalamove" | "Courier" | "Walk-in";

export type ShippingStatus = "Received" | "In Transit";

export type RepairStatus = "Processing" | "Monitoring" | "Unit OK" | "RTO";

export interface RepairRecord {
  id: string;
  date: string;
  workWeek: WorkWeek;
  clientName: string;
  contactNo: string;
  unit: string;
  declaredIssue: string;
  repairCost: number;
  technicianInCharge: string;
  modeOfTransaction: ModeOfTransaction;
  shippingStatus: ShippingStatus;
  repairStatus: RepairStatus;
  repairReport: string;
  updatedByTechnician?: boolean;
  createdAt: string;
  updatedAt: string;
}