import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SearchForm } from '@/components/rides/SearchForm';
import { RideCard } from '@/components/rides/RideCard';
import { useRides } from '@/contexts/RidesContext';
import { Car } from 'lucide-react';

interface SearchFilters {
  source: string;
  destination: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function Home() {
  const { rides } = useRides();
  const [filters, setFilters] = useState<SearchFilters>({
    source: '',
    destination: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const filteredRides = useMemo(() => {
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
  }, [rides, filters]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <SearchForm onSearch={setFilters} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              {filteredRides.length} {filteredRides.length === 1 ? 'ride' : 'rides'} available
            </h2>
          </div>

          {filteredRides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No rides found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
