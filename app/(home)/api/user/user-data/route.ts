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

    
    // Fetch data from Nansen API with pagination
    // Current schema used is: { "address": string, "total_balance_usd": number, "token_count": number }

    let allTokens: NansenBalanceToken[] = [];
    let currentPage = 1;
    let isLastPage = false;
    const perPage = 10;

    try {
      // Loop through all pages to get complete token list
      while (!isLastPage) {
        console.log(`Fetching page ${currentPage}...`);
        
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
              chain: "all",
              hide_spam_token: true,
              pagination: {
                page: currentPage,
                per_page: perPage,
              },
            }),
          }
        );
        
        if (nansenResponse.ok) {
          const pageData = await nansenResponse.json() as NansenApiResponse;
          
          // Add tokens from this page to the complete list
          if (pageData.data && Array.isArray(pageData.data)) {
            allTokens.push(...pageData.data);
          }
          
          // Check if this is the last page
          isLastPage = pageData.pagination?.is_last_page ?? true;
          
          console.log(`Page ${currentPage}: ${pageData.data?.length || 0} tokens, Last page: ${isLastPage}`);
          
          currentPage++;
          
          // Safety limit to prevent infinite loops
          if (currentPage > 100) {
            console.warn("Reached maximum page limit (100), stopping pagination");
            break;
          }
        } else {
          console.error(`Failed to fetch page ${currentPage}:`, nansenResponse.status);
          break;
        }
      }
      
      console.log(`Total tokens fetched: ${allTokens.length} across ${currentPage - 1} pages`);
      
    } catch (error) {
      console.error("Failed to fetch Nansen data:", error);
    }

    console.log("All tokens fetched:", allTokens.length);

    // Calculate aggregated value_usd from all token holdings
    let totalValueUsd = 0;
    let tokenCount = allTokens.length;
    let mocaTokenAmount = 0;

    // Loop through all tokens and sum their USD values
    for (const token of allTokens) {
      if (token.value_usd && typeof token.value_usd === 'number') {
        totalValueUsd += token.value_usd;
      }
      
      // Filter for MOCA token specifically
      if (token.token_symbol === 'MOCA') {
        mocaTokenAmount = token.token_amount || 0;
      }
    }

    console.log("effectiveUserId");
    console.log("Total aggregated value USD:", totalValueUsd);
    console.log("Token count:", tokenCount);
    console.log("MOCA token amount:", mocaTokenAmount);

    const responseData = {
      address: effectiveUserId,
      total_balance_USD: Math.round(totalValueUsd * 100) / 100, // Round to 2 decimal places
      token_count: tokenCount,
      moca_token_amount: Math.round(mocaTokenAmount * 100) / 100, // Round to 2 decimal places
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
