// Access tokens for Google APIs from a service account key, signed with node:crypto
// (no googleapis dependency). The token is cached and refreshed shortly before it expires.
import { createSign } from "node:crypto";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cached: { token: string; expiresAt: number } | undefined;

type ServiceAccount = { client_email: string; private_key: string };

function readServiceAccount(): ServiceAccount {
  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON!);
  } catch {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the full service account key file contents.");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key.");
  }
  return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

const b64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export async function getAccessToken(signal?: AbortSignal): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const sa = readServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key);
  const assertion = `${header}.${claims}.${b64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Google sign-in failed (HTTP ${res.status}). Check the service account key in GSC_SERVICE_ACCOUNT_JSON.`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cached.token;
}
