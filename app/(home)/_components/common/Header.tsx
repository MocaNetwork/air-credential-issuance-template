"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { env } from "@/lib/env";
import { formatAddress } from "@/lib/utils";
import { LogOut, User, Wallet } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAccount, useDisconnect } from "wagmi";

export const Header = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
        >
          <Image
            src="/logo.svg"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-auto dark:invert transition-transform group-hover:scale-105"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">{env.NEXT_PUBLIC_APP_NAME}</p>
            <p className="text-xs text-muted-foreground">Powered by Moca Network</p>
          </div>
        </Link>
        {address && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{formatAddress(address)}</span>
                <span className="sm:hidden">{formatAddress(address, 4)}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[360px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Account Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Wallet Address
                  </p>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="font-mono text-sm break-all">{address}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connected to {env.NEXT_PUBLIC_MOCA_CHAIN}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => disconnect()}
                  className="w-full gap-2"
                  size="lg"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  );
};
