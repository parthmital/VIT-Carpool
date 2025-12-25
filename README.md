# Campus Carpool Connect

A modern web application for connecting students to share rides on campus. Built with React, TypeScript, and Supabase.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with college email validation
- 🚗 **Ride Sharing** - Create and join rides with other students
- 📍 **Location Search** - Find rides by source and destination
- ⏰ **Time-based Filtering** - Filter rides by date and time
- 💬 **WhatsApp Integration** - Contact ride creators directly via WhatsApp
- 🔄 **Real-time Updates** - See ride availability updates in real-time
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **State Management**: React Context + TanStack Query
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd campus-carpool-connect
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - This includes:
     - Creating a Supabase project
     - Setting up the database schema
     - Configuring Google OAuth
     - Getting API keys

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Update allowed email domains**
   - Open `src/contexts/AuthContext.tsx`
   - Update the `ALLOWED_DOMAINS` array with your college email domains

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**
   - Navigate to `http://localhost:8080`
   - You should see the login page

## Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (Navbar, AppLayout)
│   ├── rides/         # Ride-related components
│   └── ui/             # shadcn/ui components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   └── RidesContext.tsx # Rides data and operations
├── lib/                # Utility functions
│   └── supabase.ts     # Supabase client configuration
├── pages/              # Page components
│   ├── Home.tsx        # Main rides listing page
│   ├── Login.tsx       # Authentication page
│   ├── CreateRide.tsx  # Create new ride page
│   └── RideDetail.tsx # Individual ride details
└── types/              # TypeScript type definitions
    └── ride.ts         # Ride and User types
```

## Key Features Implementation

### Authentication

- Uses Supabase Auth with Google OAuth
- Validates college email domains
- Automatically creates user profiles on first login

### Real-time Updates

- Supabase real-time subscriptions for ride changes
- Automatic seat availability updates
- No page refresh needed

### Data Persistence

- All rides stored in PostgreSQL database
- User profiles and ride participants tracked
- Row Level Security (RLS) for data protection

## Environment Variables

| Variable                 | Description                 | Required |
| ------------------------ | --------------------------- | -------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL   | Yes      |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes      |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Frontend Deployment (Vercel/Netlify)

1. Push your code to GitHub
2. Connect your repository to Vercel/Netlify
3. Add environment variables in your hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Supabase Configuration

- Make sure to add your production domain to:
  - Supabase Auth redirect URLs
  - Google OAuth authorized redirect URIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own campus!

## Support

For setup help, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

For issues, please open a GitHub issue.
