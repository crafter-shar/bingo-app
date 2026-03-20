import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnuxfkjfqtgypxvozdjm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudXhma2pmcXRneXB4dm96ZGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTg5MDMsImV4cCI6MjA4OTUzNDkwM30.3pTPJEa6mr-IPLC73CVsdpwd1Qw8Ra9KfdQzBYTgr6M'

export const supabase = createClient(supabaseUrl, supabaseKey)