### A copy of our ReadMe from GitLab as part of the Chas Academy, Chas Challenge project were we worked in a team of 10 people to simulate how working in a team is really like at a workplace.

The team was:
- 5 .NET developers
- 2 UX designers
- 1 UX designer with Mobile focus
- 2 Devops

This project was worked on from end of March - end of May, where it was presented in early June.

---

# Athletiqa


Athletiqa is a platform designed to connect athletes with sponsors in a more transparent and community-driven way.
The platform allows athletes to showcase their goals, progress, and stories while enabling sponsors to support them directly and follow their journey.

The project was developed as part of the Chas Challenge 2026 with the theme Tech for Good.

## Features
- Athlete and sponsor platform
- Authentication and user accounts
- Sponsor-athlete matching
- Image upload with Cloudinary
- Stripe payment integration
- Email testing with Mailpit
- Responsive frontend
- Deployed on Azure Container Apps + Azure SQL
- Automated CI/CD with GitHub Actions

## Tech Stack
### Frontend
- React
- Vite
- JavaScript
- Backend
- ASP.NET Core
- Entity Framework
- SQL Server
- DevOps & Infrastructure
- Docker
- GitHub Actions
- Azure Container Apps, Azure Container Registry, Azure SQL Database
- Mailpit


## Live Demo
The app runs on Azure Container Apps. The deploy script prints the URLs (frontend and Mailpit) when it finishes; see [docs/azure.md](docs/azure.md).

