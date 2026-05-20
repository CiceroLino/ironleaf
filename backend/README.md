# Discount Codes Backend

NestJS API for creating, redeeming, and reporting on promotional discount codes.
The service uses Prisma with SQLite so the project can be run locally without a
production database.

<p>
  <img src="./docs/images/swagger.png" alt="Swagger API documentation screenshot" />
</p>

## Tech Stack

- NestJS 11
- TypeScript
- Prisma 7
- SQLite through `better-sqlite3`
- Jest and Supertest
- Swagger at `/api`

## Setup

Install dependencies from this directory:

```bash
pnpm install
```

Generate the Prisma client:

```bash
pnpm prisma:generate
```

Optionally seed sample campaigns and discount codes for a cold start:

```bash
pnpm prisma:seed
```

Run the API on port `3000`:

```bash
pnpm start:dev
```

The frontend is expected at `http://localhost:3001` by default. To allow another
origin, set `FRONTEND_ORIGIN` before starting the API.

```bash
FRONTEND_ORIGIN=http://localhost:3001 pnpm start:dev
```

## API

Base URL:

```text
http://localhost:3000
```

Health check:

```http
GET /
```

Campaigns:

```http
POST /campaigns
GET /campaigns
GET /campaigns/usage-summary
```

Discount codes:

```http
POST /discount-codes
GET /discount-codes
GET /discount-codes/:id
POST /discount-codes/:code/redeem
```

Swagger documentation is available at:

```text
http://localhost:3000/api
```

## Data Model

The API stores three core records:

- `Campaign`: groups discount codes for reporting.
- `DiscountCode`: stores the alphanumeric code, discount type, value, expiry,
  usage limit, and redemption count.
- `Redemption`: records each successful redemption and links it back to the code
  and campaign.

`DiscountType` is stored as `PERCENT` or `FIXED`. Fixed discounts require a
currency value, currently sent by the frontend as `USD`.

## Validation And Behavior

- Discount code values must be positive.
- Usage limits must be at least `1`.
- Expiry dates must be valid dates in the future when creating codes.
- Duplicate campaign names and duplicate discount codes return conflict errors.
- Redeeming a missing code returns `404`.
- Redeeming an expired code returns a validation error and does not create a
  redemption.
- Redeeming a code that has reached its usage limit returns a validation error
  and does not create a redemption.
- Redemptions run in a Prisma transaction so the count and redemption row are
  updated together.

## Scripts

```bash
pnpm prisma:seed   # seed sample local data
pnpm start:dev    # run Nest in watch mode
pnpm build        # generate Prisma client and compile
pnpm lint         # run ESLint with fixes
pnpm test         # unit tests
pnpm test:e2e     # API e2e tests, run serially against SQLite
pnpm test:cov     # coverage report
```

## Tests

The e2e suite covers the meaningful API behavior for this assignment:

- campaign creation and listing
- usage summary across campaigns
- discount code creation, listing, and detail retrieval
- successful redemption
- expired-code rejection
- usage-limit rejection
- CORS configuration for the frontend origin
- Swagger route availability

Run all backend checks:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## Trade-offs

- SQLite keeps the app easy to run from a cold start, but it is not intended as
  the final production persistence layer.
- Campaigns are a first-class resource because the frontend needs stable campaign
  IDs and the summary endpoint groups usage by campaign.
- The API exposes create/list campaign endpoints even though the assignment
  focuses on discount codes, because a code cannot be created safely without an
  existing campaign relationship.
- Authentication, authorization, pagination, and audit trails are intentionally
  out of scope for this small internal-tool submission.
