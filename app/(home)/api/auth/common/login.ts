import { env } from "@/lib/env";
import { withPrivateKeyHeaders } from "@/lib/utils/jwt";
import { createPrivateKey, createPublicKey } from "crypto";
import { importPKCS8, jwtVerify, SignJWT } from "jose";

export const signLoginJwt = async (sub: string, name: string) => {
  const privateKeyPem = env.PARTNER_PRIVATE_KEY;
  const privateKey = await importPKCS8(
    withPrivateKeyHeaders(privateKeyPem),
    env.SIGNING_ALGORITHM
  );

  const jwt = new SignJWT({
    sub,
    name,
  })
    .setProtectedHeader({ alg: env.SIGNING_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(privateKey);

  return jwt;
};

export const verifySessionAccessToken = async (sessionAccessToken: string) => {
  try {
    const privateKey = createPrivateKey({
      key: withPrivateKeyHeaders(env.PARTNER_PRIVATE_KEY),
      format: "pem",
      type: "pkcs8",
    });

    const publicKey = createPublicKey(privateKey);
    const { payload } = await jwtVerify(sessionAccessToken, publicKey);

    return payload;
  } catch (error) {
    console.error(error);
    throw new Error("Invalid session access token");
  }
};
