'use client';
import {
  getDefaultConfig,
  RainbowKitProvider,
  ConnectButton
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  anvil
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { http } from "viem";
import { createConfig } from "wagmi";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { ReactNode } from "react";
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
    chains: [base, anvil],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });

const queryClient = new QueryClient();

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="relative">
            <nav className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto flex justify-end">
                <ConnectButton />
              </div>
            </nav>
            <div className="pt-16">
              {children}
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
