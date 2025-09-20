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

interface NansenHistoricalBalance {
  block_timestamp: string;
  chain: string;
  address?: string;
  token_address: string;
  token_symbol: string;
  token_name?: string;
  token_amount: number;
  price_usd?: number;
  value_usd: number;
}

interface NansenHistoricalApiResponse {
  pagination?: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
  data?: NansenHistoricalBalance[];
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

    // Fetch historical balance data for the last 30 days
    let allHistoricalBalances: NansenHistoricalBalance[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();

    console.log("Historical date range:");
    console.log("From:", thirtyDaysAgo.toISOString());
    console.log("To:", today.toISOString());

    try {
      let currentHistoricalPage = 1;
      let isLastHistoricalPage = false;

      // Loop through all pages to get complete historical data
      while (!isLastHistoricalPage) {
        console.log(`Fetching historical page ${currentHistoricalPage}...`);
        
        const historicalResponse = await fetch(
          "https://api.nansen.ai/api/v1/profiler/address/historical-balances",
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
              date: {
                from: thirtyDaysAgo.toISOString(),
                to: today.toISOString(),
              },
              pagination: {
                page: currentHistoricalPage,
                per_page: perPage,
              },
            }),
          }
        );
        
        if (historicalResponse.ok) {
          const historicalPageData = await historicalResponse.json() as NansenHistoricalApiResponse;
          
          console.log(`Historical page ${currentHistoricalPage} response:`, JSON.stringify(historicalPageData, null, 2));
          
          // Add historical data from this page to the complete list
          if (historicalPageData.data && Array.isArray(historicalPageData.data)) {
            console.log(`Adding ${historicalPageData.data.length} records from page ${currentHistoricalPage}`);
            allHistoricalBalances.push(...historicalPageData.data);
          }
          
          // Check if this is the last page
          isLastHistoricalPage = historicalPageData.pagination?.is_last_page ?? true;
          
          console.log(`Historical page ${currentHistoricalPage}: ${historicalPageData.data?.length || 0} records, Last page: ${isLastHistoricalPage}`);
          console.log(`Total historical records so far: ${allHistoricalBalances.length}`);
          
          currentHistoricalPage++;
          
          // Safety limit to prevent infinite loops
          if (currentHistoricalPage > 100) {
            console.warn("Reached maximum historical page limit (100), stopping pagination");
            break;
          }
        } else {
          const errorText = await historicalResponse.text();
          console.error(`Failed to fetch historical page ${currentHistoricalPage}:`, historicalResponse.status);
          console.error(`Historical API error response:`, errorText);
          break;
        }
      }
      
      console.log(`Total historical records fetched: ${allHistoricalBalances.length} across ${currentHistoricalPage - 1} pages`);
      
      // Debug: Show date distribution of historical data
      const dateDistribution = new Map<string, number>();
      for (const record of allHistoricalBalances) {
        if (record.block_timestamp) {
          const dateKey = record.block_timestamp.split('T')[0];
          dateDistribution.set(dateKey, (dateDistribution.get(dateKey) || 0) + 1);
        }
      }
      
      console.log("Historical data distribution by date:");
      const sortedDates = Array.from(dateDistribution.entries()).sort();
      for (const [date, count] of sortedDates) {
        console.log(`  ${date}: ${count} records`);
      }
      
    } catch (error) {
      console.error("Failed to fetch historical Nansen data:", error);
    }

    console.log("All tokens fetched:", allTokens.length);
    console.log("All historical balances fetched:", allHistoricalBalances.length);
    
    // Debug: Check the structure of the first few historical records
    if (allHistoricalBalances.length > 0) {
      console.log("Sample historical record structure:");
      console.log("First record:", JSON.stringify(allHistoricalBalances[0], null, 2));
      if (allHistoricalBalances.length > 1) {
        console.log("Second record:", JSON.stringify(allHistoricalBalances[1], null, 2));
      }
    }

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

    // Calculate historical balance statistics (last 30 days)
    let historicalTotalBalance = 0;
    let historicalMocaBalance = 0;
    
    // Group historical data by date and get the most recent entry for each date
    const historicalByDate = new Map<string, NansenHistoricalBalance[]>();
    
    console.log("Processing historical records for date grouping...");
    let validRecords = 0;
    let invalidRecords = 0;
    
    for (const historical of allHistoricalBalances) {
      // Debug each record
      console.log("Processing record:", {
        hasBlockTimestamp: !!historical.block_timestamp,
        timestampType: typeof historical.block_timestamp,
        timestampValue: historical.block_timestamp,
        tokenSymbol: historical.token_symbol
      });
      
      // Skip records without a valid block_timestamp
      if (!historical.block_timestamp || typeof historical.block_timestamp !== 'string') {
        console.warn("Skipping historical record with invalid block_timestamp:", historical);
        invalidRecords++;
        continue;
      }
      
      const dateKey = historical.block_timestamp.split('T')[0]; // Get just the date part
      if (!historicalByDate.has(dateKey)) {
        historicalByDate.set(dateKey, []);
      }
      historicalByDate.get(dateKey)!.push(historical);
      validRecords++;
    }
    
    console.log(`Historical record processing: ${validRecords} valid, ${invalidRecords} invalid`);
    console.log("Historical dates found:", Array.from(historicalByDate.keys()));
    
    // Calculate average historical balances across the 30-day period
    let totalDaysWithData = 0;
    let totalValueSum = 0;
    let mocaValueSum = 0;
    
    for (const [date, dayBalances] of historicalByDate) {
      let dayTotalValue = 0;
      let dayMocaValue = 0;
      
      console.log(`Processing date ${date} with ${dayBalances.length} token records:`);
      
      for (const balance of dayBalances) {
        if (balance.value_usd && typeof balance.value_usd === 'number') {
          dayTotalValue += balance.value_usd;
          console.log(`  ${balance.token_symbol}: $${balance.value_usd.toFixed(2)}`);
        }
        
        if (balance.token_symbol === 'MOCA' && balance.token_amount) {
          dayMocaValue += balance.token_amount;
          console.log(`  MOCA found: ${balance.token_amount} tokens`);
        }
      }
      
      console.log(`  Date ${date} total: $${dayTotalValue.toFixed(2)} USD, ${dayMocaValue} MOCA tokens`);
      
      totalValueSum += dayTotalValue;
      mocaValueSum += dayMocaValue;
      totalDaysWithData++;
    }
    
    // Calculate averages
    if (totalDaysWithData > 0) {
      historicalTotalBalance = totalValueSum / totalDaysWithData;
      historicalMocaBalance = mocaValueSum / totalDaysWithData;
    }

    console.log("effectiveUserId");
    console.log("Total aggregated value USD:", totalValueUsd);
    console.log("Token count:", tokenCount);
    console.log("MOCA token amount:", mocaTokenAmount);
    console.log("Historical average total balance USD:", historicalTotalBalance);
    console.log("Historical average MOCA balance:", historicalMocaBalance);
    console.log("Days with historical data:", totalDaysWithData);

    const responseData = {
      address: effectiveUserId,
      total_balance_USD: Math.round(totalValueUsd * 100) / 100, // Round to 2 decimal places
      token_count: tokenCount,
      moca_token_amount: Math.round(mocaTokenAmount * 100) / 100, // Round to 2 decimal places
      historical_avg_total_balance_USD: Math.round(historicalTotalBalance * 100) / 100, // 30-day average
      historical_avg_moca_balance: Math.round(historicalMocaBalance * 100) / 100, // 30-day average
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
