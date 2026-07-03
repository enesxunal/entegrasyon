import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateAgentSecret(): string {
  return `uip_agent_${crypto.randomBytes(24).toString("hex")}`;
}

export function getSecretPrefix(secret: string): string {
  return secret.slice(0, 12);
}

export async function hashAgentSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, 12);
}

export async function verifyAgentSecret(
  secret: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}

export function signAgentRequest(
  secret: string,
  timestamp: string,
  nonce: string,
  rawBody: string
): string {
  const payload = `${timestamp}.${nonce}.${rawBody}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyAgentSignature(
  secret: string,
  timestamp: string,
  nonce: string,
  rawBody: string,
  signature: string
): boolean {
  const expected = signAgentRequest(secret, timestamp, nonce, rawBody);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

const TIMESTAMP_MAX_AGE_MS = 5 * 60 * 1000;

export function isTimestampValid(timestamp: string): boolean {
  const ts = Number(timestamp);
  if (Number.isNaN(ts)) return false;
  const now = Date.now();
  return Math.abs(now - ts) <= TIMESTAMP_MAX_AGE_MS;
}
