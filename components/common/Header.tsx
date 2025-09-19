"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getNameFromAccessToken } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useDisconnect } from "wagmi";
import { useAirkit } from "../../lib/hooks/useAirkit";
import { useSession } from "../../lib/hooks/useSession";
import { env } from "@/lib/env";

export const Header = () => {
  const { accessToken, setAccessToken } = useSession();
  const { airService } = useAirkit();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const isWalletLogin = env.NEXT_PUBLIC_AUTH_METHOD === "wallet";
  const isAirKitLogin = env.NEXT_PUBLIC_AUTH_METHOD === "airkit";

  const logout = async () => {
    if (isWalletLogin) {
      await wagmiDisconnect();
    }
    if (isAirKitLogin) {
      if (airService.isLoggedIn) {
        await airService.logout();
      }
    }
    setAccessToken(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto">
        <Link
          href="/"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.svg"
            alt="Logo"
            width={28}
            height={28}
            className={`h-7 w-auto ml-4 dark:invert dark:grayscale`}
          />
        </Link>
        {accessToken && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mr-4">
                {String(getNameFromAccessToken(accessToken))}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px]">
              <DialogHeader>
                <DialogTitle>Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-mono text-sm">
                    {String(getNameFromAccessToken(accessToken))}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => logout()}
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
};
