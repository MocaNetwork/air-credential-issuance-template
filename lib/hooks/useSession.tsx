import { cookieStorage } from "wagmi";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useSession = create<{
  accessToken: string | null;
  setAccessToken: (accessToken: string | null) => void;
}>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (accessToken: string | null) => set({ accessToken }),
    }),
    {
      name: "air.issuer-template.session",
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
