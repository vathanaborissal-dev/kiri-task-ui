'use client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppearanceProvider } from './appearance-provider';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <QueryProvider>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </AuthProvider>
      </QueryProvider>
    </AppearanceProvider>
  );
}
