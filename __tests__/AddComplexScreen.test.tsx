import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddComplexScreen from '../app/complexes/add';
import { supabase } from '../lib/supabaseClient';
import { ToastProvider } from '../components/Toast';

jest.mock('../Config', () => ({
  SUPABASE_URL: 'http://localhost',
  SUPABASE_ANON_KEY: 'anon',
}));

describe('AddComplexScreen', () => {
  beforeEach(() => {
    (supabase as any).auth = {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
    };
    (supabase as any).from = jest.fn(() => ({ insert: jest.fn().mockResolvedValue({ error: null }) }));
  });

  it('submits codes to supabase', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ToastProvider>
        <AddComplexScreen />
      </ToastProvider>,
    );
    fireEvent.changeText(getByPlaceholderText('Complex Code(s), comma separated'), 'ABC,DEF');
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      const insert = (supabase.from as jest.Mock).mock.results[0].value.insert;
      expect(insert).toHaveBeenCalledWith([
        { user_id: '1', complex_code: 'ABC' },
        { user_id: '1', complex_code: 'DEF' },
      ]);
    });
  });
});