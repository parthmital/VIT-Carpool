# Supabase Setup Guide

This guide will help you set up Supabase as the backend for Campus Carpool Connect.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: Campus Carpool Connect (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" (takes 1-2 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql` file
4. Click "Run" (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

## Step 3: Enable Google OAuth

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Find "Google" in the list and toggle it ON
3. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - You can find your project ref in Supabase project settings → API
   - Copy the **Client ID** and **Client Secret**
4. Paste them into Supabase Google provider settings
5. Click "Save"

## Step 4: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 6: Update Allowed Email Domains

1. Open `src/contexts/AuthContext.tsx`
2. Find the `ALLOWED_DOMAINS` array (around line 15)
3. Update it with your college email domains:
   ```typescript
   const ALLOWED_DOMAINS = ["vit.ac.in", "yourcollege.edu"];
   ```

## Step 7: Test the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to `/login` and try signing in with Google
3. If everything works, you should be redirected back and see your profile

## Troubleshooting

### "Supabase URL and Anon Key are required" warning

- Make sure your `.env` file exists and has the correct variable names
- Restart your dev server after creating/updating `.env`

### OAuth redirect not working

- Make sure you added the correct redirect URI in Google Cloud Console
- The format should be: `https://<project-ref>.supabase.co/auth/v1/callback`

### Database errors

- Make sure you ran the SQL schema in the SQL Editor
- Check that all tables were created (go to Table Editor in Supabase dashboard)

### Email domain validation not working

- Check that `ALLOWED_DOMAINS` in `AuthContext.tsx` includes your domain
- Make sure the domain check is case-insensitive (it should be)

## Next Steps

- Customize the allowed email domains for your college
- Add more preset locations in `src/components/rides/LocationSelect.tsx`
- Deploy your frontend (Vercel, Netlify, etc.)
- Set up production environment variables in your hosting platform

## Security Notes

- Never commit your `.env` file to git (it's already in `.gitignore`)
- The `anon` key is safe to use in frontend code (it's public)
- Row Level Security (RLS) policies are already set up to protect your data
- Only authenticated users can create rides and join them
