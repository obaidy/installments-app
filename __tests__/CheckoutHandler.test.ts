/** @jest-environment node */
import { checkoutHandler } from '../server/server';
import { supabase } from '../lib/supabaseClient';
import {
  createOrRetrieveCustomer,
  storeCard,
  chargeCustomer,
} from '../lib/stripeClient';

jest.mock('../lib/stripeClient', () => ({
  createOrRetrieveCustomer: jest.fn().mockResolvedValue({ id: 'cust' }),
  storeCard: jest.fn().mockResolvedValue({}),
  chargeCustomer: jest.fn().mockResolvedValue({ status: 'succeeded' }),
}));

jest.mock('../lib/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

describe('checkoutHandler', () => {
  it('records payment and updates installment', async () => {
    const singleMock = jest
      .fn()
      .mockResolvedValue({ data: { amount: 100 }, error: null });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });

    const updateEqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: updateEqMock });

    const insertMock = jest.fn().mockResolvedValue({ error: null });
    
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'installments') {
        return { select: selectMock, update: updateMock } as any;
      }
      if (table === 'payments') {
        return { insert: insertMock } as any;
      }
      return {} as any;
    });

    const req: any = {
      body: { email: 'a@test.com', unitId: 1, installmentId: 2 },
    };
    const jsonMock = jest.fn();
    const res: any = {
      json: jsonMock,
      status: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    await checkoutHandler(req, res, next);
    expect(selectMock).toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(updateEqMock).toHaveBeenCalledTimes(1);
    expect(jsonMock).toHaveBeenCalledWith({ status: 'succeeded' });
     expect(next).not.toHaveBeenCalled();
  });
});