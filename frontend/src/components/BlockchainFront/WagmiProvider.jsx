import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sepolia } from 'wagmi/chains'


const config = getDefaultConfig({
    appName: 'ScriptBay',
    projectId: 'f6e94d56f68eae0998135c7edec7e679',
    chains: [sepolia],


});

const queryClient = new QueryClient();

export const MyWagmiProvider = ({ children }) => (
    <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={darkTheme({
                accentColor: '#ff1a1a',
                accentColorForeground: 'white',
                borderRadius: 'large',
                overlayBlur: 'small',

            })}>
                {children}
            </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
);
