## VIT Carpool

VIT Carpool is a campus-focused carpooling web app for VIT students. It lets students sign in with their college email, create rides, join available rides, and coordinate logistics via WhatsApp.

The app is built with **React + TypeScript**, **Vite**, **Supabase** (auth + database + RLS), **React Router**, **TanStack Query**, and **shadcn/ui** (Radix-based UI components).

---

### Features

- **College-only authentication**
  - Google OAuth via Supabase
  - **Only `@vitstudent.ac.in` emails** are allowed (enforced in `AuthContext`)
- **Ride discovery**
  - Filter by **source**, **destination**, **date**, and **time window**
  - Excludes rides with `0` seats remaining
  - Live count of matching rides
- **Create and manage rides**
  - Create a ride with:
    - Source & destination (predefined campus-related locations)
    - Date and start/end time
    - Available seats (validated: 1–10 on create, 0–10 on edit)
  - View and manage all rides you created
  - Edit or delete your own rides
- **Join and leave rides**
  - Join rides (with seat availability check)
  - Leave rides you previously joined
  - Automatically decrements/increments seat counts in a transaction-like flow
- **WhatsApp-based coordination**
  - Users are prompted to add a WhatsApp number once, stored in their profile
  - Riders who joined a ride can:
    - Open WhatsApp chat with a pre-filled message
    - Copy driver’s WhatsApp number to the clipboard
- **Real-time data**
  - Supabase Realtime subscription on `rides` table
  - Automatically refreshes ride list when rides are inserted/updated/deleted
- **Access control**
  - All main pages use `AppLayout`, which:
    - Redirects unauthenticated users to `/login`
    - Prompts authenticated users without WhatsApp to add a number
  - Supabase Row Level Security (RLS) policies enforce:
    - Users can only update/delete their own rides
    - Users can only modify their own profiles and ride participation
- **Responsive UI**
  - Uses Tailwind CSS + shadcn/ui components (buttons, cards, inputs, dialogs, dropdowns, etc.)
  - Mobile-friendly layout with sticky top navbar

---

### Tech Stack

- **Frontend**
  - React 18 + TypeScript
  - Vite
  - React Router v6
  - TanStack React Query
  - Tailwind CSS + tailwindcss-animate
  - shadcn/ui (Radix UI primitives)
  - lucide-react icons
- **Backend**
  - Supabase
    - Auth (Google OAuth)
    - Postgres database
    - Realtime channels
    - Row Level Security policies
- **Tooling**
  - ESLint
  - TypeScript
  - Vite Dev Server (port `8080`)
  - Vercel (SPA rewrite config)

---

### Project Structure

High-level structure:

.
├─ public/ # Static assets (favicons, OG image, robots, sitemap)
├─ src/
│ ├─ components/
│ │ ├─ layout/ # AppLayout, Navbar
│ │ ├─ rides/ # Ride-related UI (LocationSelect, RideCard, SearchForm)
│ │ ├─ ui/ # shadcn/ui components (button, card, dialog, etc.)
│ │ └─ WhatsAppPrompt.tsx
│ ├─ contexts/ # React context providers
│ │ ├─ AuthContext.tsx # Auth + user profile + email domain validation
│ │ └─ RidesContext.tsx# Ride CRUD, join/leave, real-time, filters
│ ├─ hooks/
│ │ ├─ use-mobile.tsx
│ │ └─ use-toast.ts
│ ├─ lib/
│ │ ├─ supabase.ts # Supabase client + typed DB schema
│ │ └─ utils.ts
│ ├─ pages/ # Route-level screens
│ │ ├─ Home.tsx
│ │ ├─ Login.tsx
│ │ ├─ CreateRide.tsx
│ │ ├─ ManageRides.tsx
│ │ ├─ JoinedRides.tsx
│ │ ├─ RideDetail.tsx
│ │ ├─ EditRide.tsx
│ │ └─ NotFound.tsx
│ ├─ types/
│ │ └─ ride.ts # Shared Ride and User interfaces
│ ├─ App.tsx # Router + providers
│ ├─ main.tsx # ReactDOM entry point
│ ├─ index.css
│ └─ App.css
├─ supabase-schema.sql # Database schema & RLS policies
├─ vite.config.ts # Vite config with `@` alias
├─ tailwind.config.ts
├─ vercel.json # SPA rewrite for client-side routing
└─ package.json---

