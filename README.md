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
4. Use the key file's contents as the value (on one line in `.env`).

### Getting `GSC_SITE_URL`

The property name as shown in Search Console: `sc-domain:example.com` for a domain property, or
the full URL such as `https://www.example.com/` for a URL-prefix property.

## Deploy

Run `npm run package`, upload the zip in your server's **Tools** tab and add the environment
variables under **Environment Secrets**. See the
[MCP Express getting started guide](https://www.mcp-express.com/docs/getting-started/) for details.
