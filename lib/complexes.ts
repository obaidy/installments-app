import { supabase } from './supabaseClient';

export async function insertComplexesFromInput(codesInput: string): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'Please login first.';

  const codeList = codesInput
    .split(/[\n,]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  if (codeList.length === 0) return 'Please enter at least one code.';

  const inserts = codeList.map((code) => ({
    user_id: user.id,
    complex_code: code,
  }));

  const { error } = await supabase.from('clients').insert(inserts);

  return error ? error.message : null;
}