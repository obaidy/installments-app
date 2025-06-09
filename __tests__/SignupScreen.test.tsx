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
      });

  it('calls signUp and inserts client', async () => {
    const { getByPlaceholderText, getByText } = render(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');
    fireEvent.changeText(getByPlaceholderText('Complex Code'), 'XYZ');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(supabaseClient.signUp).toHaveBeenCalledWith('test@example.com', 'secret');
      const insert = (supabase.from as jest.Mock).mock.results[0].value.insert;
      expect(insert).toHaveBeenCalledWith({ user_id: '1', complex_code: 'XYZ' });
    });
  });
});