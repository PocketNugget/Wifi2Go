import * as jose from "npm:jose";

const JWT_SECRET = new TextEncoder().encode(Deno.env.get("JWT_SECRET") || "super-secret-wifi2go-key");

export async function generateToken(payload: Record<string, unknown>): Promise<string> {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(JWT_SECRET);
  return jwt;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (_e) {
    return null;
  }
}