### Supabase Setup

#### 1. Create a Supabase project

1. Go to `https://app.supabase.com` and create a new project.
2. Get:
   - **Project URL**
   - **anon public key**

You’ll use these as environment variables.

#### 2. Run the schema

1. Open your project in Supabase.
2. Go to **SQL Editor**.
3. Paste the contents of `supabase-schema.sql`.
4. Run it.

This will:

- Create tables:
  - `user_profiles`
  - `rides`
  - `ride_participants`
- Add indexes for performance.
- Add a trigger to keep `user_profiles.updated_at` in sync.
- Enable **Row Level Security (RLS)** and define policies:
  - Users can read all profiles.
  - Users can insert/update only their own profile.
  - Anyone can read rides and participants.
  - Authenticated users can create rides and join rides.
  - Users can update/delete only rides they created.
  - Users can delete their own participation rows (leave rides).

#### 3. Configure Auth (Google + domain restriction)

In Supabase:

1. Go to **Authentication → Providers → Google**.
2. Enable Google sign-in and set your callback URL(s), typically:
   - `http://localhost:8080/`
   - Your production domain, e.g. `https://your-vercel-app.vercel.app/`
3. In the app itself, additional domain restriction is enforced in `AuthContext`:
   - Only `@vitstudent.ac.in` emails are allowed.
   - If a user signs in with any other domain, they are logged out and shown an alert.

---

### Environment Variables

Create a `.env.local` (or `.env`) at the project root with:

VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEYNotes:

- Both values are required. If missing, the app logs a warning and Supabase calls will fail.
- Vite exposes variables prefixed with `VITE_` to the client.

---

### Getting Started (Local Development)

#### 1. Install dependencies

Use npm (or pnpm/yarn if you prefer):

npm install#### 2. Start the dev server

npm run devBy default (see `vite.config.ts`):

- Dev server runs at `http://localhost:8080`.
- The `@` alias resolves to `./src`.

#### 3. Build & preview

Production build:

npm run buildPreview the production build locally:

npm run preview#### 4. Lint

npm run lint---

### Application Flow & Routes

All main pages are rendered inside `AppLayout`, which:

- Shows a global `Navbar`.
- Forces authentication (redirects unauthenticated users to `/login`).
- Shows a non-dismissible `WhatsAppPrompt` dialog when the logged-in user doesn’t have a WhatsApp number saved.

#### Routes (defined in `App.tsx`)

- `/login` – Sign in with Google; only `@vitstudent.ac.in` emails accepted.
- `/` – **Home**
  - Shows search form and ride list.
  - Filters by source, destination, date, and time window.
  - Uses `RidesContext` to read `rides` and loading state.
- `/create` – **Create Ride**
  - Validates form inputs.
  - Creates a ride row in `rides` table via `RidesContext.createRide`.
- `/manage` – **Manage Rides**
  - Shows rides created by the logged-in user.
  - Allows viewing, editing, and deleting rides.
- `/joined` – **Joined Rides**
  - Shows rides that the user has joined.
  - Allows leaving a ride.
- `/ride/:id` – **Ride Detail**
  - Shows full details of a ride.
  - Allows:
    - Joining the ride (if seats available and user not creator).
    - Leaving the ride (if joined).
    - Editing/deleting (if user is the creator).
    - Contacting driver on WhatsApp (for joined riders, not the creator).
- `/ride/:id/edit` – **Edit Ride**
  - Only accessible by ride creator.
  - Validates updates and persists via `RidesContext.updateRide`.
- `*` – **NotFound**
  - Handles any unknown routes.

---

### State Management & Data Layer

#### Auth (`AuthContext`)

- Wraps the app with `AuthProvider`.
- Uses Supabase auth:
  - On initial load, calls `supabase.auth.getSession()`.
  - Subscribes to `onAuthStateChange` for `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`.
- For each authenticated session:
  - Validates email domain (`vitstudent.ac.in` only).
  - Loads or creates a `user_profiles` row.
  - Maps DB profile to internal `User` type:
    - `id`, `name`, `email`, `photoUrl`, `whatsApp`.
