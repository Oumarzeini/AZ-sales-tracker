import { createClient } from "https://esm.sh/@supabase/supabase-js";

const VITE_SUPABASE_URL = "https://xytbxpjfjdwmdcffvvqh.supabase.co";

const VITE_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dGJ4cGpmamR3bWRjZmZ2dnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzM1OTQsImV4cCI6MjA3NTYwOTU5NH0.TqJdNgYNmIH7GiQot-RfTCF6e1m7iLDivBnnt6u-iAU";

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY);
export default supabase;
