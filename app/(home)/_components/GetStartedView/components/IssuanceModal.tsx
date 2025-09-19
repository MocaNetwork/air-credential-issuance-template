import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { useAirkit } from "@/lib/hooks/useAirkit";
import { useSession } from "@/lib/hooks/useSession";
import { formatKey, getNameFromAccessToken } from "@/lib/utils";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useUserData } from "../hooks";

export function IssuanceModal() {
  const { airService, isInitialized } = useAirkit();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();
  const { data: userData, isError, refetch } = useUserData();
  const { accessToken, setAccessToken } = useSession();
  const [isWidgetLoading, setIsWidgetLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  let name = getNameFromAccessToken(accessToken);
  const isWalletLogin = env.NEXT_PUBLIC_AUTH_METHOD === "wallet";
  const isAirKitLogin = env.NEXT_PUBLIC_AUTH_METHOD === "airkit";

  const issueCredential = async ({
    response,
    jwt,
  }: {
    response: Record<string, object | string | number | null>;
    jwt: string;
  }) => {
    setIsWidgetLoading(true);
    try {
      const credentialSubject = { ...response };
      for (const key in credentialSubject) {
        if (credentialSubject[key] == null) {
          delete credentialSubject[key];
        }
      }
      await airService.issueCredential({
        authToken: jwt,
        credentialId: env.NEXT_PUBLIC_ISSUE_PROGRAM_ID,
        credentialSubject,
        issuerDid: env.NEXT_PUBLIC_ISSUER_DID,
      });
      setIsSuccess(true);
    } finally {
      setIsWidgetLoading(false);
    }
  };

  const onContinue = async () => {
    try {
      if (isWalletLogin) {
        if (!accessToken || !isConnected) {
          openConnectModal?.();
          return;
        }
      }

      while (!airService.isLoggedIn) {
        await airService.login();
      }

      if (isAirKitLogin && !accessToken) {
        try {
          const airkitToken = await airService.getAccessToken();
          const name = (await airService.getUserInfo())?.user?.email;

          const verifyRes = await fetch("/api/auth/airkit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${airkitToken.token}`,
            },
            body: JSON.stringify({ name }),
          });

          const data = (await verifyRes.json()) as {
            accessToken: string;
            walletAddress: string;
          };

          if (!data.accessToken) {
            throw new Error("Invalid login");
          }
          setAccessToken(data.accessToken);
          await refetch();
        } catch (error) {
          console.error(error);
          throw error;
        }
      }

      name = getNameFromAccessToken(accessToken);

      if (!userData) {
        throw new Error("No user data");
      }

      const { response, jwt } = userData;

      await issueCredential({ response: response as Record<string, string | number | object | null>, jwt });
    } catch (error) {
      console.error(error);
    }
  };

  const isLoading = isWidgetLoading || !isInitialized;
  const loadingText = !isInitialized ? "Initializing..." : "Loading...";
  const response = userData?.response;

  if (isSuccess) {
    return (
      <div className="w-full max-w-[420px] text-sm text-center">
        🎉 Congrats! You have successfully stored your data securely.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="text-2xl font-bold">{env.NEXT_PUBLIC_HEADLINE}</div>

      {isError ? (
        <div className="w-full max-w-[420px] text-sm text-destructive text-center">
          Failed to load user data. Please try again.
        </div>
      ) : (
        <>
          {response && (
            <>
              <div className="text-sm text-muted-foreground">
                {name && <>Welcome, {name}!</>}
              </div>
              <div className="space-y-0 text-center">
                {Object.entries(response).map(([key, value]) => (
                  <div key={key}>
                    {formatKey(key)}: {value ?? "N/A"}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {isError ? (
        <Button
          className="w-full max-w-[200px]"
          size="lg"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      ) : (
        <Button
          className="w-full max-w-[200px]"
          size="lg"
          onClick={onContinue}
          isLoading={isLoading}
        >
          {isLoading
            ? loadingText
            : accessToken
            ? "Continue"
            : isWalletLogin
            ? "Connect Wallet"
            : "Login"}
        </Button>
      )}
    </div>
  );
}
