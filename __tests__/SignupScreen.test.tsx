import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignupScreen from '../app/auth/signup';
import { supabase } from '../lib/supabaseClient';
import * as supabaseClient from '../lib/supabaseClient';

jest.mock('../Config', () => ({
  SUPABASE_URL: 'http://localhost',
  SUPABASE_ANON_KEY: 'anon',
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

describe('SignupScreen', () => {
  let insertMock: jest.Mock;
  let selectMock: jest.Mock;
  let inMock: jest.Mock;
  beforeEach(() => {
    jest.spyOn(supabaseClient, 'signUp').mockResolvedValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          },
          session: null,
        },
        error: null,
        roleError: null,
      });
      insertMock = jest.fn().mockResolvedValue({ error: null });
    inMock = jest.fn().mockResolvedValue({
      data: [
        { code: 'ABC' },
        { code: 'DEF' },
        { code: 'GHI' },
      ],
      error: null,
    });
    selectMock = jest.fn(() => ({ in: inMock }));

    (supabase as any).from = jest.fn((table: string) => {
      if (table === 'complexes') {
        return { select: selectMock };
      }
      if (table === 'clients') {
        return { insert: insertMock };
      }
      return {} as any;
    });
  });

  it('calls signUp and inserts client', async () => {
    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');
    fireEvent.changeText(
      getByPlaceholderText('Complex Code(s), comma or newline separated'),
      'ABC,DEF\nGHI',
    );


    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(supabaseClient.signUp).toHaveBeenCalledWith('test@example.com', 'secret');
      expect(selectMock).toHaveBeenCalledWith('code');
      expect(inMock).toHaveBeenCalledWith('code', ['ABC', 'DEF', 'GHI']);
      expect(insertMock).toHaveBeenCalledWith([
        { user_id: '1', complex_code: 'ABC' },
        { user_id: '1', complex_code: 'DEF' },
        { user_id: '1', complex_code: 'GHI' },
      ]);
    });
  });
  it('shows error when complex code is invalid', async () => {
    inMock.mockResolvedValueOnce({ data: [{ code: 'ABC' }], error: null });

    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');
    fireEvent.changeText(
      getByPlaceholderText('Complex Code(s), comma or newline separated'),
      'ABC,XYZ',
    );

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Complex code does not exist')).toBeTruthy();
      expect(insertMock).not.toHaveBeenCalled();
    });
  });
});