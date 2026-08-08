const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let envText = "";
try {
  envText = fs.readFileSync('.env.local', 'utf-8');
} catch (e) {
  try {
    envText = fs.readFileSync('.env', 'utf-8');
  } catch (e2) {
    console.error("No env file found");
    process.exit(1);
  }
}

const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[parts[0].trim()] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Missing URL or ANON key", { url, anon });
  process.exit(1);
}

console.log("Supabase URL:", url);
const supabase = createClient(url, anon);

async function run() {
  const { data, error } = await supabase.from('bills').select('*').limit(1);
  console.log("bills query result:", { data, error });
  
  const { data: salaries, error: salError } = await supabase.from('salaries').select('*').limit(1);
  console.log("salaries query result:", { data: salaries, error: salError });
}
run();
