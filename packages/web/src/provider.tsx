'use client';
 
import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './config/wagmiConfig';
import { base, baseSepolia } from 'wagmi/chains'; // add baseSepolia for testing

 
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia} // add baseSepolia for testing
          config={{
              appearance: {
              name: 'Nostra-Labs',        // Displayed in modal header
              logo: 'https://github.com/aryanpatil2703/nostra-labs/blob/main/packages/web/public/Nostra-labs_logo.svg',// Displayed in modal header
              mode: 'auto',                 // 'light' | 'dark' | 'auto'
              theme: 'dark',             // 'default' or custom theme
              },
              wallet: { 
              display: 'modal', 
              termsUrl: 'https://...', 
              privacyUrl: 'https://...', 
              },
          }}
          >
          {children}
        </OnchainKitProvider>
    </WagmiProvider>
  );
}