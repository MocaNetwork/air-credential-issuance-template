import { NextRequest, NextResponse } from "next/server";
import { signLoginJwt } from "../common/login";

import { env } from "@/lib/env";
import { BUILD_ENV } from "@mocanetwork/airkit";
import * as jose from "jose";

interface TokenPayload {
  sub: string;
  abstractAccountAddress?: string;
}

const validateAuthorizationHeader = async (
  request: NextRequest
): Promise<
  | { success: true; accessToken: string; payload: TokenPayload }
  | { success: false; response: NextResponse }
> => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

  const accessToken = authHeader.replace("Bearer ", "");
  if (!accessToken) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing access token" },
        { status: 401 }
      ),
    };
  }

  const tokenValidation = await validateAccessToken(accessToken);
  if (!tokenValidation.isValid || !tokenValidation.payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: tokenValidation.error || "Invalid access token" },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    accessToken,
    payload: tokenValidation.payload,
  };
};

export const POST = async (request: NextRequest) => {
  const bearerToken = await validateAuthorizationHeader(request);

  if (!bearerToken.success || !bearerToken.payload?.abstractAccountAddress) {
    return NextResponse.json(
      { error: "Invalid AIR Kit session" },
      { status: 400 }
    );
  }

  const payload = bearerToken.payload;
  const name = (await request.json())?.name ?? payload.abstractAccountAddress;
  const accessToken = await signLoginJwt(payload.sub, name);

  return NextResponse.json({
    accessToken,
    name,
    walletAddress: payload.abstractAccountAddress,
  });
};

interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload;
  error?: string;
}

const validateAccessToken = async (
  token: string
): Promise<TokenValidationResult> => {
  try {
    const JWKS = jose.createRemoteJWKSet(
      new URL(
        `https://static.${
          env.NEXT_PUBLIC_BUILD_ENV !== BUILD_ENV.PRODUCTION
            ? `${env.NEXT_PUBLIC_BUILD_ENV}.`
            : ""
        }air3.com/.well-known/jwks.json`
      )
    );

    const { payload } = await jose.jwtVerify<TokenPayload>(token, JWKS);

    return {
      isValid: true,
      payload,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Token validation failed",
    };
  }
};
