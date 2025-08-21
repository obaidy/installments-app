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
  it('records payment once', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });
    const req: any = { body: { email: 'a@test.com', unit: 1 } };
    const jsonMock = jest.fn();
    const res: any = {
      json: jsonMock,
      status: jest.fn().mockReturnThis(),
    };
    await checkoutHandler(req, res);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(jsonMock).toHaveBeenCalledWith({ status: 'succeeded' });
  });
});