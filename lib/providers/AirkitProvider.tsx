import { AirService } from "@mocanetwork/airkit";
import { memo, useEffect, useMemo, useState } from "react";
import { AirkitContext } from "../contexts/AirkitContext";
import { env } from "../env";

export const defaultAirkitOptions: Parameters<
  typeof AirService.prototype.init
>[0] = {
  buildEnv: env.NEXT_PUBLIC_BUILD_ENV,
  enableLogging: true,
  skipRehydration: false,
};

export const AirkitProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const airService = useMemo(() => {
      return new AirService({
        partnerId: env.NEXT_PUBLIC_PARTNER_ID,
      });
    }, []);
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<Error | null>(null);

    useEffect(() => {
      const init = async () => {
        // Timeout protection - fail gracefully after 10 seconds
        const timeoutId = setTimeout(() => {
          console.warn("Airkit initialization timeout - checking SDK state");
          // Sync with SDK's actual state instead of assuming true
          setIsInitialized(airService.isInitialized);
        }, 10000);

        if (airService.isInitialized) {
          clearTimeout(timeoutId);
          setIsInitialized(true);
        } else {
          try {
            console.log("Initializing Airkit with options:", defaultAirkitOptions);
            await airService.init(defaultAirkitOptions);

            // Preload in background (don't block UI)
            // Track preload separately for better debugging
            airService.preloadWallet().catch((err) => {
              console.error("Wallet preload failed:", err);
            });

            airService.preloadCredential().catch((err) => {
              console.error("Credential preload failed:", err);
            });

            clearTimeout(timeoutId);
            console.log("Airkit initialized successfully");
          } catch (error) {
            console.error("Error initializing Airkit", error);
            setInitError(error as Error);
            clearTimeout(timeoutId);
          } finally {
            // CRITICAL: Always sync React state with SDK's actual initialization state
            setIsInitialized(airService.isInitialized);
          }
        }
      };

      init();
    }, [airService]);

    useEffect(() => {
      return () => {
        void airService.cleanUp();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <AirkitContext.Provider value={{ airService, isInitialized, initError }}>
        {children}
      </AirkitContext.Provider>
    );
  }
);

AirkitProvider.displayName = "AirkitProvider";
