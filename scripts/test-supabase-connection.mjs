import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  console.error('Expected these in .env or shell env before running the test');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tables = ['user_accounts', 'plugin_usage_records', 'orders_subscriptions'];

for (const table of tables) {
  const { error } = await supabase.from(table).select('id', { head: true, count: 'exact' });
  if (error) {
    console.error(`Table check failed for ${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`OK: ${table}`);
}

console.log('Supabase connection and table checks passed.');
