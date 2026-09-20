# ResQPlate

ResQPlate is a food donation platform that helps restaurants, cafes, bakeries and food businesses distribute leftover edible food to people in need.

## Problem Statement

Food insecurity and food waste are both serious problems today; many people struggle to get affordable meals, while restaurants, bakeries and cafes often throw out leftover edible food at the end of the day. This problem is partly solved through food banks and donation programs. Apps such as Too Good To Go help businesses sell leftover food at discounted prices, but discounted food doesn't help people who can't afford to pay at all. ResQPlate solves this by creating a donation-based platform where verified food businesses can post leftover food for free, and food seekers can find and reserve it nearby — reducing food waste while making food accessible to the people who need it most.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Leaflet (maps), Algolia InstantSearch |
| Backend | Node.js, Express 5, TypeScript, Drizzle ORM, PostgreSQL, better-auth, Resend (email), Sharp (image processing), Swagger |
| Infra / DevOps | Docker Compose, GitHub Actions (CI, deploys, DB migrations), GCP (Cloud SQL, Compute Engine, Secret Manager), Cloudflare Pages + Workers, Caddy |

## Features

1. **Business Profile & Verification** — Restaurants, bakeries, cafes, and other businesses can create an account and complete a profile using Google Places address autocomplete. Admins can review, approve or reject businesses, request additional information, suspend accounts, and leave notes.

2. **Food Listing Creation** — Verified businesses can create, edit, and view food listings: quantity, images, cancellations, pickup time, location, and allergens.

3. **Food Search & Reservation** — Food seekers can search nearby listings via Algolia, filter by city, category, allergens, and distance, reserve a one-hour pickup slot, and receive a pickup code to confirm pickup. They can also view or cancel eligible reservations.

4. **Pickup Management** — Businesses can view and manage reservations, confirm pickups using codes, mark no-shows, update reservation status, and search by food seeker email.

## Screenshots

Production infrastructure — Cloudflare Pages, Cloud SQL, and the backend VM on GCP:

<p>
  <img src="screenshots/cloudflare-pages.jpeg" width="32%" alt="Cloudflare Pages deployment" />
  <img src="screenshots/CloudSQL-instance.jpeg" width="32%" alt="Cloud SQL instance" />
  <img src="screenshots/VM-basic-detail.jpeg" width="32%" alt="Backend VM configuration" />
</p>

More in [`/screenshots`](/screenshots/).

## Architecture

![Architecture diagram](docs/Architecture-diagram-ResQPlate.png)

## ER Diagram

![ER diagram](docs/ER_diagram.png)

## Local Setup

See the [Local Setup Guide](docs/setup.md) for prerequisites, environment variables, database configuration, and instructions to run the app locally.

```bash
npm install
npm run db:start      # start local Postgres via Docker Compose
npm run db:migrate
npm run dev            # runs backend + frontend (see docs/setup.md for details)
```

## Testing & Code Quality

- Backend: unit/integration tests via Node's built-in test runner (`npm test`), with coverage reporting (`npm run test:coverage`)
- ESLint + Prettier enforced via Husky pre-commit/pre-push hooks
- CI runs lint, build, and tests on every PR via GitHub Actions

## My Contributions

This was a team project built by a group of 4 for our software engineering course. My focus was primarily on infrastructure, authentication, and backend functionality:

- Set up the monorepo workspace structure (frontend / backend / shared packages) and the CI/CD pipelines (GitHub Actions) for linting, testing, and deployment
- Built and deployed the production infrastructure: GCP Compute Engine VM + Cloud SQL, Cloudflare Pages + Workers proxy, Caddy for HTTPS, and GCP Secret Manager integration for CI secrets
- Implemented authentication end-to-end with better-auth: signup, login, logout, forgot/reset password (with Resend for transactional emails), and role-based route guards for seeker, business, and admin users
- Designed the database schema (Drizzle ORM/PostgreSQL): better-auth tables, restaurant/listing/reservation models, and iterative schema changes as requirements evolved
- Built the dashboards and routing for the seeker, business, and admin user roles
- Implemented pickup time-slot logic, restricting pickup code redemption to the reserved time window
- Added local image storage with server-side resizing to improve frontend load performance
- Wrote backend service/repository test suites and wired test coverage into CI
- Wrote Swagger API documentation for the restaurant module, and the architecture and ER diagrams

## Contributors

Built by a team of 4 as a course capstone project.