Log in with the seeded demo accounts listed under [Seed users](#seed-users-for-local-login).

## Project Overview
Athletiqa is a platform that enables athletes to find and create connections with sponsors. Athletes post updates and start campaigns showcasing a hint into their sport-life, and sponsors donate, earn medals and chat with athletes through messages and notifications.

This is our school project for Chas Academy by Ninetech (Group 9)

## What's in this repo?

- `backend/` - .NET API with SQL Server, Identity Auth, Carter for Endpoints, MediatR for handlers.
- `frontend/` - React + Vite app utilizing a Feature-Sliced Design folder layout.
- `docker-compose.yml` - Spins up SQL Server, backend, frontend and Mailpit for local dev.
- `deploy/azure/` - Azure deployment script (Container Apps, ACR, Azure SQL)
- `.github/workflows/` - CI/CD: build check and deploy to Azure on push to `main`

## Tech stack

**Backend:** .NET, EF Core, SQL server, Carter, MediatR, FluentValidation, SignalR, Stripe, Cloudinary
**Frontend:** React, Vite, Tailwind CSS
**Infra:** Docker, Azure Container Apps, Azure SQL, GitHub Actions

## Getting started

The easiest way to run the porject is through Docker. Call on the Docker Compose command in your terminal pointing at the directory the project is located in.


## Running the Project Locally
### Clone repository

```
git clone https://github.com/GitUser4179/Athletiqa.git
cd Athletiqa
```
### Start with Docker

```
docker compose up --build
```

## Deployment (Azure)

The app is hosted on **Azure Container Apps**:

- `athletiqa-web`: nginx serving the React build (public). It reverse-proxies `/api` and `/hubs` to the API, so the browser sees a single origin. Cookies, CORS and SignalR need no cross-domain setup.
- `athletiqa-api`: the .NET API (internal only)
- `athletiqa-mail`: Mailpit for confirmation and reset emails (web UI behind basic auth)
- `athletiqa-migrate`: a one-off job that runs EF Core migrations before each rollout
- **Azure SQL Database** (serverless, free offer)

First-time setup and CI configuration: [docs/azure.md](docs/azure.md).

### CI/CD Pipeline

`.github/workflows/deploy-azure.yml` builds the backend and frontend, then on push to `main` builds the images in Azure Container Registry, runs migrations, and rolls out the new images.

### Configuration

The backend reads these settings (environment variables use `__` for nesting):

| Setting | Purpose |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | SQL Server connection string |
| `FrontendUrl` | Public URL used in email links and Stripe redirects |
| `AllowedOrigins` | Comma-separated CORS origins (only needed if the frontend is on another origin) |
| `CookieDomain` | Optional. Shares the auth cookie across subdomains; leave empty for a single origin |
| `EmailSettings__Host` / `__Port` | SMTP server (Mailpit) |
| `Stripe__SecretKey`, `Stripe__WebhookSecret` | Stripe |
| `Cloudinary__CloudName`, `__ApiKey`, `__ApiSecret`, `__RootFolder` | Cloudinary uploads |

The frontend image takes `BACKEND_URL` at runtime (enables the `/api` + `/hubs` proxy) and `VITE_API_URL` at build time (leave empty to call the API on the same origin).

## Branching Strategy

The team used a Git workflow based on:

feature branches - Dev - main

Feature work was developed in isolated branches before being merged into the shared development branch.

## Project Goal

The goal of Athletiqa is to create stronger connections between athletes and sponsors while increasing transparency, engagement, and local community support.
Backend
Frontend
Database
Then open:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Mailpit (for emails): http://localhost:8025
- SQL Server: `localhost:11433`

## How to run the backend

```bash
dotnet build backend
dotnet ef database update --project backend
```

## Running the frontend

```bash
cd frontend
npm install
npm run dev     # dev server (http://localhost:5173)
npm run build   # production build
npm run lint    # linter
```

### How the backend is organized

For the backend we utilize a vertical-slice and CQRS layout. Each feature has its own endpoint, command/query, handler and validators.

- `backend/Program.cs` – Service registration, middleware, routes, SignalR, health checks, seeding
- `backend/Domain/Entities` – EF Core entities
- `backend/Domain/Enums` – Shared enums (`Gender`, `MediaType`, `SponsorCategory`, …)
- `backend/Features` – The actual feature slices
- `backend/Infrastructure/Database` – `AthletiqaDbContext` and `DatabaseSeeder`
- `backend/Infrastructure/Services` – external services (Cloudinary etc.)
- `backend/Migrations` – EF Core migrations
- `backend/Monitoring` – Tracing and metrics

### Main endpoint groups

- Auth: `/login`, `/api/auth/register`, `/api/auth/logout`, `/api/users/me`
- Athlete profiles: `/api/athletes/{publicProfileId}`, `/posts`, `/campaigns`
- Sponsor profiles: `/api/sponsors/{publicProfileId}`, `/donations`
- Settings: `/api/user/athlete/profile`, `/api/user/sponsor/profile`
- Posts & comments: `/api/posts`, `/api/posts/{postId}/comments`, `/api/users/me/posts`
- Donation campaigns: `/api/donation-campaigns`, `/api/users/me/donation-campaigns`
- Uploads: `/api/uploads/signature` (signed Cloudinary upload)
- Stripe: under `Features/Stripe`

Public routes always utilize the `PublicProfileId` set on AthleteProfile/SponsorProfile, never the internal `UserId` set on the AspNet user.

## How the frontend is organized

We utilize Feature-Sliced Design, layers only import downwards.

```
pages → widgets → enteties → shared
```

(Yes, 'enteties' is misspelled. Please don't rename it, it'll break everything.)

- `app/` - Bootstrap, router, providers, global styles
- `pages/` - Route screens
- `widgets/` - Bigger composed UI blocks
- `features/` - User actions like login, create post, like post
- `enteties/` - Domain entities with API calls and cards
- `shared/` - UI kit, API helpers, hooks, assets

### Import pages

- `/` – home
- `/login`, `/register`, forgot/reset password
- `/explore`
- `/athlete-profile` and `/athlete-profile/:id`
- `/sponsor-profile` and `/sponsor-profile/:id`
- `/campaign/:id`
- `/settings`
- `/post/:postId/edit`

### Useful shared stuff

- `shared/ui` - `Button`, `Avatar`, `Modal`, `Tabs`, `Carousel`, `Input`, `FileUploadButton`, etc
- `shared/api/base/apiClient.js` - Shared API helper
- `shared/lib/AuthProvider.jsx` + `useAuth.js` - Auth started
- `shared/lib/useCurrentUser.js` - Current user hook

## Styling

- Tailwind everywhere
- Use `rem` not raw `px`
- Use theme tokens like `bg-bg`, `text-primary`, `bg-accent` instead of hardcoded colors.
- Use the shared UI components instead of raw `<button>` / `<input>´ etc.

## Auth & roles

Three roles:
- `Athlete`
- `SponsorUser`
- `SponsorCompanyUser`

### Seed users for local login

Use these seeded test accounts when running the app locally:

| User | Role | Email | Password |
| ---- | ---- | ----- | -------- |
| Alice| Athlete | `alice.seed@athletiqa.local` | `Seed123!` |
| Bob  | Sponsor | `bob.seed@athletiqa.local` | `Seed123!` |



Logged in profile pages live at `/athlete-profile` and `/sponsor-profile`. Public ones are the same routes with a `publicProfileId` at the end.

## Uploads (Cloudinary)

We use direct uploads so files don't pass through our backend, we decided on utilizing Cloudinary's services for this:

1. Frontend validates the files
2. Frontend asks backend for `/api/uploads/signature`
3. Backend signs the request with the Cloudinary secret
4. Frontend uploads straight to Cloudinary
5. Frontend sends the returned URL + public id to the normal create/update endpoint

The Cloudinary `ApiSecret` must **never** end up in the frontend.

Stuff we know about, just so nobody's surprised:

- Some frontend API calls still hardcode `http://localhost:5000` instead of using the shared client
- A few comments still mention mock data even though it's wired to the backend now
- Follow/block and parts of settings are still TODO
- `checkRole` is a hook but named like a regular function
- `AuthProvider` and `checkRole` can both call `/api/users/me`, so it sometimes double-fetches
- Some files have old commented-out component versions left behind

## Contributing notes

- Keep changes scoped to what was asked
- Don't move stuff across FSD layers in a way that makes `shared` depend on higher layers
- Keep new backend logic inside the right `Features/<Area>/<UseCase>` slice
- Keep API calls and DTO mapping close to the entity/feature that owns them
- Don't rename `enteties` 🙂
