# ResQPlate - Local Development Setup

## Prerequisites

- Node.js 24+ (preferred version: v24.14.1)
- npm should be installed.
- Docker desktop (if working with WSL2, you would have to enable WSL integration on docker desktop)

## Install dependencies

Clone the repository and you would get final-project-group-12. From the root you need to run:

`npm install`: Installs all the three workspaces (`frontend`, `backend`, `packages/shared`) and automatically wire the github hooks (pre-commit & pre-push).

## Environment variables

There are two `.env.example` files (`one in root & one in backend/`) which exist so that you can create your own `.env` file using the content present in it. The best command would be to use `cp .env.example .env`. The values used right now are correct. Only change values once you have copied then to your `.env` file and `donot make any changes` to the values in the `.env.eample`

## Database Commands

```bash
# start/stop/force-stop the database
npm run db:start            # start the container
npm run db:stop             # stop the container (doesnot delete the volume)
npm run db:force-stop       # deletes the volume and the container
npm run db:studio           # use the link to view the database & can run SQL commands in it
npm run db:seed -w backend  # seeds data into database


# These commands need to be run to add new changes to the database schema in the same order
1. npm run db:generate    # generates the sql code from drizzle
2. npm run db:migrate     # used for migrations to the container
```

**These same commands can be run from the root directory and the backend folder. No other folder can support it so be mindful about it.**

## Running the Frontend and Backend

```bash
# in one terminal run from the root.
npm run dev -w frontend

# in another terminal run from the root.
npm run dev -w backend

# Backend health check: http://localhost:3000/api/health
```

## Additional Common Commands

```bash

# run these commands from root to check backend, frontend & packages/shared.

npm run lint      # check all the workspaces(frontend, backend, shared file)
npm run format    # auto-format whole repo
npm run test      # run backend test suite
npm run test:coverage   # run backend tests and generate the coverage.
```

## Branching & Code Organization

- `main` is always deplayable. `develop` is where finished features land first.
- Branches should be created from the `develop` branch at all times.
- Open PRs into `develop` branch and **`never`** to `main`.
- Backend code is organized by feature for now. Example is everything related to auth would be accessible in `auth/` inside the `backend/src` folder which contain files like `auth.repository.ts`, `auth.service.ts`, `auth.handler.ts`, `auth.types.ts` & `auth.routes.ts`. We also have a `test folder` inside the `auth` folder where all the tests related to it would be present.
- `Committing` runs `ESLint` & `Prettier` automatically on staged files.
- `Commits` can be `rejected` if there is any `error` related to `lintting`. If so `fix` the `issue` and `commit again`.
- On `pushing` code to `github`, `all` the `tests` would be `run` and if it `fails` the `push` would `fail`.
