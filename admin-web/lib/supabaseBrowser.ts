'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// If you have generated DB types, you can do: createClientComponentClient<Database>()
export const supabaseBrowser = createClientComponentClient();
