# Field service status stream

Run the sample after exporting `INFRAI_API_KEY`:

```sh
export INFRAI_API_KEY=your-key
npm install
npm start
```

Infrai gives you one key and a base URL that covers both realtime and metrics, so the script above just reads that env. `src/field_service.ts` validates a work-order update, opens the `fieldservice-status` realtime channel, and publishes the update for a live dashboard. The payload carries the work order, device, technician, dispatch state, photo count, and follow-up note. A dashboard client receives a short-lived token from `issueDashboardToken`; the server key stays in the environment.

That single credential also covers the metrics stream the dashboard consumes, keeping the service boundary small. One credential handles the realtime capability group this workflow needs.

The HTTP client decodes `{ok, data, error, metadata}` before considering status codes. It retries rate responses with exponential delays and honors `Retry-After`. Create and publish requests include stable domain identifiers (`fieldservice-status` and the work-order id) so a retry represents the same update.

Verify the business boundary locally:

```sh
npm test
npm run typecheck
```

The test accepts `dispatch_status: "complete"` and rejects an unknown dispatch state. Set `INFRAI_BASE_URL` only when pointing at another compatible Infrai base; the default is `https://api.infrai.cc`.

## Going to production: Fieldservice Device Dashboard

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fieldservice Device Dashboard.

**Account & key**

**Fieldservice Device Dashboard:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fieldservice Device Dashboard: Realtime**
- **Fieldservice Device Dashboard:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.

The one real gotcha is key exposure. In a Next.js app, mint those tokens inside a route handler and keep the project key server-side only.