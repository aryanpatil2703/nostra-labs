import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';
import { Providers } from './provider';
import { BrowserRouter, Route, Routes } from 'react-router';
import Chat from './routes/chat';
import Overview from './routes/overview';
import Home from './routes/home';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

function App() {
  return (
    <Providers>
      <QueryClientProvider client={queryClient}>
        <div
          className="dark antialiased"
          style={{
            colorScheme: 'dark',
          }}
        >
          <BrowserRouter>
            <TooltipProvider delayDuration={0}>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <div className="container flex size-full flex-1 flex-col gap-4">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="chat/:agentId" element={<Chat />} />
                      <Route path="settings/:agentId" element={<Overview />} />
                    </Routes>
                  </div>
                </SidebarInset>
              </SidebarProvider>
              <Toaster />
            </TooltipProvider>
          </BrowserRouter>
        </div>
      </QueryClientProvider>
    </Providers>
  );
}

export default App;
