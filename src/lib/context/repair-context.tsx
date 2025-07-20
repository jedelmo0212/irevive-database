import React, { createContext, useContext, useState, useEffect } from 'react';
import { RepairRecord, User, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase, REPAIRS_TABLE, TECHNICIANS_TABLE, USERS_TABLE } from '../supabase';
import { toast } from 'sonner';

interface RepairContextType {
  repairs: RepairRecord[];
  addRepair: (repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRepair: (id: string, repair: Partial<RepairRecord>, userRole?: UserRole) => Promise<void>;
  deleteRepair: (id: string) => Promise<void>;
  getRepairById: (id: string) => RepairRecord | undefined;
  clearHighlight: (id: string) => Promise<void>;
  totalSales: number;
  technicians: string[];
  addTechnician: (name: string) => Promise<void>;
  removeTechnician: (name: string) => Promise<void>;
  users: Record<string, { id: string; name: string; role: UserRole; password: string }>;
  addUser: (username: string, name: string, role: UserRole, password: string) => Promise<void>;
  removeUser: (username: string) => Promise<void>;
  filterRepairs: (filters: { workWeek?: string; technicianInCharge?: string; date?: string }) => RepairRecord[];
  exportToExcel: () => void;
  loading: boolean;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

export const useRepair = () => {
  const context = useContext(RepairContext);
  if (!context) {
    throw new Error('useRepair must be used within a RepairProvider');
  }
  return context;
};

export const RepairProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [users, setUsers] = useState<Record<string, { id: string; name: string; role: UserRole; password: string }>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load data from Supabase (with fallback to localStorage) on component mount
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load repairs
        const { data: repairsData, error: repairsError } = await supabase
          .from(REPAIRS_TABLE)
          .select('*');
        
        if (repairsError) {
          console.error('Error loading repairs:', repairsError);
          loadFromLocalStorage();
          return;
        }
        
        // Convert snake_case to camelCase
        const formattedRepairs: RepairRecord[] = repairsData.map(record => ({
          id: record.id,
          date: record.date,
          workWeek: record.work_week,
          clientName: record.client_name,
          contactNo: record.contact_no,
          unit: record.unit,
          declaredIssue: record.declared_issue,
          repairCost: record.repair_cost,
          technicianInCharge: record.technician_in_charge,
          modeOfTransaction: record.mode_of_transaction,
          shippingStatus: record.shipping_status,
          repairStatus: record.repair_status,
          repairReport: record.repair_report,
          updatedByTechnician: record.updated_by_technician || false,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }));
        
        setRepairs(formattedRepairs);
        
        // Load technicians
        const { data: techniciansData, error: techniciansError } = await supabase
          .from(TECHNICIANS_TABLE)
          .select('name');
        
        if (techniciansError) {
          console.error('Error loading technicians:', techniciansError);
          const storedTechnicians = localStorage.getItem('irevive_technicians');
          if (storedTechnicians) {
            setTechnicians(JSON.parse(storedTechnicians));
          }
        } else {
          setTechnicians(techniciansData.map(tech => tech.name));
        }
        
        // Load users
        const { data: usersData, error: usersError } = await supabase
          .from(USERS_TABLE)
          .select('*');
        
        if (usersError) {
          console.error('Error loading users:', usersError);
          const storedUsers = localStorage.getItem('irevive_users');
          if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
          }
        } else {
          const usersObject: Record<string, { id: string; name: string; role: UserRole; password: string }> = {};
          usersData.forEach(user => {
            usersObject[user.username] = {
              id: user.id,
              name: user.name,
              role: user.role as UserRole,
              password: user.password
            };
          });
          setUsers(usersObject);
        }
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Load data from localStorage as fallback
  const loadFromLocalStorage = () => {
    try {
      toast.error('Using local storage due to database connection issues');
      
      const storedRepairs = localStorage.getItem('irevive_repairs');
      if (storedRepairs) {
        setRepairs(JSON.parse(storedRepairs));
      }
      
      const storedTechnicians = localStorage.getItem('irevive_technicians');
      if (storedTechnicians) {
        setTechnicians(JSON.parse(storedTechnicians));
      } else {
        setTechnicians(['John Doe', 'Jane Smith', 'Mike Johnson']);
      }
      
      const storedUsers = localStorage.getItem('irevive_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate total sales
  const totalSales = repairs.reduce((sum, repair) => sum + repair.repairCost, 0);
  
  // Save data to both Supabase and localStorage for redundancy
  const saveRepairs = async (updatedRepairs: RepairRecord[]) => {
    try {
      // Save to localStorage as backup
      localStorage.setItem('irevive_repairs', JSON.stringify(updatedRepairs));
      
      // We don't need to save all repairs to Supabase since we're handling individual operations
    } catch (error) {
      console.error('Error saving repairs:', error);
    }
  };
  
  const saveTechnicians = async (updatedTechnicians: string[]) => {
    try {
      // Save to localStorage as backup
      localStorage.setItem('irevive_technicians', JSON.stringify(updatedTechnicians));
    } catch (error) {
      console.error('Error saving technicians:', error);
    }
  };
  
  const saveUsers = async (updatedUsers: Record<string, { id: string; name: string; role: UserRole; password: string }>) => {
    try {
      // Save to localStorage as backup
      localStorage.setItem('irevive_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };
  
  const addRepair = async (repair: Omit<RepairRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const repairId = uuidv4();
      
      // Insert into Supabase
      const { error } = await supabase
        .from(REPAIRS_TABLE)
        .insert({
          id: repairId,
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
          updated_by_technician: false,
          created_at: now,
          updated_at: now
        });
      
      if (error) {
        console.error('Error adding repair to Supabase:', error);
        toast.error('Failed to save repair online. Saving locally.');
      }
      
      // Update local state
      const newRepair: RepairRecord = {
        ...repair,
        id: repairId,
        createdAt: now,
        updatedAt: now,
      };
      
      const updatedRepairs = [...repairs, newRepair];
      setRepairs(updatedRepairs);
      saveRepairs(updatedRepairs);
      
      toast.success('Repair record added successfully');
    } catch (error) {
      console.error('Error adding repair:', error);
      toast.error('Failed to add repair');
    }
  };
  
  const updateRepair = async (id: string, repairUpdate: Partial<RepairRecord>, userRole?: UserRole) => {
    try {
      const now = new Date().toISOString();
      
      // Prepare the update object for Supabase (convert camelCase to snake_case)
      const updateObject: Record<string, string | number | boolean> = {
        updated_at: now
      };
      
      // Set updatedByTechnician flag if the user is a technician
      const updatedByTechnician = userRole === 'technician';
      updateObject.updated_by_technician = updatedByTechnician;
      
      // Map other properties
      if ('date' in repairUpdate) updateObject.date = repairUpdate.date;
      if ('workWeek' in repairUpdate) updateObject.work_week = repairUpdate.workWeek;
      if ('clientName' in repairUpdate) updateObject.client_name = repairUpdate.clientName;
      if ('contactNo' in repairUpdate) updateObject.contact_no = repairUpdate.contactNo;
      if ('unit' in repairUpdate) updateObject.unit = repairUpdate.unit;
      if ('declaredIssue' in repairUpdate) updateObject.declared_issue = repairUpdate.declaredIssue;
      if ('repairCost' in repairUpdate) updateObject.repair_cost = repairUpdate.repairCost;
      if ('technicianInCharge' in repairUpdate) updateObject.technician_in_charge = repairUpdate.technicianInCharge;
      if ('modeOfTransaction' in repairUpdate) updateObject.mode_of_transaction = repairUpdate.modeOfTransaction;
      if ('shippingStatus' in repairUpdate) updateObject.shipping_status = repairUpdate.shippingStatus;
      if ('repairStatus' in repairUpdate) updateObject.repair_status = repairUpdate.repairStatus;
      if ('repairReport' in repairUpdate) updateObject.repair_report = repairUpdate.repairReport;
      
      // Update in Supabase
      const { error } = await supabase
        .from(REPAIRS_TABLE)
        .update(updateObject)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating repair in Supabase:', error);
        toast.error('Failed to update repair online. Updating locally only.');
      }
      
      // Update local state
      const updatedRepairs = repairs.map(repair => {
        if (repair.id === id) {
          return {
            ...repair,
            ...repairUpdate,
            updatedByTechnician: updatedByTechnician || repair.updatedByTechnician,
            updatedAt: now
          };
        }
        return repair;
      });
      
      setRepairs(updatedRepairs);
      saveRepairs(updatedRepairs);
      
      toast.success('Repair record updated successfully');
    } catch (error) {
      console.error('Error updating repair:', error);
      toast.error('Failed to update repair');
    }
  };
  
  const deleteRepair = async (id: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from(REPAIRS_TABLE)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting repair from Supabase:', error);
        toast.error('Failed to delete repair online. Removing from local view only.');
      }
      
      // Update local state
      const updatedRepairs = repairs.filter(repair => repair.id !== id);
      setRepairs(updatedRepairs);
      saveRepairs(updatedRepairs);
      
      toast.success('Repair record deleted successfully');
    } catch (error) {
      console.error('Error deleting repair:', error);
      toast.error('Failed to delete repair');
    }
  };
  
  const getRepairById = (id: string) => {
    return repairs.find(repair => repair.id === id);
  };
  
  const clearHighlight = async (id: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from(REPAIRS_TABLE)
        .update({ updated_by_technician: false })
        .eq('id', id);
      
      if (error) {
        console.error('Error clearing highlight in Supabase:', error);
      }
      
      // Update local state
      const updatedRepairs = repairs.map(repair => {
        if (repair.id === id && repair.updatedByTechnician) {
          return {
            ...repair,
            updatedByTechnician: false
          };
        }
        return repair;
      });
      
      setRepairs(updatedRepairs);
      saveRepairs(updatedRepairs);
    } catch (error) {
      console.error('Error clearing highlight:', error);
    }
  };
  
  const addTechnician = async (name: string) => {
    try {
      if (!technicians.includes(name)) {
        // Add to Supabase
        const { error } = await supabase
          .from(TECHNICIANS_TABLE)
          .insert({ name });
        
        if (error) {
          console.error('Error adding technician to Supabase:', error);
          toast.error('Failed to add technician online. Adding locally only.');
        }
        
        // Update local state
        const updatedTechnicians = [...technicians, name];
        setTechnicians(updatedTechnicians);
        saveTechnicians(updatedTechnicians);
        
        toast.success('Technician added successfully');
      } else {
        toast.error('Technician already exists');
      }
    } catch (error) {
      console.error('Error adding technician:', error);
      toast.error('Failed to add technician');
    }
  };
  
  const removeTechnician = async (name: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from(TECHNICIANS_TABLE)
        .delete()
        .eq('name', name);
      
      if (error) {
        console.error('Error removing technician from Supabase:', error);
        toast.error('Failed to remove technician online. Removing locally only.');
      }
      
      // Update local state
      const updatedTechnicians = technicians.filter(tech => tech !== name);
      setTechnicians(updatedTechnicians);
      saveTechnicians(updatedTechnicians);
      
      toast.success('Technician removed successfully');
    } catch (error) {
      console.error('Error removing technician:', error);
      toast.error('Failed to remove technician');
    }
  };
  
