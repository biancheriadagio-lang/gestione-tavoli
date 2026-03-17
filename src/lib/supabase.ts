import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://woifkjquaegnwsalslih.supabase.co'
const supabaseAnonKey = 'sb_publishable_Eg0DfVXUTwVTiJnYWyPcyQ_RASZGD70'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)