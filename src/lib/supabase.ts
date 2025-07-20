import { createClient } from '@supabase/supabase-js';
import { RepairRecord, User } from './types';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define database table names
export const USERS_TABLE = 'users';
export const REPAIRS_TABLE = 'repairs';
export const TECHNICIANS_TABLE = 'technicians';

// Utility functions for working with the database

export async function getUsers(): Promise<Record<string, { id: string; name: string; role: string; password: string }>> {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('id, username, name, role, password');
  
  if (error) {
    console.error('Error fetching users:', error);
    return {};
  }
  
  const usersMap: Record<string, { id: string; name: string; role: string; password: string }> = {};
  data.forEach(user => {
    usersMap[user.username] = {
      id: user.id,
      name: user.name,
      role: user.role,
      password: user.password
    };
  });
  
  return usersMap;
}

export async function addUser(username: string, name: string, role: string, password: string): Promise<boolean> {
  const { error } = await supabase
    .from(USERS_TABLE)
    .insert({
      username,
      name,
      role,
      password // In a real app, this should be hashed
    });
  
  if (error) {
    console.error('Error adding user:', error);
    return false;
  }
  
  return true;
}

export async function removeUser(username: string): Promise<boolean> {
  const { error } = await supabase
    .from(USERS_TABLE)
    .delete()
    .eq('username', username);
  
  if (error) {
    console.error('Error removing user:', error);
    return false;
  }
  
  return true;
}

export async function getRepairs(): Promise<RepairRecord[]> {
  const { data, error } = await supabase
    .from(REPAIRS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching repairs:', error);
    return [];
  }
  
  // Transform from snake_case to camelCase
  return data.map(repair => ({
    id: repair.id,
    date: repair.date,
    workWeek: repair.work_week,
    clientName: repair.client_name,
    contactNo: repair.contact_no,
    unit: repair.unit,
    declaredIssue: repair.declared_issue,
    repairCost: repair.repair_cost,
    technicianInCharge: repair.technician_in_charge,
    modeOfTransaction: repair.mode_of_transaction,
    shippingStatus: repair.shipping_status,
    repairStatus: repair.repair_status,
    repairReport: repair.repair_report,
    updatedByTechnician: repair.updated_by_technician,
    createdAt: repair.created_at,
    updatedAt: repair.updated_at
  }));
}

export async function addRepair(repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from(REPAIRS_TABLE)
    .insert({
      date: repair.date,
      work_week: repair.workWeek,
      client_name: repair.clientName,
      contact_no: repair.contactNo,
      unit: repair.unit,
      declared_issue: repair.declaredIssue,
      repair_cost: repair.repairCost,
      technician_in_charge: repair.technicianInCharge,
      mode_of_transaction: repair.modeOfTransaction,
      shipping_status: repair.shippingStatus,
      repair_status: repair.repairStatus,
      repair_report: repair.repairReport,
      updated_by_technician: repair.updatedByTechnician || false,
      created_at: now,
      updated_at: now
    });
  
  if (error) {
    console.error('Error adding repair:', error);
    return false;
  }
  
  return true;
}

export async function updateRepair(id: string, repairUpdate: Partial<RepairRecord>, userRole?: string): Promise<boolean> {
  // Transform from camelCase to snake_case
  const updateData: Record<string, string | number | boolean | null> = {};
  
  if ('date' in repairUpdate) updateData.date = repairUpdate.date;
  if ('workWeek' in repairUpdate) updateData.work_week = repairUpdate.workWeek;
  if ('clientName' in repairUpdate) updateData.client_name = repairUpdate.clientName;
  if ('contactNo' in repairUpdate) updateData.contact_no = repairUpdate.contactNo;
  if ('unit' in repairUpdate) updateData.unit = repairUpdate.unit;
  if ('declaredIssue' in repairUpdate) updateData.declared_issue = repairUpdate.declaredIssue;
  if ('repairCost' in repairUpdate) updateData.repair_cost = repairUpdate.repairCost;
  if ('technicianInCharge' in repairUpdate) updateData.technician_in_charge = repairUpdate.technicianInCharge;
  if ('modeOfTransaction' in repairUpdate) updateData.mode_of_transaction = repairUpdate.modeOfTransaction;
  if ('shippingStatus' in repairUpdate) updateData.shipping_status = repairUpdate.shippingStatus;
  if ('repairStatus' in repairUpdate) updateData.repair_status = repairUpdate.repairStatus;
  if ('repairReport' in repairUpdate) updateData.repair_report = repairUpdate.repairReport;
  
  // Set updatedByTechnician flag if the user is a technician
  if (userRole === 'technician') {
    updateData.updated_by_technician = true;
  }
  
  updateData.updated_at = new Date().toISOString();
  
  const { error } = await supabase
    .from(REPAIRS_TABLE)
    .update(updateData)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating repair:', error);
    return false;
  }
  
  return true;
}

export async function deleteRepair(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(REPAIRS_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting repair:', error);
    return false;
  }
  
  return true;
}

export async function clearHighlight(id: string): Promise<boolean> {
  const { error } = await supabase
    .from(REPAIRS_TABLE)
    .update({ updated_by_technician: false })
    .eq('id', id);
  
  if (error) {
    console.error('Error clearing highlight:', error);
    return false;
  }
  
  return true;
}

export async function getTechnicians(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TECHNICIANS_TABLE)
    .select('name')
    .order('name');
  
  if (error) {
    console.error('Error fetching technicians:', error);
    return [];
  }
  
  return data.map(tech => tech.name);
}

export async function addTechnician(name: string): Promise<boolean> {
  const { error } = await supabase
    .from(TECHNICIANS_TABLE)
    .insert({ name });
  
  if (error) {
    console.error('Error adding technician:', error);
    return false;
  }
  
  return true;
}

export async function removeTechnician(name: string): Promise<boolean> {
  const { error } = await supabase
    .from(TECHNICIANS_TABLE)
    .delete()
    .eq('name', name);
  
  if (error) {
    console.error('Error removing technician:', error);
    return false;
  }
  
  return true;
}

export async function filterRepairs(filters: { workWeek?: string; technicianInCharge?: string; date?: string }): Promise<RepairRecord[]> {
  let query = supabase.from(REPAIRS_TABLE).select('*');
  
  if (filters.workWeek && filters.workWeek !== 'All') {
    query = query.eq('work_week', filters.workWeek);
  }
  
  if (filters.technicianInCharge && filters.technicianInCharge !== 'All') {
    query = query.eq('technician_in_charge', filters.technicianInCharge);
  }
  
  if (filters.date) {
    query = query.eq('date', filters.date);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error filtering repairs:', error);
    return [];
  }
  
  // Transform from snake_case to camelCase
  return data.map(repair => ({
    id: repair.id,
    date: repair.date,
    workWeek: repair.work_week,
    clientName: repair.client_name,
    contactNo: repair.contact_no,
    unit: repair.unit,
    declaredIssue: repair.declared_issue,
    repairCost: repair.repair_cost,
    technicianInCharge: repair.technician_in_charge,
    modeOfTransaction: repair.mode_of_transaction,
    shippingStatus: repair.shipping_status,
    repairStatus: repair.repair_status,
    repairReport: repair.repair_report,
    updatedByTechnician: repair.updated_by_technician,
    createdAt: repair.created_at,
    updatedAt: repair.updated_at
  }));
}