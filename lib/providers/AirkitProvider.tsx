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

    useEffect(() => {
      const init = async () => {
        if (airService.isInitialized) {
          setIsInitialized(true);
        } else {
          try {
            await airService.init(defaultAirkitOptions);

            Promise.all([
              airService.preloadWallet(),
              airService.preloadCredential(),
            ]);

            setIsInitialized(true);
          } catch (error) {
            console.error("Error initializing Airkit", error);
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
      <AirkitContext.Provider value={{ airService, isInitialized }}>
        {children}
      </AirkitContext.Provider>
    );
  }
);

AirkitProvider.displayName = "AirkitProvider";
