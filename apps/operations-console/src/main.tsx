import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@tensaw/runtime';
import { ToastHost } from '@tensaw/wired-components';
import '@tensaw/design-system/styles/global.css';

import { AppThemeProvider } from './AppTheme';
import { AppRouter } from './routes';
import { bootstrap } from './bootstrap';

/**
 * Operations Console entry point. Mirrors `apps/patient/src/main.tsx`.
 *
 * The Operations Console doesn't render `<SurfaceHost>` or
 * `<DirtyStateGuard>` — those are patient-app concerns (modal/drawer
 * orchestration and dirty-form prompts). Phase B's action modals will
 * use local React state per the kickoff's §16.4 decision.
 *
 * `<ToastHost>` is mounted here so action-error toasts (and any
 * `useNotificationsStore.pushToast(...)` calls anywhere in the app)
 * surface uniformly above the route content.
 */

void bootstrap();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AppRouter />
        <ToastHost />
      </AppThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
