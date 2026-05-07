import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@tensaw/runtime';
import { DirtyStateGuard, SurfaceHost } from '@tensaw/composition';
import '@tensaw/design-system/styles/global.css';

import { AppThemeProvider } from './AppTheme';
import { AppRouter } from './routes';
import { bootstrap } from './bootstrap';

// Kick off bootstrap (action registration + MSW in dev) before render.
// `bootstrap()` is idempotent and returns a cached promise; we don't await
// it here because the router-level RequireAuth + page query suspensions
// give it enough time to finish before any action fires.
void bootstrap();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AppRouter />
        <SurfaceHost />
        <DirtyStateGuard />
      </AppThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
