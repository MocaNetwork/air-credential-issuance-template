import { signJwt } from "@/lib/utils/jwt";
import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../../../lib/env";
import { verifySessionAccessToken } from "../../auth/common/login";

// =============================================
// TYPE DEFINITIONS
// =============================================

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

interface DateInterval {
  from: string;
  to: string;
  label: string;
}

// =============================================
// CONFIGURATION
// =============================================

const CONFIG = {
  // Pagination settings
  CURRENT_BALANCE_PER_PAGE: 200,
  HISTORICAL_PER_PAGE: 200,
  MAX_PAGES_SAFETY_LIMIT: 100,
  MAX_INTERVAL_PAGES_LIMIT: 50,
  
  // Historical data settings
  TOTAL_DAYS: 30,
  INTERVAL_DAYS: 7, // Can be adjusted: 1, 3, 7, 14, etc.
  
  // API endpoints
  NANSEN_BASE_URL: "https://api.nansen.ai/api/v1/profiler/address",
  CURRENT_BALANCE_ENDPOINT: "/current-balance",
  HISTORICAL_BALANCE_ENDPOINT: "/historical-balances",
  
  // Token filter
  TARGET_TOKEN_SYMBOL: "MOCA",
  CHAIN: "all",
  
  // Test configuration (can be easily switched for test builds)
  // TEST_ADDRESS: null as string | null, // Set to wallet address for testing, null for production
  TEST_ADDRESS: "0x5ED0F666E6C20F5EEb2214514B56DF2adC47A0b2",
  // Example: TEST_ADDRESS: "0x5ED0F666E6C20F5EEb2214514B56DF2adC47A0b2",
} as const;

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Creates a signed JWT response for user data
 */
const createUserDataResponse = async (data: object): Promise<UserDataResponse> => {
  const jwt = await signJwt({
    partnerId: env.NEXT_PUBLIC_PARTNER_ID,
    scope: "issue",
  });

  return { jwt, response: data };
};

/**
 * Generates date intervals for historical data fetching
 * Splits the total period into smaller chunks to handle API limits
 */
const generateDateIntervals = (totalDays: number, intervalDays: number): DateInterval[] => {
  const numIntervals = Math.ceil(totalDays / intervalDays);
  const intervals: DateInterval[] = [];
  
  for (let i = 0; i < numIntervals; i++) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (i * intervalDays));
    endDate.setUTCHours(23, 59, 59, 999);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (intervalDays - 1));
    startDate.setUTCHours(0, 0, 0, 0);
    
    intervals.push({
      from: startDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      to: endDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      label: `Interval ${i + 1} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`
    });
  }
  
  return intervals;
};

/**
 * Fetches current token balances from Nansen API with pagination
 * Returns all tokens for the specified address
 */
