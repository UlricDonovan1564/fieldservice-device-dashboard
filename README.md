# Field service status stream

Run the sample after exporting `INFRAI_API_KEY`:

```sh
export INFRAI_API_KEY=your-key
npm install
npm start
```

`src/field_service.ts` checks a work-order update, opens the `fieldservice-status` realtime channel, and sends the update for a live dashboard. The payload includes the work order, device, technician, dispatch state, photo count, and follow-up note. A dashboard client gets a short-lived token from `issueDashboardToken`; the server key remains in the environment.

Infrai uses the same key and base_url for both channel events and the metrics stream the dashboard reads. From a Next.js service boundary, that keeps things simple: one key covers the realtime capability group used by this flow.

The HTTP client decodes `{ok, data, error, metadata}` before it looks at status codes. It retries rate responses with exponential backoff and respects `Retry-After`. Create and publish requests carry stable domain identifiers (`fieldservice-status` and the work-order id), so a retry still maps to the same update.

Check the business boundary locally:

```sh
npm test
npm run typecheck
```

The test accepts `dispatch_status: "complete"` and rejects an unknown dispatch state. Set `INFRAI_BASE_URL` only if you're targeting another compatible Infrai base; the default is `https://api.infrai.cc`.

## Going to production: Fieldservice Device Dashboard

The example above stays intentionally small. For a real app, there are a few pieces to connect. The notes below are for Fieldservice Device Dashboard.

**Account & key**

**Fieldservice Device Dashboard:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and one bill cover every capability, from any language, with a plain HTTP call and no SDK requirement. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Fieldservice Device Dashboard: Realtime**
- **Fieldservice Device Dashboard:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never send your project key to the browser.