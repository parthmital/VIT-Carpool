import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Ride } from '@/types/ride';

interface RidesContextType {
  rides: Ride[];
  joinedRides: Set<string>;
  createRide: (ride: Omit<Ride, 'id' | 'createdAt'>) => void;
  joinRide: (rideId: string) => boolean;
  getRideById: (id: string) => Ride | undefined;
  searchRides: (filters: SearchFilters) => Ride[];
  hasJoinedRide: (rideId: string) => boolean;
}

interface SearchFilters {
  source?: string;
  destination?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

const RidesContext = createContext<RidesContextType | undefined>(undefined);

// Initial mock data
const initialRides: Ride[] = [
  {
    id: 'ride-1',
    source: 'VIT Vellore Campus',
    destination: 'Katpadi Railway Station',
    date: '2024-12-20',
    startTime: '09:00',
    endTime: '10:00',
    seatsAvailable: 3,
    creatorId: 'user-2',
    creatorName: 'Sarah Chen',
    creatorEmail: 'sarah.chen@vit.ac.in',
    creatorWhatsApp: '919876543210',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ride-2',
    source: 'VIT Vellore Campus',
    destination: 'Chennai Airport',
    date: '2024-12-21',
    startTime: '14:00',
    endTime: '15:30',
    seatsAvailable: 2,
    creatorId: 'user-3',
    creatorName: 'Mike Rodriguez',
    creatorEmail: 'mike.r@vit.ac.in',
    creatorWhatsApp: '919876543211',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ride-3',
    source: 'Katpadi Railway Station',
    destination: 'VIT Vellore Campus',
    date: '2024-12-20',
    startTime: '17:00',
    endTime: '18:00',
    seatsAvailable: 1,
    creatorId: 'user-4',
    creatorName: 'Emily Park',
    creatorEmail: 'emily.park@vit.ac.in',
    creatorWhatsApp: '919876543212',
    createdAt: new Date().toISOString(),
  },
];

export function RidesProvider({ children }: { children: ReactNode }) {
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [joinedRides, setJoinedRides] = useState<Set<string>>(new Set());

  // Simulate real-time updates (polling effect)
  useEffect(() => {
    const interval = setInterval(() => {
      setRides((prev) =>
        prev.map((ride) => ({
          ...ride,
          seatsAvailable: Math.random() > 0.95 
            ? Math.max(0, ride.seatsAvailable + (Math.random() > 0.5 ? -1 : 1))
            : ride.seatsAvailable,
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const createRide = useCallback((rideData: Omit<Ride, 'id' | 'createdAt'>) => {
    const newRide: Ride = {
      ...rideData,
      id: `ride-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRides((prev) => [newRide, ...prev]);
  }, []);

  const joinRide = useCallback((rideId: string): boolean => {
    let success = false;
    setRides((prev) =>
      prev.map((ride) => {
        if (ride.id === rideId && ride.seatsAvailable > 0) {
          success = true;
          return { ...ride, seatsAvailable: ride.seatsAvailable - 1 };
        }
        return ride;
      })
    );
    if (success) {
      setJoinedRides((prev) => new Set(prev).add(rideId));
    }
    return success;
  }, []);

  const getRideById = useCallback(
    (id: string) => rides.find((ride) => ride.id === id),
    [rides]
  );

  const hasJoinedRide = useCallback(
    (rideId: string) => joinedRides.has(rideId),
    [joinedRides]
  );

  const searchRides = useCallback(
    (filters: SearchFilters): Ride[] => {
      return rides.filter((ride) => {
        if (ride.seatsAvailable === 0) return false;
        
        if (filters.source && !ride.source.toLowerCase().includes(filters.source.toLowerCase())) {
          return false;
        }
        if (filters.destination && !ride.destination.toLowerCase().includes(filters.destination.toLowerCase())) {
          return false;
        }
        if (filters.date && ride.date !== filters.date) {
          return false;
        }
        if (filters.startTime && ride.startTime < filters.startTime) {
          return false;
        }
        if (filters.endTime && ride.endTime > filters.endTime) {
          return false;
        }
        return true;
      });
    },
    [rides]
  );

  return (
    <RidesContext.Provider
      value={{
        rides,
        joinedRides,
        createRide,
        joinRide,
        getRideById,
        searchRides,
        hasJoinedRide,
      }}
    >
      {children}
    </RidesContext.Provider>
  );
}

export function useRides() {
  const context = useContext(RidesContext);
  if (context === undefined) {
    throw new Error('useRides must be used within a RidesProvider');
  }
  return context;
}
