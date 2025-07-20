
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables!');
    return;
  }
  
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by fetching table information
    const { data, error } = await supabase.from('users').select('*').limit(1);
      
    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Fatal error testing Supabase connection:', err);
  }
}

testSupabaseConnection();

