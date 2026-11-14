// Checks that the Google credentials in .env work:
//   npm run check
// 1. GSC_SERVICE_ACCOUNT_JSON is valid and Google accepts it (gets an access token).
// 2. Lists the Search Console properties the service account can see.
// 3. Confirms GSC_SITE_URL is one of them.
import { getAccessToken } from "../src/google-auth.js";

try {
  process.loadEnvFile();
} catch {
  // no .env: the variables may come from the shell
}

const ok = (msg: string) => console.log(`✔ ${msg}`);
const fail = (msg: string): never => {
  console.error(`✘ ${msg}`);
  process.exit(1);
};

if (!process.env.GSC_SERVICE_ACCOUNT_JSON) fail("GSC_SERVICE_ACCOUNT_JSON is not set. Add it to .env.");

let email = "";
try {
  email = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON!).client_email ?? "";
} catch {
  // getAccessToken reports invalid JSON below
}

let token = "";
try {
  token = await getAccessToken(AbortSignal.timeout(30_000));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
ok(`Signed in to Google as ${email}`);

const res = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites", {
  headers: { authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(30_000),
});
if (res.status === 403) {
  fail(
    "Search Console API refused the request. Enable the Google Search Console API in the service account's " +
      `Google Cloud project. ${(await res.text()).slice(0, 300)}`,
  );
}
if (!res.ok) fail(`Search Console error: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);

const { siteEntry = [] } = (await res.json()) as {
  siteEntry?: { siteUrl: string; permissionLevel: string }[];
};
if (siteEntry.length === 0) {
  fail(
    `The service account has no Search Console properties. In Search Console, add ${email} as a user ` +
      "under Settings → Users and permissions.",
  );
}
ok(`Search Console API works. Properties this service account can access:`);
for (const site of siteEntry) console.log(`    ${site.siteUrl}  (${site.permissionLevel})`);

const configured = process.env.GSC_SITE_URL;
if (!configured) fail("GSC_SITE_URL is not set. Set it to one of the properties above.");
if (!siteEntry.some((s) => s.siteUrl === configured)) {
  fail(`GSC_SITE_URL "${configured}" is not in that list. Use one of the properties above exactly as written.`);
}
ok(`GSC_SITE_URL "${configured}" is accessible. You're all set.`);
