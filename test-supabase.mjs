
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfrxjtsepmejlmncfybd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcnhqdHNlcG1lamxtbmNmeWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDQ3NzEsImV4cCI6MjA2ODYyMDc3MX0.hlSLZwPKEF_i-ntVNitlKOLzg3AaMWJEeX1TWs0_m9k';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test connection by fetching table information
    const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);
    if (usersError) {
      console.error('Error accessing users table:', usersError);
    } else {
      console.log('✓ Users table accessible with data:', usersData);
    }
    
    const { data: repairsData, error: repairsError } = await supabase.from('repairs').select('*').limit(1);
    if (repairsError) {
      console.error('Error accessing repairs table:', repairsError);
    } else {
      console.log('✓ Repairs table accessible with data:', repairsData);
    }
    
    const { data: techniciansData, error: techniciansError } = await supabase.from('technicians').select('*').limit(3);
    if (techniciansError) {
      console.error('Error accessing technicians table:', techniciansError);
    } else {
      console.log('✓ Technicians table accessible with data:', techniciansData);
    }
    
  } catch (err) {
    console.error('Fatal error testing Supabase connection:', err);
  }
}

testSupabaseConnection();

