# Restful Booker API tests — Playwright + JavaScript

A starter project for the free public [Restful Booker API](https://restful-booker.herokuapp.com/). Tests call the API directly with Playwright's `request` fixture; no browser downloads are needed.

## Get started

Install Node.js 22 or newer. Open a terminal in this folder:

```sh
npm ci
npm test
npm run report
```

Run a smaller selection:

```sh
npm run test:smoke
npx playwright test -g 'PATCH'
```

## What is covered

Nine tests cover health, successful and failed authentication, creating and reading a booking, filtering by guest name, PUT, PATCH, forbidden updates, and deletion followed by a 404 check. Update tests also read the booking again to verify persistence.

`tests/bookings.spec.js` contains the examples and an `ownedBooking` fixture that creates unique test data and cleans it up after each test, including failed assertions. Tests only update or delete bookings they create. The delete test's cleanup accepts 405 for an already deleted booking, matching this API's behavior.

`playwright.config.js` sets the base URL, headers, timeouts, two workers, HTML reports, and failure traces. CI retries failed tests once; local runs do not retry.

## Configuration

The defaults use the public demo credentials `admin` / `password123`. Protected requests pass the token from `/auth` in a `Cookie: token=...` header.

Override settings in your shell or CI environment:

```sh
API_BASE_URL=http://localhost:3001 API_USERNAME=admin API_PASSWORD=password123 npm test
```

`.env` files are not automatically loaded. An alternative server must implement the same Restful Booker contract.

## API quirks

- Health check and successful deletion return **201**.
- Booking creation returns **200**.
- Invalid login returns **200** with `reason: "Bad credentials"`.
- An unauthenticated update returns **403**.

This public sandbox is shared and periodically reset. Other users or a reset may interfere with a run. Cleanup is attempted but cannot be guaranteed during an outage or forced process exit. This is a functional test suite, not a load test.

## Learn and extend

Start with the health test, then read the create/read test and its fixture. Add tests using `bookingTest` when they need a disposable booking, or `test` for standalone requests. Keep status and body assertions specific to the endpoint's documented behavior.

- [Restful Booker documentation](https://restful-booker.herokuapp.com/apidoc/index.html)
- [API source and endpoint documentation](https://github.com/mwinteringham/restful-booker/blob/master/routes/index.js)
- [Playwright API testing guide](https://playwright.dev/docs/api-testing)
