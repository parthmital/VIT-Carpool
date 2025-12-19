import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone } from 'lucide-react';

interface WhatsAppPromptProps {
  open: boolean;
  onSubmit: (whatsApp: string) => void;
}

export function WhatsAppPrompt({ open, onSubmit }: WhatsAppPromptProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const validatePhone = (value: string) => {
    // Basic validation: digits only, 10-15 characters
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('WhatsApp number is required');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }
    onSubmit(phone.replace(/\D/g, ''));
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            WhatsApp Number Required
          </DialogTitle>
          <DialogDescription>
            Enter your WhatsApp number to coordinate rides. This will only be shared with riders who join your rides.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="e.g., 9876543210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Enter your number with country code (e.g., 91 for India)
            </p>
          </div>
          <Button type="submit" className="w-full">
            Save & Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
