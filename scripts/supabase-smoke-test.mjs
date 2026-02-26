import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const testTag = `smoke-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

let userId = null;
let usageId = null;
let orderId = null;

try {
  const email = `${testTag}@example.com`;

  const userInsert = await supabase
    .from('user_accounts')
    .insert({
      email,
      role: 'user',
      subscription_status: 'trial',
    })
    .select('id, email')
    .single();

  if (userInsert.error || !userInsert.data) {
    throw new Error(`User insert failed: ${userInsert.error?.message ?? 'unknown error'}`);
  }

  userId = userInsert.data.id;
  console.log(`OK insert user_accounts: ${userInsert.data.email}`);

  const usageInsert = await supabase
    .from('plugin_usage_records')
    .insert({
      user_id: userId,
      extension_version: '0.0.0-smoke',
      device_id: `device-${testTag}`,
      event_type: 'usage',
      is_active: true,
      metadata: { source: 'smoke-test', tag: testTag },
    })
    .select('id')
    .single();

  if (usageInsert.error || !usageInsert.data) {
    throw new Error(`Usage insert failed: ${usageInsert.error?.message ?? 'unknown error'}`);
  }

  usageId = usageInsert.data.id;
  console.log(`OK insert plugin_usage_records: ${usageId}`);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const orderInsert = await supabase
    .from('orders_subscriptions')
    .insert({
      user_id: userId,
      amount_usd: 9.99,
      payment_method: 'card',
      subscription_status: 'active',
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (orderInsert.error || !orderInsert.data) {
    throw new Error(`Order insert failed: ${orderInsert.error?.message ?? 'unknown error'}`);
  }

  orderId = orderInsert.data.id;
  console.log(`OK insert orders_subscriptions: ${orderId}`);

  const readBack = await supabase
    .from('user_accounts')
    .select('id, email, subscription_status')
    .eq('id', userId)
    .single();

  if (readBack.error || !readBack.data) {
    throw new Error(`Read-back failed: ${readBack.error?.message ?? 'unknown error'}`);
  }

  console.log(`OK read user_accounts: ${readBack.data.email}`);

  // Negative check: invalid role should fail (constraint test).
  const badInsert = await supabase.from('user_accounts').insert({
    email: `bad-${testTag}@example.com`,
    role: 'superadmin',
    subscription_status: 'trial',
  });

  if (!badInsert.error) {
    throw new Error('Constraint test failed: invalid role was accepted unexpectedly');
  }

  console.log(`OK constraint check (invalid role rejected): ${badInsert.error.message}`);
  console.log('Supabase smoke test passed.');
} finally {
  if (orderId) {
    await supabase.from('orders_subscriptions').delete().eq('id', orderId);
  }
  if (usageId) {
    await supabase.from('plugin_usage_records').delete().eq('id', usageId);
  }
  if (userId) {
    await supabase.from('user_accounts').delete().eq('id', userId);
  }
}
