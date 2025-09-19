"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useAccount, useDisconnect } from "wagmi";

export const Header = () => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

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
            className={`h-7 w-auto ml-4 dark:invert`}
          />
        </Link>
        {address && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mr-4">
                {formatAddress(address)}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px]">
              <DialogHeader>
                <DialogTitle>Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-mono text-sm">{formatAddress(address)}</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => disconnect()}
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
