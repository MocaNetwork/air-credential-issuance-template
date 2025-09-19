"use client";
import { mocaDevnet, mocaTestnet } from "@/lib/utils/constants";
import {
  createAuthenticationAdapter,
  getDefaultConfig,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import React, { useMemo } from "react";
import { HttpTransport } from "viem";
import { Chain, mainnet } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { cookieStorage, createStorage, http, WagmiProvider } from "wagmi";
import { env, MocaChain } from "../env";
import { useSession } from "../hooks/useSession";
import { AirkitProvider } from "./AirkitProvider";
import { ErrorHandler } from "./ErrorHandler";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
export const Providers: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { accessToken, setAccessToken } = useSession();

  const authenticationAdapter = useMemo(
    () =>
      createAuthenticationAdapter({
        getNonce: async () => {
          return new Date().getTime().toString();
        },

        createMessage: ({ nonce, address, chainId }) => {
          return createSiweMessage({
            domain: window.location.host,
            address,
            statement: "Sign in with Ethereum to the app.",
            uri: window.location.origin,
            version: "1",
            chainId,
            nonce,
          });
        },

        verify: async ({ message, signature }) => {
          try {
            const verifyRes = await fetch("/api/auth/wallet", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message, signature }),
            });

            const data = (await verifyRes.json()) as {
              accessToken: string;
              walletAddress: string;
            };

            if (!data.accessToken) {
              throw new Error("Invalid signature");
            }
            setAccessToken(data.accessToken);
          } catch (error) {
            console.error(error);
            throw error;
          }
          return true;
        },

        signOut: async () => {
          setAccessToken(null);
        },
      }),
    [setAccessToken]
  );

  const config = useMemo(() => {
    let mocaChain: Chain | undefined;
    const transports: Record<number, HttpTransport> = {
      [mainnet.id]: http(),
    };

    switch (env.NEXT_PUBLIC_MOCA_CHAIN) {
      case MocaChain.DEVNET:
        mocaChain = mocaDevnet;
        transports[mocaDevnet.id] = http();
        break;
      case MocaChain.TESTNET:
        mocaChain = mocaTestnet;
        transports[mocaTestnet.id] = http();
        break;
      default: {
        const x: never = env.NEXT_PUBLIC_MOCA_CHAIN;
        throw new Error(`Invalid MocaChain: ${x}`);
      }
    }

    return getDefaultConfig({
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
      chains: [mainnet, mocaChain],
      transports,
      appName: env.NEXT_PUBLIC_APP_NAME,
      projectId: env.NEXT_PUBLIC_REOWN_PROJECT_ID,
    });
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={
        env.NEXT_PUBLIC_THEME !== "system" ? env.NEXT_PUBLIC_THEME : undefined
      }
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ErrorHandler>
            <RainbowKitAuthenticationProvider
              adapter={authenticationAdapter}
              status={accessToken ? "authenticated" : "unauthenticated"}
            >
              <RainbowKitProvider>
                <AirkitProvider>{children}</AirkitProvider>
              </RainbowKitProvider>
            </RainbowKitAuthenticationProvider>
          </ErrorHandler>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
};
