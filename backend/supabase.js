const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

// Public client
const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
  db: { schema: 'public' },
  global: {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  }
});

// Admin client — bypasses Row Level Security
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' },
  global: {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  }
});

module.exports = { supabase, supabaseAdmin };
