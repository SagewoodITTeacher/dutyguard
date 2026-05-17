import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('exam_duties').select('id, staff_code, is_slot').eq('is_slot', true).not('staff_code', 'is', null).limit(5);
  console.log("Duty Records:", data);
  console.log("Error:", error);
}
check();
