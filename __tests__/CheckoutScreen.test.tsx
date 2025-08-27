import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckoutScreen from '../app/payments/checkout';
import { supabase } from '../lib/supabaseClient';

jest.mock('expo-router', () => ({
   useLocalSearchParams: () => ({ id: '1', type: 'installment' }),
}));

jest.mock('../components/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}));

beforeEach(() => {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'paid' }),
  });
  (supabase as any).auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'a@test.com' } }, error: null }),
  };
  const fromMock = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: 1, amount_iqd: 1000, due_date: null, paid: false },
      error: null,
    }),
  });
  (supabase as any).from = fromMock;
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('CheckoutScreen', () => {
  it('does not create payment client-side', async () => {
    const { getByText } = render(<CheckoutScreen />);
    await waitFor(() => expect(supabase.from).toHaveBeenCalled());
    fireEvent.press(getByText('Pay Now'));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect((supabase.from as any).mock.calls.length).toBe(1);
  });
});