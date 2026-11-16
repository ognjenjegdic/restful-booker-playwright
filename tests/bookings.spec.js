import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const credentials = () => ({
  username: process.env.API_USERNAME || 'admin',
  password: process.env.API_PASSWORD || 'password123',
});

const newBooking = () => ({
  firstname: `Playwright-${randomUUID()}`,
  lastname: 'Tester',
  totalprice: 150,
  depositpaid: true,
  bookingdates: { checkin: '2027-05-10', checkout: '2027-05-15' },
  additionalneeds: 'Breakfast',
});

test('health check @smoke', async ({ request }) => {
  const response = await request.get('/ping');
  expect(response.status()).toBe(201);
});

test('valid credentials return an authentication token @smoke', async ({ request }) => {
  const response = await request.post('/auth', { data: credentials() });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ token: expect.any(String) });
});

test('invalid credentials return an error in a 200 response', async ({ request }) => {
  const response = await request.post('/auth', {
    data: { username: 'invalid-user', password: 'invalid-password' },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ reason: 'Bad credentials' });
});

const bookingTest = test.extend({
  ownedBooking: async ({ request }, use) => {
    const auth = await request.post('/auth', { data: credentials() });
    expect(auth.status()).toBe(200);
    const { token } = await auth.json();
    expect(token).toEqual(expect.any(String));
    const headers = { Cookie: `token=${token}` };
    const data = newBooking();
    const response = await request.post('/booking', { data });
    expect(response.status()).toBe(200);
    const created = await response.json();
    expect(created.bookingid).toEqual(expect.any(Number));
    const id = created.bookingid;
    try {
      expect(created.booking).toEqual(data);
      await use({ id, data, headers });
    } finally {
      // Also runs after a failed assertion. 405 means it was already deleted.
      const cleanup = await request.delete(`/booking/${id}`, { headers });
      expect([201, 405]).toContain(cleanup.status());
    }
  },
});

bookingTest('create and read a booking @smoke', async ({ request, ownedBooking }) => {
  const response = await request.get(`/booking/${ownedBooking.id}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  expect(await response.json()).toEqual(ownedBooking.data);
});

bookingTest('filter bookings by guest name', async ({ request, ownedBooking }) => {
  const response = await request.get('/booking', {
    params: { firstname: ownedBooking.data.firstname, lastname: ownedBooking.data.lastname },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toContainEqual({ bookingid: ownedBooking.id });
});

bookingTest('PUT replaces a booking and persists the change', async ({ request, ownedBooking }) => {
  const data = { ...ownedBooking.data, totalprice: 250, depositpaid: false, additionalneeds: 'Lunch' };
  const response = await request.put(`/booking/${ownedBooking.id}`, {
    headers: ownedBooking.headers, data,
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual(data);
  const saved = await request.get(`/booking/${ownedBooking.id}`);
  expect(saved.status()).toBe(200);
  expect(await saved.json()).toEqual(data);
});

bookingTest('PATCH updates one field and preserves the rest', async ({ request, ownedBooking }) => {
  const response = await request.patch(`/booking/${ownedBooking.id}`, {
    headers: ownedBooking.headers, data: { additionalneeds: 'Dinner' },
  });
  expect(response.status()).toBe(200);
  const expected = { ...ownedBooking.data, additionalneeds: 'Dinner' };
  expect(await response.json()).toEqual(expected);
  const saved = await request.get(`/booking/${ownedBooking.id}`);
  expect(saved.status()).toBe(200);
  expect(await saved.json()).toEqual(expected);
});

bookingTest('PUT without authentication is rejected', async ({ request, ownedBooking }) => {
  const response = await request.put(`/booking/${ownedBooking.id}`, {
    data: { ...ownedBooking.data, totalprice: 999 },
  });
  expect(response.status()).toBe(403);
  const saved = await request.get(`/booking/${ownedBooking.id}`);
  expect(saved.status()).toBe(200);
  expect(await saved.json()).toEqual(ownedBooking.data);
});

bookingTest('DELETE removes a booking; subsequent GET returns 404', async ({ request, ownedBooking }) => {
  const response = await request.delete(`/booking/${ownedBooking.id}`, { headers: ownedBooking.headers });
  expect(response.status()).toBe(201);
  const deleted = await request.get(`/booking/${ownedBooking.id}`);
  expect(deleted.status()).toBe(404);
});
