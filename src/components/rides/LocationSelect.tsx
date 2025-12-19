import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const PRESET_LOCATIONS = [
  'VIT Vellore Campus',
  'Katpadi Railway Station',
  'Chennai Airport',
  'Bangalore Airport',
] as const;

interface LocationSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function LocationSelect({
  id,
  label,
  value,
  onChange,
  placeholder = 'Select location',
  error,
  className,
}: LocationSelectProps) {
  const [isOther, setIsOther] = useState(
    value !== '' && !PRESET_LOCATIONS.includes(value as typeof PRESET_LOCATIONS[number])
  );
  const [otherValue, setOtherValue] = useState(isOther ? value : '');

  const handleSelectChange = (selected: string) => {
    if (selected === 'other') {
      setIsOther(true);
      onChange(otherValue);
    } else {
      setIsOther(false);
      setOtherValue('');
      onChange(selected);
    }
  };

  const handleOtherChange = (text: string) => {
    setOtherValue(text);
    onChange(text);
  };

  const selectValue = isOther ? 'other' : (PRESET_LOCATIONS.includes(value as typeof PRESET_LOCATIONS[number]) ? value : '');

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger id={id} className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          {PRESET_LOCATIONS.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      {isOther && (
        <Input
          placeholder="Enter location"
          value={otherValue}
          onChange={(e) => handleOtherChange(e.target.value)}
          className={error ? 'border-destructive' : ''}
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