const fetchCurrentTokenBalances = async (address: string): Promise<NansenBalanceToken[]> => {
  const allTokens: NansenBalanceToken[] = [];
  let currentPage = 1;
  let isLastPage = false;

  console.log("🔄 Starting current balance fetch...");

  try {
    while (!isLastPage) {
      console.log(`📄 Fetching current balances page ${currentPage}...`);
      
      const response = await fetch(`${CONFIG.NANSEN_BASE_URL}${CONFIG.CURRENT_BALANCE_ENDPOINT}`, {
        method: "POST",
        headers: {
          "apiKey": env.NEXT_PRIVATE_NANSEN_API_KEY,
          "Content-Type": "application/json",
          "Accept": "*/*",
        },
        body: JSON.stringify({
          address,
          chain: CONFIG.CHAIN,
          hide_spam_token: true,
          pagination: {
            page: currentPage,
            per_page: CONFIG.CURRENT_BALANCE_PER_PAGE,
          },
        }),
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to fetch page ${currentPage}: ${response.status}`);
        break;
      }

      const pageData = await response.json() as NansenApiResponse;
      
      if (pageData.data && Array.isArray(pageData.data)) {
        allTokens.push(...pageData.data);
        console.log(`✅ Page ${currentPage}: ${pageData.data.length} tokens added`);
      }
      
      isLastPage = pageData.pagination?.is_last_page ?? true;
      currentPage++;
      
      // Safety limit to prevent infinite loops
      if (currentPage > CONFIG.MAX_PAGES_SAFETY_LIMIT) {
        console.warn(`⚠️ Reached safety limit (${CONFIG.MAX_PAGES_SAFETY_LIMIT} pages), stopping pagination`);
        break;
      }
    }
    
    console.log(`✅ Current balance fetch complete: ${allTokens.length} tokens across ${currentPage - 1} pages`);
    return allTokens;
    
  } catch (error) {
    console.error("❌ Failed to fetch current token balances:", error);
    return [];
  }
};

/**
 * Fetches historical MOCA token data from Nansen API for specified intervals
 * Uses server-side filtering for MOCA tokens to optimize data transfer
 */
const fetchHistoricalMocaBalances = async (address: string, intervals: DateInterval[]): Promise<NansenHistoricalBalance[]> => {
  const allHistoricalData: NansenHistoricalBalance[] = [];

  console.log("🔄 Starting historical MOCA data fetch...");
  console.log(`📊 Configuration: ${intervals.length} intervals of ${CONFIG.INTERVAL_DAYS} days each`);

  try {
    for (let intervalIndex = 0; intervalIndex < intervals.length; intervalIndex++) {
      const interval = intervals[intervalIndex];
      console.log(`\n📅 === Fetching ${interval.label} ===`);
      
      let currentPage = 1;
      let isLastPage = false;

      while (!isLastPage) {
        console.log(`📄 ${interval.label} - page ${currentPage}...`);
        
        const requestBody = {
          address,
          chain: CONFIG.CHAIN,
          date: {
            from: interval.from,
            to: interval.to,
          },
          filters: {
            token_symbol: CONFIG.TARGET_TOKEN_SYMBOL
          },
          pagination: {
            page: currentPage,
            per_page: CONFIG.HISTORICAL_PER_PAGE,
          },
        };
        
        const response = await fetch(`${CONFIG.NANSEN_BASE_URL}${CONFIG.HISTORICAL_BALANCE_ENDPOINT}`, {
          method: "POST",
          headers: {
            "apiKey": env.NEXT_PRIVATE_NANSEN_API_KEY,
            "Content-Type": "application/json",
            "Accept": "*/*",
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to fetch ${interval.label} page ${currentPage}: ${response.status}`);
          console.error(`Error response: ${errorText}`);
          break;
        }

        const pageData = await response.json() as NansenHistoricalApiResponse;
        
        if (pageData.data && Array.isArray(pageData.data)) {
          allHistoricalData.push(...pageData.data);
          console.log(`✅ ${interval.label} page ${currentPage}: ${pageData.data.length} MOCA records added`);
        }
        
        isLastPage = pageData.pagination?.is_last_page ?? true;
        currentPage++;
        
        // Safety limit per interval
        if (currentPage > CONFIG.MAX_INTERVAL_PAGES_LIMIT) {
          console.warn(`⚠️ Reached interval limit (${CONFIG.MAX_INTERVAL_PAGES_LIMIT} pages) for ${interval.label}`);
          break;
        }
      }
      
      console.log(`✅ Completed ${interval.label}: ${allHistoricalData.length} total MOCA records`);
    }
    
    console.log(`✅ Historical fetch complete: ${allHistoricalData.length} MOCA records total`);
    return allHistoricalData;
    
  } catch (error) {
    console.error("❌ Failed to fetch historical MOCA balances:", error);
    return [];
  }
};

/**
 * Calculates portfolio metrics from current token balances
 */
const calculateCurrentMetrics = (tokens: NansenBalanceToken[]) => {
  let totalValueUsd = 0;
  let mocaTokenAmount = 0;
  const tokenCount = tokens.length;

  console.log("🧮 Calculating current portfolio metrics...");

  for (const token of tokens) {
    // Sum total USD value across all tokens
    if (token.value_usd && typeof token.value_usd === 'number') {
      totalValueUsd += token.value_usd;
    }
    
    // Extract current MOCA amount
    if (token.token_symbol === CONFIG.TARGET_TOKEN_SYMBOL) {
      mocaTokenAmount = token.token_amount || 0;
      console.log(`🪙 Found current MOCA balance: ${mocaTokenAmount}`);
    }
  }

  console.log(`💰 Total portfolio value: $${totalValueUsd.toFixed(2)}`);
  console.log(`🔢 Token count: ${tokenCount}`);

  return {
    totalValueUsd,
    tokenCount,
    mocaTokenAmount
  };
};

/**
 * Calculates historical MOCA balance statistics (hourly averages over the period)
 */
