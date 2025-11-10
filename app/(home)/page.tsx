"use client";
import { Spinner } from "@/components/ui/spinner";
import { ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";
import { GetStartedView } from "./_components/GetStartedView";

export default function Home() {
  const { isReconnecting } = useAccount();

  if (isReconnecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <div className="w-16 h-16 rounded-full bg-primary/20" />
          </div>
          <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <Spinner size="medium" />
          <p className="text-base font-medium">Retrieving your data...</p>
          <p className="text-sm text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return <GetStartedView />;
}
