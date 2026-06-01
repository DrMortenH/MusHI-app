import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://arlxwrwdljkeicijcsfd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybHh3cndkbGprZWljaWpjc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDQ5MTgsImV4cCI6MjA5NTg4MDkxOH0.g7wzo04--n5DcXU5x_eQoxYxiFWB0FH-irq9GIg9Oiw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
