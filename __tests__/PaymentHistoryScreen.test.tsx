import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PaymentHistoryScreen from '../app/payments/history';
import { supabase } from '../lib/supabaseClient';

jest.mock('../Config', () => ({
  SUPABASE_URL: 'http://localhost',
  SUPABASE_ANON_KEY: 'anon',
}));

describe('PaymentHistoryScreen', () => {
  beforeEach(() => {
    (supabase as any).auth = {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: '1' } }, error: null }),
    };
    (supabase as any).from = jest.fn((table: string) => {
      if (table === 'units') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [{ id: 10 }], error: null }),
        };
      }
      if (table === 'payments') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 1,
                amount: 100,
                status: 'paid',
                paid_at: '2024-01-01',
                installment_id: 1,
                service_fee_id: null,
                installments: { due_date: '2024-01-01' },
              },
               {
                id: 2,
                amount: 50,
                status: 'paid',
                paid_at: '2024-02-01',
                installment_id: null,
                service_fee_id: 5,
                service_fees: { due_date: '2024-02-01' },
              },
            ],
            error: null,
          }),
        };
      }
      return {} as any;
    });
  });

  it('renders list of payments', async () => {
    const { getByText } = render(<PaymentHistoryScreen />);
    await waitFor(() => {
      expect(getByText('Payment History')).toBeTruthy();
      expect(getByText(/Amount: 100/)).toBeTruthy();
      expect(getByText(/Type: Installment/)).toBeTruthy();
      expect(getByText(/Amount: 50/)).toBeTruthy();
      expect(getByText(/Type: Service Fee/)).toBeTruthy();
    });
  });
});
