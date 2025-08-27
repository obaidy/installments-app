import {
  signIn,
  signOut,
  signUp,
  getCurrentUserRole,
  supabase,
} from '../lib/supabaseClient';

jest.mock('../Config', () => ({
  SUPABASE_URL: 'http://localhost',
  SUPABASE_ANON_KEY: 'anon',
}));

describe('supabaseClient auth helpers', () => {
  beforeEach(() => {
    (supabase as any).auth = {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    };
    (supabase as any).from = jest.fn();
  });

  test('signUp registers user and role', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: { user: { id: '1' } }, error: null });

    const result = await signUp('a@b.com', 'pass');

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' });
    expect(insertMock).toHaveBeenCalledWith({ user_id: '1', role: 'client' });
    expect(result).toEqual({ data: { user: { id: '1' } }, error: null, roleError: null });
  });

  test('signIn passes credentials', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: {}, error: null });
    await signIn('foo@bar.com', 'secret');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'foo@bar.com', password: 'secret' });
  });

  test('signOut calls supabase', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({});
    await signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  test('getCurrentUserRole returns role string', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    const singleMock = jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
    const eqMock = jest.fn(() => ({ single: singleMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const role = await getCurrentUserRole();
    expect(selectMock).toHaveBeenCalledWith('role');
    expect(eqMock).toHaveBeenCalledWith('user_id', '1');
    expect(role).toBe('admin');
  });

});