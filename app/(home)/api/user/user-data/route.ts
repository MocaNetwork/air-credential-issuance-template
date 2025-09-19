import { signJwt } from "@/lib/utils/jwt";
import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../../../lib/env";
import { verifySessionAccessToken } from "../../auth/common/login";

interface UserDataResponse {
  jwt: string;
  response: object;
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

    // TODO: replace with real data fetching logic based on userId
    // this could be an API to your Backend
    // this example has hardcoded data for demonstration purposes
    // the data here should match the credentialSubject schema defined in your Issuance Program
    // you can find it in the Developer Dashboard
    // e.g. { "name": "John Doe", "age": 30 }
    // Make sure to include all required fields
    const responseData = { total_volume: 21 };

    return NextResponse.json(await createUserDataResponse(responseData));
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
