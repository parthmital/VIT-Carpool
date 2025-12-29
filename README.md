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

### Routes (defined in `App.tsx`)

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