const calculateHistoricalMocaMetrics = (historicalData: NansenHistoricalBalance[]) => {
  console.log("🧮 Calculating historical MOCA metrics...");
  
  // Group data by hour for averaging
  const mocaByHour = new Map<string, NansenHistoricalBalance[]>();
  let validRecords = 0;
  let invalidRecords = 0;
  
  for (const record of historicalData) {
    if (!record.block_timestamp || typeof record.block_timestamp !== 'string') {
      invalidRecords++;
      continue;
    }
    
    // Create hourly key (YYYY-MM-DD HH:00:00)
    const hourKey = record.block_timestamp.substring(0, 13) + ':00:00';
    if (!mocaByHour.has(hourKey)) {
      mocaByHour.set(hourKey, []);
    }
    mocaByHour.get(hourKey)!.push(record);
    validRecords++;
  }
  
  console.log(`📊 Historical data processing: ${validRecords} valid, ${invalidRecords} invalid records`);
  console.log(`⏰ Unique hours found: ${mocaByHour.size}`);
  
  // Calculate average MOCA balance across all hours
  let totalHours = 0;
  let mocaSum = 0;
  
  for (const [, hourData] of mocaByHour) {
    let hourMocaTotal = 0;
    
    for (const balance of hourData) {
      if (balance.token_amount && typeof balance.token_amount === 'number') {
        hourMocaTotal += balance.token_amount;
      }
    }
    
    mocaSum += hourMocaTotal;
    totalHours++;
  }
  
  const averageBalance = totalHours > 0 ? mocaSum / totalHours : 0;
  
  console.log(`📈 Historical MOCA average: ${averageBalance.toFixed(2)} tokens over ${totalHours} hours`);
  
  return {
    historicalMocaBalance: averageBalance,
    totalHoursWithData: totalHours
  };
};

// =============================================
// MAIN API HANDLER
// =============================================

export async function POST(request: NextRequest) {
  // 1. Authentication & Authorization
  const sessionAccessToken = request.headers.get("Authorization");
  if (!sessionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sessionAccessTokenResult;
  try {
    sessionAccessTokenResult = await verifySessionAccessToken(sessionAccessToken);
  } catch (error) {
    console.error("❌ Unauthorized", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Extract and validate user information
    const { sub: userId } = sessionAccessTokenResult as { sub: string };
    if (!userId) {
      return NextResponse.json({ error: "user Id not found" }, { status: 400 });
    }

    // 3. Determine effective user ID (test mode override)
    const effectiveUserId = CONFIG.TEST_ADDRESS || userId;
    const isUsingTestAddress = !!CONFIG.TEST_ADDRESS;

    console.log("🚀 Starting Nansen data fetch process...");
    console.log(`👤 Target address: ${effectiveUserId}${isUsingTestAddress ? ' (TEST MODE)' : ''}`);

    // 4. Fetch current token balances
    const currentTokens = await fetchCurrentTokenBalances(effectiveUserId);
    
    // 5. Generate date intervals for historical data
    const intervals = generateDateIntervals(CONFIG.TOTAL_DAYS, CONFIG.INTERVAL_DAYS);
    
    // 6. Fetch historical MOCA data
    const historicalMocaData = await fetchHistoricalMocaBalances(effectiveUserId, intervals);
    
    // 7. Calculate current portfolio metrics
    const currentMetrics = calculateCurrentMetrics(currentTokens);
    
    // 8. Calculate historical MOCA metrics
    const historicalMetrics = calculateHistoricalMocaMetrics(historicalMocaData);

    // 9. Log final results
    console.log("📊 === FINAL METRICS ===");
    console.log(`💰 Total Portfolio Value: $${currentMetrics.totalValueUsd.toFixed(2)}`);
    console.log(`🔢 Total Tokens: ${currentMetrics.tokenCount}`);
    console.log(`🪙 Current MOCA: ${currentMetrics.mocaTokenAmount} tokens`);
    console.log(`📈 Historical MOCA Average: ${historicalMetrics.historicalMocaBalance.toFixed(2)} tokens (${historicalMetrics.totalHoursWithData} hours)`);

    // 10. Prepare response data
    const responseData = {
      address: effectiveUserId,
      is_test_address: isUsingTestAddress,
      total_balance_USD: Math.round(currentMetrics.totalValueUsd),
      token_count: currentMetrics.tokenCount,
      moca_token_amount: Math.round(currentMetrics.mocaTokenAmount),
      historical_avg_30D_hourly_moca_balance: Math.round(historicalMetrics.historicalMocaBalance),
    };

    console.log("✅ Nansen data processing complete!");
    return NextResponse.json(await createUserDataResponse(responseData));

  } catch (error) {
    console.error("❌ Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
