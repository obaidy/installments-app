import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddComplexScreen from '../app/complexes/add';
import { supabase } from '../lib/supabaseClient';
import * as supabaseClient from '../lib/supabaseClient';
import { ToastProvider } from '../components/Toast';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

jest.mock('../Config', () => ({
  SUPABASE_URL: 'http://localhost',
  SUPABASE_ANON_KEY: 'anon',
}));

describe('AddComplexScreen', () => {
  const mockGrantResponse: PostgrestSingleResponse<null> = {
    data: null,
    error: null,
    count: null,
    status: 201,
    statusText: 'Created',
  };

  beforeEach(() => {
    (supabase as any).auth = {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
    };

    const inMock = jest
      .fn()
      .mockResolvedValue({
        data: [
          { id: 1, code: 'ABC' },
          { id: 2, code: 'DEF' },
        ],
        error: null,
      });

    const selectMock = jest.fn(() => ({ in: inMock }));
    (supabase as any).from = jest.fn(() => ({ select: selectMock }));

    jest
      .spyOn(supabaseClient, 'grantComplexRole')
      .mockResolvedValue(mockGrantResponse);
  });

  it('submits codes to supabase', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ToastProvider>
        <AddComplexScreen />
      </ToastProvider>,
    );

    fireEvent.changeText(
      getByPlaceholderText('Complex Code(s), comma separated'),
      'ABC,DEF',
    );
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('complexes');
      expect(supabaseClient.grantComplexRole).toHaveBeenCalledWith(
        '1',
        1,
        'client',
      );
      expect(supabaseClient.grantComplexRole).toHaveBeenCalledWith(
        '1',
        2,
        'client',
      );
    });
  });
});
