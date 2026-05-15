import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mmfzjsyrbgphdktwilrq.supabase.co';
const supabaseKey = 'sb_publishable_c8ce5TfZuXqS8MlVyzXC3g__wAYCuEz';

export const supabase = createClient(supabaseUrl, supabaseKey);