- Exposes:
  - `user`
  - `isAuthenticated`
  - `isLoading`
  - `needsWhatsApp` (true if logged in but no WhatsApp)
  - `login()` – starts Google OAuth.
  - `logout()` – signs out via Supabase.
  - `setWhatsApp()` – updates WhatsApp in `user_profiles`.

#### Rides (`RidesContext`)

- Manages:
  - `rides: Ride[]`
  - `joinedRides: Set<string>` (ride IDs)
  - `isLoading`, `error`
  - `realtimeStatus` (channel subscription status)
- Functions:
  - `createRide(rideData)`
  - `joinRide(rideId)`
    - Inserts into `ride_participants`.
    - Decrements `seats_available` in `rides`.
    - Rollbacks participation if seat update fails.
  - `leaveRide(rideId)`
    - Deletes from `ride_participants`.
    - Increments `seats_available` in `rides`.
    - Rollbacks if seat update fails.
  - `deleteRide(rideId)`
  - `updateRide(rideId, patch)`
  - `getMyRides()`
  - `getJoinedRides()`
  - `getRideById(id)`
  - `searchRides(filters)`
  - `hasJoinedRide(rideId)`
  - `isMyRide(rideId)`
  - `reload()` – reload rides and joined rides.
- Real-time:
  - Subscribes to a Supabase channel (`rides-changes`) with `postgres_changes` on `rides`.
  - On any change, calls `loadRides()` to refresh local state.

---

### UI Components

- **`components/layout/AppLayout.tsx`**
  - Central layout wrapper.
  - Gatekeeps authenticated access and WhatsApp requirement.
- **`components/layout/Navbar.tsx`**
  - Brand/logo.
  - "Create Ride" button.
  - Account dropdown:
    - Manage rides
    - Joined rides
    - Edit WhatsApp (dialog)
    - Logout
- **`components/WhatsAppPrompt.tsx`**
  - Modal dialog when `needsWhatsApp` is true.
  - Validates phone number (digits only, 10–15).
  - Calls `onSubmit` with a cleaned phone number (digits only).
- **`components/rides/LocationSelect.tsx`, `SearchForm.tsx`, `RideCard.tsx`**
  - Encapsulate ride-specific UI:
    - Pre-defined locations
    - Validation & error display
    - Card layout for ride display on Home page and list pages.

---

### Deployment

You can deploy this app to any static hosting that supports SPA routing (e.g., Vercel, Netlify, etc.).

#### Vercel

- `vercel.json` config:

{
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}This ensures client-side routes (`/ride/:id`, `/manage`, etc.) are all served by `index.html`.

Steps:

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **Environment Variables** in Vercel.
2. Deploy.
3. Update Supabase OAuth redirect URLs to include your production domain.

---

### Scripts (from `package.json`)

- **`npm run dev`** – Start Vite dev server.
- **`npm run build`** – Build for production.
- **`npm run build:dev`** – Build with `development` mode.
- **`npm run preview`** – Preview the production build.
- **`npm run lint`** – Run ESLint.

---

### Notes & Gotchas

- **Email domain enforcement**:
  - Implemented in `AuthContext` (not only via Supabase) to ensure only `@vitstudent.ac.in` emails remain signed in.
- **Supabase schema must be applied**:
  - If tables are missing, the app will alert the user (`PGRST205` or "Could not find the table" errors).
  - Make sure `supabase-schema.sql` has been executed on your project before using the app.
- **WhatsApp numbers**:
  - Stored as digit-only strings (e.g., `919876543210`).
  - WhatsApp deep link is built as `https://wa.me/<number>?text=<encoded_message>`.

---

### Contributing / Customization

- **Change allowed email domains**:
  - Modify the `ALLOWED_DOMAINS` array in `AuthContext.tsx`.
- **Customize locations**:
  - Update options in `LocationSelect.tsx` to match your campus locations.
- **Branding & copy**:
  - Adjust texts in `Navbar`, `Login`, `Home`, and `RideDetail` pages.

Feel free to adapt this codebase for other campuses or carpool communities by tweaking the schema, allowed email domains, and branding.
