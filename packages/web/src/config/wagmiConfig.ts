import { createConfig, http, WagmiProvider } from 'wagmi';
import { base, baseSepolia, arbitrum, arbitrumSepolia } from 'wagmi/chains'; // Use '@wagmi/chains' for Wagmi v2
import { coinbaseWallet, metaMask, injected, walletConnect } from 'wagmi/connectors';


export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, arbitrum, arbitrumSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Nostra-Labs', // Change this to your app's name
      
    }),
    metaMask(),
    injected(),
    
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});
