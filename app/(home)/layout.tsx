"use client";
import { Toaster } from "@/components/ui/sonner";
import "@rainbow-me/rainbowkit/styles.css";
import dynamic from "next/dynamic";
import { Header } from "@/components/common/Header";

const Providers = dynamic(
  () => import("../../lib/providers").then((m) => m.Providers),
  {
    ssr: false,
  }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Providers>
        <Header />
        {children}
      </Providers>
      <Toaster position="top-center" />
    </>
  );
}
