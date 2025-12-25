-- Campus Carpool Connect Database Schema
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    photo_url TEXT,
    whatsapp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rides Table
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    seats_available INTEGER NOT NULL CHECK (seats_available >= 0),
    creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    creator_email TEXT NOT NULL,
    creator_whatsapp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ride Participants Table (tracks who joined which ride)
CREATE TABLE IF NOT EXISTS ride_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ride_id, user_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(date);
CREATE INDEX IF NOT EXISTS idx_rides_creator ON rides(creator_id);
CREATE INDEX IF NOT EXISTS idx_rides_source ON rides(source);
CREATE INDEX IF NOT EXISTS idx_rides_destination ON rides(destination);
CREATE INDEX IF NOT EXISTS idx_participants_ride ON ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON ride_participants(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_participants ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can read all profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Rides Policies
-- Anyone can view rides
CREATE POLICY "Anyone can view rides" ON rides
    FOR SELECT USING (true);

-- Authenticated users can create rides
CREATE POLICY "Authenticated users can create rides" ON rides
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own rides
CREATE POLICY "Users can update own rides" ON rides
    FOR UPDATE USING (auth.uid() = creator_id);

-- Users can delete their own rides
CREATE POLICY "Users can delete own rides" ON rides
    FOR DELETE USING (auth.uid() = creator_id);

-- Ride Participants Policies
-- Anyone can view participants
CREATE POLICY "Anyone can view participants" ON ride_participants
    FOR SELECT USING (true);

-- Authenticated users can join rides
CREATE POLICY "Authenticated users can join rides" ON ride_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave rides they joined
CREATE POLICY "Users can leave rides" ON ride_participants
    FOR DELETE USING (auth.uid() = user_id);

