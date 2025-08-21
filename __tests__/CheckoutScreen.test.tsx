import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckoutScreen from '../app/payments/checkout';
import { supabase } from '../lib/supabaseClient';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ unit: '1' }),
}));

jest.mock('../components/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}));

beforeEach(() => {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'succeeded' }),
  });
  (supabase as any).auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'a@test.com' } }, error: null }),
  };
  (supabase as any).from = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('CheckoutScreen', () => {
  it('does not create payment client-side', async () => {
    const { getByText } = render(<CheckoutScreen />);
    fireEvent.press(getByText('Pay Now'));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(supabase.from).not.toHaveBeenCalled();
  });
});