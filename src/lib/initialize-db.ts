import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize the database with necessary tables and default data
 */
export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Create users table if it doesn't exist
    const { error: createUsersError } = await supabase.rpc(
      'create_table_if_not_exists',
      {
        table_name: 'users',
        table_definition: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        `
      }
    );
    
    if (createUsersError) {
      console.error("Error creating users table:", createUsersError);
      // Try creating table directly if RPC fails
      await createUsersTableDirectly();
    }
    
    // Create repairs table if it doesn't exist
    const { error: createRepairsError } = await supabase.rpc(
      'create_table_if_not_exists',
      {
        table_name: 'repairs',
        table_definition: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date TEXT NOT NULL,
          work_week TEXT NOT NULL,
          client_name TEXT NOT NULL,
          contact_no TEXT NOT NULL,
          unit TEXT NOT NULL,
          declared_issue TEXT NOT NULL,
          repair_cost NUMERIC NOT NULL,
          technician_in_charge TEXT NOT NULL,
          mode_of_transaction TEXT NOT NULL,
          shipping_status TEXT NOT NULL,
          repair_status TEXT NOT NULL,
          repair_report TEXT,
          updated_by_technician BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        `
      }
    );
    
    if (createRepairsError) {
      console.error("Error creating repairs table:", createRepairsError);
      // Try creating table directly if RPC fails
      await createRepairsTableDirectly();
    }
    
    // Create technicians table if it doesn't exist
    const { error: createTechniciansError } = await supabase.rpc(
      'create_table_if_not_exists',
      {
        table_name: 'technicians',
        table_definition: `
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL
        `
      }
    );
    
    if (createTechniciansError) {
      console.error("Error creating technicians table:", createTechniciansError);
      // Try creating table directly if RPC fails
      await createTechniciansTableDirectly();
    }
    
    // Check if admin user exists
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();
    
    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.error("Error checking for admin user:", adminCheckError);
    }
    
    // Insert admin user if it doesn't exist
    if (!adminUser) {
      const { error: insertAdminError } = await supabase
        .from('users')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          username: 'admin',
          password: 'admin121890',
          name: 'Administrator',
          role: 'admin'
        });
      
      if (insertAdminError) {
        console.error("Error inserting admin user:", insertAdminError);
      } else {
        console.log("Admin user created successfully");
      }
    }
    
    // Check if technicians exist
    const { data: technicians, error: techniciansError } = await supabase
      .from('technicians')
      .select('name');
    
    if (techniciansError) {
      console.error("Error checking for technicians:", techniciansError);
    }
    
    // Insert default technicians if none exist
    if (!technicians || technicians.length === 0) {
      const defaultTechnicians = [
        { name: 'John Doe' },
        { name: 'Jane Smith' },
        { name: 'Mike Johnson' }
      ];
      
      const { error: insertTechniciansError } = await supabase
        .from('technicians')
        .insert(defaultTechnicians);
      
      if (insertTechniciansError) {
        console.error("Error inserting default technicians:", insertTechniciansError);
      } else {
        console.log("Default technicians created successfully");
      }
    }
    
    // Migrate data from localStorage if available
    await migrateFromLocalStorage();
    
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}

/**
 * Create users table directly using CREATE TABLE
 */
async function createUsersTableDirectly() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error && error.code === 'PGRST204') {
      // Table doesn't exist, create it
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
    }
  } catch (error) {
    console.error("Error creating users table directly:", error);
  }
}

/**
 * Create repairs table directly using CREATE TABLE
 */
async function createRepairsTableDirectly() {
  try {
    const { error } = await supabase.from('repairs').select('id').limit(1);
    
    if (error && error.code === 'PGRST204') {
      // Table doesn't exist, create it
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS repairs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date TEXT NOT NULL,
            work_week TEXT NOT NULL,
            client_name TEXT NOT NULL,
            contact_no TEXT NOT NULL,
            unit TEXT NOT NULL,
            declared_issue TEXT NOT NULL,
            repair_cost NUMERIC NOT NULL,
            technician_in_charge TEXT NOT NULL,
            mode_of_transaction TEXT NOT NULL,
            shipping_status TEXT NOT NULL,
            repair_status TEXT NOT NULL,
            repair_report TEXT,
            updated_by_technician BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
          );
        `
      });
    }
  } catch (error) {
    console.error("Error creating repairs table directly:", error);
  }
}

/**
 * Create technicians table directly using CREATE TABLE
 */
async function createTechniciansTableDirectly() {
  try {
    const { error } = await supabase.from('technicians').select('id').limit(1);
    
    if (error && error.code === 'PGRST204') {
      // Table doesn't exist, create it
      await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS technicians (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
          );
        `
      });
    }
  } catch (error) {
    console.error("Error creating technicians table directly:", error);
  }
}

/**
 * Migrate data from localStorage to Supabase
 */
async function migrateFromLocalStorage() {
  try {
    // Migrate repairs
    const storedRepairs = localStorage.getItem('irevive_repairs');
    if (storedRepairs) {
      const repairs = JSON.parse(storedRepairs);
      
      for (const repair of repairs) {
        // Check if repair already exists in database
        const { data: existingRepair } = await supabase
          .from('repairs')
          .select('id')
          .eq('id', repair.id)
          .single();
        
        if (!existingRepair) {
          // Convert camelCase to snake_case
          const { error } = await supabase
            .from('repairs')
            .insert({
              id: repair.id,
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
              created_at: repair.createdAt,
              updated_at: repair.updatedAt
            });
          
          if (error) {
            console.error("Error migrating repair:", error);
          }
        }
      }
      
      console.log("Repairs migrated from localStorage to Supabase");
    }
    
    // Migrate technicians
    const storedTechnicians = localStorage.getItem('irevive_technicians');
    if (storedTechnicians) {
      const technicians = JSON.parse(storedTechnicians);
      
      for (const techName of technicians) {
        // Check if technician already exists in database
        const { data: existingTech } = await supabase
          .from('technicians')
          .select('name')
          .eq('name', techName)
          .single();
        
        if (!existingTech) {
          const { error } = await supabase
            .from('technicians')
            .insert({ name: techName });
          
          if (error) {
            console.error("Error migrating technician:", error);
          }
        }
      }
      
      console.log("Technicians migrated from localStorage to Supabase");
    }
    
    // Migrate users
    const storedUsers = localStorage.getItem('irevive_users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      
      for (const [username, userData] of Object.entries(users)) {
        // Check if user already exists in database
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single();
        
        if (!existingUser) {
          // Type the userData properly to avoid any type errors
          interface UserData {
            id?: string;
            password: string;
            name: string;
            role: string;
          }
          
          const typedUserData = userData as UserData;
          
          const { error } = await supabase
            .from('users')
            .insert({
              id: typedUserData.id || uuidv4(),
              username,
              password: typedUserData.password,
              name: typedUserData.name,
              role: typedUserData.role
            });
          
          if (error) {
            console.error("Error migrating user:", error);
          }
        }
      }
      
      console.log("Users migrated from localStorage to Supabase");
    }
    
  } catch (error) {
    console.error("Error migrating data from localStorage:", error);
  }
}