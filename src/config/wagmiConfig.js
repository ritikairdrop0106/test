import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'

export const wagmiConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [bscTestnet],
    transports: {
      // RPC URL for each chain
      [bscTestnet.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: '6232b0172ecd776ff2f37dece43901ab',

    // Required App Info
    appName: 'Test Project',

    // Optional App Info
    appDescription: 'Test Project',
    appUrl: '', // your app's url
    appIcon: '', // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
)
