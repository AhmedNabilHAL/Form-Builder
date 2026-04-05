import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppThemeProvider } from './theme/theme.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppThemeProvider>
        <StrictMode>
          <App />
        </StrictMode>
      </AppThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
