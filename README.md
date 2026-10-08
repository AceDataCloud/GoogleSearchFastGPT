# Ace Data Cloud Google Search for FastGPT

Search Google web results through a FastGPT tool. The same plugin can also search images, news, maps, places, and videos. [简体中文](README_zh_CN.md) · [Current pricing](https://platform.acedata.cloud/models)

## Quick start

### 1. Install the plugin

Use FastGPT 4.15 or later. Once published, search FastGPT Marketplace for **Ace Data Cloud Google Search** and check the author is **Ace Data Cloud** before installing. Before Marketplace publication, a business or self-hosted FastGPT administrator can build and upload this repository's .pkg on the plugin management page. FastGPT Cloud does not currently support direct custom plugin uploads.

### 2. Get the correct API key

1. Sign in to [Ace Data Cloud → Applications](https://platform.acedata.cloud/console/applications) and open **General Application**. Confirm **Google Search** access, the current price, and a sufficient balance.
2. Copy the existing API key with the icon marked **1** below. For a separate FastGPT key, choose **Manage Keys** marked **2**, then **Create**. If you enable **Allowed APIs**, include /serp/google.

![Actual Ace Data Cloud application screen with the key redacted](assets/get-api-key-en.png)

In the installed FastGPT plugin configuration, paste only the token string into **Ace Data Cloud API key**. Do not add Bearer, quotes, or the screenshot's redacted characters. Never place the key in a prompt or workflow export.

### 3. Build the first workflow

Create a blank FastGPT workflow and connect **Start → Ace Data Cloud Google Search → Output**. Set the tool fields as follows:

| Field | First-run value |
|---|---|
| Query | site:fastgpt.io plugin development |
| Search type | search |
| Results to show | 3 |
| Page | 1 |

Leave country, language, time range, and image size empty for the first run. Bind the Output node to the tool's **items**, **returnedCount**, **costCredits**, and **traceId** outputs. Run once and open a URL in items. A web item includes title, URL, and snippet. This API is synchronous: there is no task ID or polling step.

The API may return more items than requested for some search types; the plugin shows at most **Results to show** and reports the full **API result count** separately. Check the Ace Data Cloud request record and Credits charge for this one query.

### 4. Copyable local example without a key in the repository

[examples/search.json](examples/search.json) contains no credentials. Create a local .secrets.local.json with {"apiKey":"YOUR_OWN_KEY"} and run:

~~~sh
pnpm install
pnpm exec fastgpt-plugin debug . --run --input-file examples/search.json --secrets-file .secrets.local.json
pnpm exec fastgpt-plugin build --entry . --output ./dist
pnpm exec fastgpt-plugin check --entry . --output ./dist
pnpm exec fastgpt-plugin pack --entry . --dist ./dist --output ./out
~~~

The secret file is ignored by Git. Never publish it or a screenshot of it.

## Other search types

Change **Search type** to images, news, maps, places, or videos. For images, **imageUrl** is the full-size result; avoid using the tiny thumbnail for final media. **Image size** applies only to images; use large or a megapixel minimum for full-screen images. **Time range** applies only to web search and news. Country and language codes are optional localization controls. Each invocation is a separate billable search.

## Troubleshooting

| What you see | What to do |
|---|---|
| 401 / 403 | Check the complete API key, expiration, Google Search access, Allowed APIs, and balance. |
| 400 | Check query, search type, page, and that time range/image size match the chosen type. |
| No items | Try a broader query or another country/language. The API may validly return an empty list. |
| 429 | Wait and reduce concurrency. |
| Timeout or 5xx | Check request history before retrying an uncertain paid search; give support the trace ID, never your key. |

The plugin sends the query, selected filters, and credential to api.acedata.cloud. Calls follow [current service pricing](https://platform.acedata.cloud/models). [Privacy](PRIVACY.md) · [Source and support](https://github.com/AceDataCloud/GoogleSearchFastGPT/issues).
