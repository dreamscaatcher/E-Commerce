import crypto from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(crypto.pbkdf2);

const FORMAT_PREFIX = "pbkdf2_sha256";
const DEFAULT_ITERATIONS = 120_000;
const DEFAULT_KEYLEN = 32;
const DEFAULT_DIGEST = "sha256";

export async function hashCustomerPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await pbkdf2Async(
    password,
    salt,
    DEFAULT_ITERATIONS,
    DEFAULT_KEYLEN,
    DEFAULT_DIGEST
  );

  return [
    FORMAT_PREFIX,
    String(DEFAULT_ITERATIONS),
    salt.toString("base64"),
    Buffer.from(derived).toString("base64"),
  ].join("$");
}

export async function verifyCustomerPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [prefix, iterationsRaw, saltB64, hashB64] = storedHash.split("$");
  if (prefix !== FORMAT_PREFIX) return false;
  if (!iterationsRaw || !saltB64 || !hashB64) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 10_000 || iterations > 10_000_000) {
    return false;
  }

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(hashB64, "base64");
  } catch {
    return false;
  }

  if (salt.length < 8 || expected.length < 16) return false;

  const derived = await pbkdf2Async(password, salt, iterations, expected.length, DEFAULT_DIGEST);
  const derivedBuffer = Buffer.from(derived);
  if (derivedBuffer.length !== expected.length) return false;

  return crypto.timingSafeEqual(expected, derivedBuffer);
}

