import { createEnv } from "@t3-oss/env-nextjs";
import { BUILD_ENV } from "@mocanetwork/airkit";

import { z } from "zod";

export enum MocaChain {
  DEVNET = "devnet",
  TESTNET = "testnet",
}

export const env = createEnv({
  server: {
    PARTNER_PRIVATE_KEY: z.string(),
    SIGNING_ALGORITHM: z.enum(["ES256", "RS256"]).default("ES256"),
    NEXT_PRIVATE_NANSEN_API_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_PARTNER_ID: z.string(),
    NEXT_PUBLIC_ISSUER_DID: z.string(),
    NEXT_PUBLIC_ISSUE_PROGRAM_ID: z.string(),
    NEXT_PUBLIC_HEADLINE: z.string(),
    NEXT_PUBLIC_REOWN_PROJECT_ID: z.string(),
    NEXT_PUBLIC_APP_NAME: z.string(),
    NEXT_PUBLIC_BUILD_ENV: z.enum(BUILD_ENV),
    NEXT_PUBLIC_MOCA_CHAIN: z.enum(MocaChain),
    NEXT_PUBLIC_AUTH_METHOD: z.enum(["wallet", "airkit"]).default("wallet"),
    NEXT_PUBLIC_THEME: z.enum(["light", "dark", "system"]),
  },
  runtimeEnv: {
    PARTNER_PRIVATE_KEY: process.env.PARTNER_PRIVATE_KEY,
    NEXT_PRIVATE_NANSEN_API_KEY: process.env.NEXT_PRIVATE_NANSEN_API_KEY,
    NEXT_PUBLIC_PARTNER_ID: process.env.NEXT_PUBLIC_PARTNER_ID,
    NEXT_PUBLIC_ISSUER_DID: process.env.NEXT_PUBLIC_ISSUER_DID,
    NEXT_PUBLIC_ISSUE_PROGRAM_ID: process.env.NEXT_PUBLIC_ISSUE_PROGRAM_ID,
    NEXT_PUBLIC_HEADLINE: process.env.NEXT_PUBLIC_HEADLINE,
    NEXT_PUBLIC_REOWN_PROJECT_ID: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_BUILD_ENV: process.env.NEXT_PUBLIC_BUILD_ENV,
    NEXT_PUBLIC_MOCA_CHAIN: process.env.NEXT_PUBLIC_MOCA_CHAIN,
    NEXT_PUBLIC_AUTH_METHOD: process.env.NEXT_PUBLIC_AUTH_METHOD,
    SIGNING_ALGORITHM: process.env.SIGNING_ALGORITHM,
    NEXT_PUBLIC_THEME: process.env.NEXT_PUBLIC_THEME,
  },
});

export const isProduction = process.env.NODE_ENV === "production";
