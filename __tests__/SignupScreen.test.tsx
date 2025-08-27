import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignupScreen from '../app/auth/signup';
import { supabase } from '../lib/supabaseClient';
import * as supabaseClient from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

jest.mock('../Config', () => ({
  SUPABASE_URL: 'http://localhost',
  SUPABASE_ANON_KEY: 'anon',
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

describe('SignupScreen', () => {
  let selectMock: jest.Mock;
  let inMock: jest.Mock;
  let insertMock: jest.Mock;

  const mockUser: User = {
    id: '1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
  };


  beforeEach(() => {
    jest.spyOn(supabaseClient, 'signUp').mockResolvedValue({
       data: { user: mockUser, session: null },
      error: null,
      roleError: null,
    });

    inMock = jest.fn().mockResolvedValue({
      data: [
        { id: 1, code: 'ABC' },
        { id: 2, code: 'DEF' },
      ],
      error: null,
    });

    insertMock = jest.fn().mockResolvedValue({ error: null });

    selectMock = jest.fn((cols: string) => {
      if (cols === 'code, name') {
        return Promise.resolve({
          data: [
            { code: 'ABC', name: 'Alpha' },
            { code: 'DEF', name: 'Delta' },
          ],
        });
      }
      if (cols === 'id, code') {
        return { in: inMock };
      }
    });

    (supabase as any).from = jest.fn((table: string) => {
      if (table === 'complexes') return { select: selectMock };
      if (table === 'user_complexes') return { insert: insertMock };
      return {} as any;
    });
  });

  it('calls signUp and associates complexes', async () => {
    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');

    fireEvent.press(getByText('Select Complexes'));
    fireEvent.press(getByText('Alpha'));
    fireEvent.press(getByText('Delta'));

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(supabaseClient.signUp).toHaveBeenCalledWith(
        'test@example.com',
        'secret',
      );
      expect(inMock).toHaveBeenCalledWith('code', ['ABC', 'DEF']);
      expect(insertMock).toHaveBeenCalledWith({ user_id: '1', complex_id: 1 });
      expect(insertMock).toHaveBeenCalledWith({ user_id: '1', complex_id: 2 });
    });
  });

  it('shows error when no complex selected', async () => {
    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Please select at least one complex.')).toBeTruthy();
      expect(supabaseClient.signUp).not.toHaveBeenCalled();
    });
  });
});
