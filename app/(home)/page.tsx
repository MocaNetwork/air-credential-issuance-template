"use client";
import { Spinner } from "@/components/ui/spinner";
import { useAccount } from "wagmi";
import { GetStartedView } from "./_components/GetStartedView";

export default function Home() {
  const { isReconnecting } = useAccount();

  if (isReconnecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-1">
        <Spinner size="medium" />
        <p className="text-sm text-muted-foreground">Retrieving your data...</p>
      </div>
    );
  }

  return <GetStartedView />;
}
