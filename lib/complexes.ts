import { supabase } from './supabaseClient';

export async function insertComplexesFromInput(
  codesInput: string,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 'Please login first.';

  const codeList = codesInput
    .split(/[\n,]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  if (codeList.length === 0) return 'Please enter at least one code.';

  const { data: complexes, error } = await supabase
    .from('complexes')
    .select('id, code')
    .in('code', codeList);

 if (error) return error.message;

  const existingMap = new Map((complexes ?? []).map((c) => [c.code, c.id]));
  const invalid = codeList.filter((c) => !existingMap.has(c));
  if (invalid.length > 0) return 'Complex code does not exist';

  for (const id of existingMap.values()) {
    const { error: linkError } = await supabase
      .from('user_complexes')
      .insert({ user_id: user.id, complex_id: id });
    if (linkError) return linkError.message;
  }

  return null;
}