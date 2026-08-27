import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nzjtekavvrdyccgafkwm.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_1_Tiv1dHNihPk4zhiXLWmA_QV9kJP3V'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)