  const addUser = async (username: string, name: string, role: UserRole, password: string) => {
    try {
      const userId = uuidv4();
      
      // Add to Supabase
      const { error } = await supabase
        .from(USERS_TABLE)
        .insert({
          id: userId,
          username,
          name,
          role,
          password
        });
      
      if (error) {
        console.error('Error adding user to Supabase:', error);
        toast.error('Failed to add user online. Adding locally only.');
      }
      
      // Update local state
      const updatedUsers = {
        ...users,
        [username]: {
          id: userId,
          name,
          role,
          password
        }
      };
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      
      toast.success('User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };
  
  const removeUser = async (username: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from(USERS_TABLE)
        .delete()
        .eq('username', username);
      
      if (error) {
        console.error('Error removing user from Supabase:', error);
        toast.error('Failed to remove user online. Removing locally only.');
      }
      
      // Update local state
      const { [username]: _, ...rest } = users;
      setUsers(rest);
      saveUsers(rest);
      
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  // Filter repairs based on work week, technician, or date
  const filterRepairs = (filters: { workWeek?: string; technicianInCharge?: string; date?: string }) => {
    return repairs.filter(repair => {
      let match = true;
      
      if (filters.workWeek && filters.workWeek !== 'All') {
        match = match && repair.workWeek === filters.workWeek;
      }
      
      if (filters.technicianInCharge && filters.technicianInCharge !== 'All') {
        match = match && repair.technicianInCharge === filters.technicianInCharge;
      }
      
      if (filters.date) {
        match = match && repair.date === filters.date;
      }
      
      return match;
    });
  };

  // Export data to Excel
  const exportToExcel = () => {
    // This is a simplified version - in a real implementation, you'd use a library like xlsx
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Date,Work Week,Client Name,Contact No,Unit,Declared Issue,Repair Cost,Technician,Mode of Transaction,Shipping Status,Repair Status,Repair Report\n" + 
      repairs.map(r => {
        return `"${r.id}","${r.date}","${r.workWeek}","${r.clientName}","${r.contactNo}","${r.unit}","${r.declaredIssue}","₱${r.repairCost}","${r.technicianInCharge}","${r.modeOfTransaction}","${r.shippingStatus}","${r.repairStatus}","${r.repairReport}"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "irevive_repairs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <RepairContext.Provider value={{
      repairs,
      addRepair,
      updateRepair,
      deleteRepair,
      getRepairById,
      clearHighlight,
      totalSales,
      technicians,
      addTechnician,
      removeTechnician,
      users,
      addUser,
      removeUser,
      filterRepairs,
      exportToExcel,
      loading
    }}>
      {children}
    </RepairContext.Provider>
  );
};