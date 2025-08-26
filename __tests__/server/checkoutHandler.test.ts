/** @jest-environment node */
import request from 'supertest';

import { app } from '../../server/server';

jest.mock('../../lib/stripeClient', () => ({
  createOrRetrieveCustomer: jest.fn(),
  storeCard: jest.fn(),
  chargeCustomer: jest.fn(),
  stripe: { webhooks: { constructEvent: jest.fn() } },
}));

jest.mock('../../lib/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

describe('POST /payments/checkout', () => {
  it('returns 400 when required fields are missing', async () => {
    const payloads = [
      { unitId: 1, installmentId: 2 },
      { email: 'test@example.com', installmentId: 2 },
      { email: 'test@example.com', unitId: 1 },
    ];

    for (const body of payloads) {
      const res = await request(app).post('/payments/checkout').send(body);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Missing fields' });
    }
  });
});