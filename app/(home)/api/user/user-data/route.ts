import { signJwt } from "@/lib/utils/jwt";
import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../../../lib/env";
import { verifySessionAccessToken } from "../../auth/common/login";

interface UserDataResponse {
  jwt: string;
  response: object;
}

interface apiResponse {
  score?: number;
  level?: string;
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


    // Fetch data from Ethos API
    // Current schema used is: { "address": string, "score": integer, "level": string }\

    // Suggestion: Extract API integration to a separate service layer (e.g., /lib/services/ethos-api.ts)
    
    let apiData: apiResponse = {};
    try {
      const apiResponse = await fetch(
        `https://api.ethos.network/api/v2/score/address?address=${userId}`
      );
      if (apiResponse.ok) {
        apiData = await apiResponse.json() as apiResponse;
      }
    } catch (error) {
      console.error("Failed to fetch api data:", error);
    }

    const responseData = {
      // address: userId, 
      score: apiData.score,
      level: apiData.level,
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
