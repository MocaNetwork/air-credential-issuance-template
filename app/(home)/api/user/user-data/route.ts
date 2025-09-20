import { signJwt } from "@/lib/utils/jwt";
import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../../../lib/env";
import { verifySessionAccessToken } from "../../auth/common/login";

interface UserDataResponse {
  jwt: string;
  response: object;
}

interface NansenBalanceToken {
  chain: string;
  address: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_amount: number;
  price_usd: number;
  value_usd: number;
}

interface NansenApiResponse {
  pagination?: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
  data?: NansenBalanceToken[];
  [key: string]: unknown;
}

const createUserDataResponse = async (
  data: object
): Promise<UserDataResponse> => {
  const jwt = await signJwt({
    partnerId: env.NEXT_PUBLIC_PARTNER_ID,
    scope: "issue",
  });

  return {
    jwt,
    response: data,
  };
};

export async function POST(request: NextRequest) {
  const sessionAccessToken = request.headers.get("Authorization");

  if (!sessionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sessionAccessTokenResult;
  try {
    sessionAccessTokenResult = await verifySessionAccessToken(
      sessionAccessToken
    );
  } catch (error) {
    console.error("Unauthorized", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sub: userId } = sessionAccessTokenResult as {
      sub: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "user Id not found" }, { status: 400 });
    }


    // Override userId for testing if test address is provided
    const effectiveUserId = env.NEXT_PRIVATE_TEST_ADDRESS || userId;

    
    // Fetch data from Nansen API
    // Current schema used is: { "address": string, "total_balance_usd": number, "token_count": number }

    let nansenData: NansenApiResponse = {};
    try {
      const nansenResponse = await fetch(
        "https://api.nansen.ai/api/v1/profiler/address/current-balance",
        {
          method: "POST",
          headers: {
            "apiKey": env.NEXT_PRIVATE_NANSEN_API_KEY,
            "Content-Type": "application/json",
            "Accept": "*/*",
          },
          body: JSON.stringify({
            address: effectiveUserId,
            chain: "ethereum",
            hide_spam_token: true,
            pagination: {
              page: 1,
              per_page: 10,
            },
          }),
        }
      );
      
      if (nansenResponse.ok) {
        nansenData = await nansenResponse.json() as NansenApiResponse;
      }
    } catch (error) {
      console.error("Failed to fetch Nansen data:", error);
    }

    console.log("nansenData");
    console.log(nansenData);

    // Calculate aggregated value_usd from all token holdings
    let totalValueUsd = 0;
    let tokenCount = 0;
    let topTokens: { symbol: string; value_usd: number }[] = [];

    if (nansenData.data && Array.isArray(nansenData.data)) {
      tokenCount = nansenData.data.length;
      
      // Loop through all tokens and sum their USD values
      for (const token of nansenData.data) {
        if (token.value_usd && typeof token.value_usd === 'number') {
          totalValueUsd += token.value_usd;
          
          // Keep track of top tokens by value (for additional insights)
          topTokens.push({
            symbol: token.token_symbol,
            value_usd: token.value_usd
          });
        }
      }

      // Sort tokens by value (highest first) and keep top 5
      topTokens.sort((a, b) => b.value_usd - a.value_usd);
      topTokens = topTokens.slice(0, 5);
    }

    console.log("effectiveUserId");
    console.log("Total aggregated value USD:", totalValueUsd);
    console.log("Token count:", tokenCount);
    console.log("Top tokens:", topTokens);

    const responseData = {
      address: effectiveUserId,
      total_balance_usd: Math.round(totalValueUsd * 100) / 100, // Round to 2 decimal places
      token_count: tokenCount,
      // top_tokens: topTokens,
    };

    return NextResponse.json(await createUserDataResponse(responseData));
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
