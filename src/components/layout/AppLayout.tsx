import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { WhatsAppPrompt } from '@/components/WhatsAppPrompt';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, needsWhatsApp, setWhatsApp } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-4 sm:py-6">{children}</main>
      <WhatsAppPrompt open={needsWhatsApp} onSubmit={setWhatsApp} />
    </div>
  );
}
