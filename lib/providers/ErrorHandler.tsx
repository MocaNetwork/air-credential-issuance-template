import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect } from "react";
import { toast } from "sonner";
import { useDisconnect } from "wagmi";
import { useSession } from "../hooks/useSession";

export const ErrorHandler = ({ children }: { children: React.ReactNode }) => {
  const { disconnect } = useDisconnect();
  const { setAccessToken } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleError = (error: Error) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        disconnect();
        setAccessToken(null);
        toast.error("Session expired, please connect your wallet again");
      }
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.state.error instanceof Error
      ) {
        handleError(event.query.state.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [disconnect, setAccessToken, queryClient]);

  return <>{children}</>;
};
