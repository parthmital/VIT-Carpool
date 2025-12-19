import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { PRESET_LOCATIONS } from './LocationSelect';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  source: string;
  destination: string;
  date: string;
  startTime: string;
  endTime: string;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    source: '',
    destination: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const handleChange = (field: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      source: '',
      destination: '',
      date: '',
      startTime: '',
      endTime: '',
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  const hasFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="glass-card rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-foreground flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Find a Ride
        </h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground h-8"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="source" className="text-xs text-muted-foreground">
            From
          </Label>
          <Select value={filters.source} onValueChange={(v) => handleChange('source', v === 'all' ? '' : v)}>
            <SelectTrigger id="source" className="h-9">
              <SelectValue placeholder="Any location" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">Any location</SelectItem>
              {PRESET_LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="destination" className="text-xs text-muted-foreground">
            To
          </Label>
          <Select value={filters.destination} onValueChange={(v) => handleChange('destination', v === 'all' ? '' : v)}>
            <SelectTrigger id="destination" className="h-9">
              <SelectValue placeholder="Any location" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">Any location</SelectItem>
              {PRESET_LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs text-muted-foreground">
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={filters.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startTime" className="text-xs text-muted-foreground">
            After
          </Label>
          <Input
            id="startTime"
            type="time"
            value={filters.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endTime" className="text-xs text-muted-foreground">
            Before
          </Label>
          <Input
            id="endTime"
            type="time"
            value={filters.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
