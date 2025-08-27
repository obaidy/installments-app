import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignupScreen from '../app/auth/signup';
import { supabase } from '../lib/supabaseClient';
import * as supabaseClient from '../lib/supabaseClient';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

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
  const mockGrantResponse: PostgrestSingleResponse<null> = {
    data: null,
    error: null,
    count: null,
    status: 201,
    statusText: 'Created',
  };

  import type { User, PostgrestSingleResponse } from '@supabase/supabase-js';

const mockUser: User = {
  id: '1',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
};

const mockGrantResponse: PostgrestSingleResponse<null> = {
  data: null,
  error: null,
  count: null,
  status: 201,
  statusText: 'Created',
};

beforeEach(() => {
  jest.spyOn(supabaseClient, 'signUp').mockResolvedValue({
    data: { user: mockUser, session: null },
    error: null,
    roleError: null,
  });

  jest.spyOn(supabaseClient, 'grantComplexRole').mockResolvedValue(mockGrantResponse);

  beforeEach(() => {
    jest.spyOn(supabaseClient, 'signUp').mockResolvedValue({
      data: { user: { id: '1' }, session: null },
      error: null,
      roleError: null,
    });

    jest
      .spyOn(supabaseClient, 'grantComplexRole')
      .mockResolvedValue(mockGrantResponse);

    inMock = jest.fn().mockResolvedValue({
      data: [
        { id: 1, code: 'ABC' },
        { id: 2, code: 'DEF' },
      ],
      error: null,
    });

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
      expect(supabaseClient.grantComplexRole).toHaveBeenCalledWith('1', 1, 'client');
      expect(supabaseClient.grantComplexRole).toHaveBeenCalledWith('1', 2, 'client');
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
