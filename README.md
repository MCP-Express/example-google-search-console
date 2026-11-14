# Google Search Console tools for MCP Express

MCP tools that let an AI client query [Google Search Console](https://search.google.com/search-console),
built with [`@mcpexpress/core`](https://www.npmjs.com/package/@mcpexpress/core).

## Features

- **`get_search_performance`**: total clicks, impressions, CTR and average position of the
  configured Search Console property for a date range.

## Environment variables

| Variable                   | Required | Description                                                     |
| -------------------------- | -------- | --------------------------------------------------------------- |
| `GSC_SERVICE_ACCOUNT_JSON` | yes      | Full contents of a Google Cloud service account key file (JSON) |
| `GSC_SITE_URL`             | yes      | The Search Console property to query                            |

Locally, put them in `.env` (see `.env.example`). On MCP Express, set them in the server's
**Environment Secrets** tab.

### Getting `GSC_SERVICE_ACCOUNT_JSON`

1. In the [Google Cloud console](https://console.cloud.google.com/), enable the
   [Google Search Console API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com).
2. Under [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts), create a
   service account, then **Keys → Add key → Create new key → JSON** to download its key.
3. In [Search Console](https://search.google.com/search-console), open your property, go to
   **Settings → Users and permissions** and add the key's `client_email` as a **Restricted** user.
4. Use the key file's contents as the value. In `.env`, put the raw JSON on one line, wrapped in
   single quotes, and keep the `\n` in `private_key` as they are (don't escape the JSON):

   ```
   GSC_SERVICE_ACCOUNT_JSON='{"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n","client_email":"gsc-reader@my-project.iam.gserviceaccount.com",...}'
   ```

   This prints your key file on one line:

   ```bash
   node -e 'console.log(JSON.stringify(require(process.argv[1])))' ./path/to/key.json
   ```

   On MCP Express, paste the file contents into **Environment Secrets** as they are, without quotes.

### Getting `GSC_SITE_URL`

The property name as shown in Search Console: `sc-domain:example.com` for a domain property, or
the full URL such as `https://www.example.com/` for a URL-prefix property.

## Check your setup

Run `npm run check`. It signs in with `GSC_SERVICE_ACCOUNT_JSON`, lists the Search Console
properties the service account can access, and confirms `GSC_SITE_URL` is one of them. If a step
fails, the message says what to fix.

## Deploy

Run `npm run package`, upload the zip in your server's **Tools** tab and add the environment
variables under **Environment Secrets**. See the
[MCP Express getting started guide](https://www.mcp-express.com/docs/getting-started/) for details.
