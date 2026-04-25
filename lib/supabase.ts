// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only throw error if actually used (lazy initialization)
let supabaseClient: ReturnType<typeof createClient> | null = null;

function initializeSupabase() {
  if (supabaseClient) return supabaseClient;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

export function getSupabase() {
  return initializeSupabase();
}

// Export for backwards compatibility
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    const client = initializeSupabase();
    return Reflect.get(client, prop);
  },
});

export type Supabase = typeof supabase;