import { NextRequest, NextResponse } from "next/server";
import { signLoginJwt } from "../common/login";
import { SiweMessage } from "siwe";
import { z } from "zod";
import { formatAddress } from "@/lib/utils";

const schema = z.object({
  message: z.string(),
  signature: z.string(),
});

const validateSignature = async (request: NextRequest) => {
  const body = await request.json();
  const parsedBody = schema.parse(body);
  const { message, signature } = parsedBody;

  try {
    const { data, success } = await new SiweMessage(message).verify({
      signature,
    });

    if (!success) {
      return { success: false, message: "Invalid signature" };
    }

    return {
      success: true,
      message: "Signature is valid",
      address: data.address,
    };
  } catch {
    return { success: false, message: "Invalid signature" };
  }
};

export const POST = async (request: NextRequest) => {
  const signatureResult = await validateSignature(request);
  if (!signatureResult.success || !signatureResult.address) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const accessToken = await signLoginJwt(
    signatureResult.address,
    formatAddress(signatureResult.address)
  );

  return NextResponse.json({
    accessToken,
    name: signatureResult.address,
    walletAddress: signatureResult.address,
  });
};
