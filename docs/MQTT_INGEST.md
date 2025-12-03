# MQTT Ingest Endpoints

This short guide documents the two ingest endpoints and recommended usage for forwarding MQTT messages into the database.

## Endpoints

- `/api/mqtt/ingest` (server-to-server, HMAC-only)
  - Intended for trusted server processes (MQTT subscribers, bridge services).
  - Requires an HMAC header `x-ingest-signature` with value `sha256=<hex>` where `<hex>` is the
    hex HMAC-SHA256 of the raw request body computed using the secret in `MQTT_INGEST_SECRET`.
  - Example signing (Node.js):

    ```js
    const crypto = require('crypto')
    const body = JSON.stringify({ topic: 'iot/temp/living-room', payload: { value: 23 } })
    const secret = process.env.MQTT_INGEST_SECRET
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const signature = `sha256=${hmac.digest('hex')}`
    // send header 'x-ingest-signature': signature
    ```

- `/api/mqtt/ingest/proxy` (browser clients, session-authenticated)
  - Intended for browser clients that are authenticated via Supabase session cookies.
  - The proxy verifies the user's session server-side and performs the insert using the admin client.
  - Use this from client code (the app already calls it from `lib/mqtt/mqtt-hooks.ts`).

## Recommendations

- Keep `MQTT_INGEST_SECRET` private and set it in your deployment secrets (do NOT include it in browser code).
- Use `/api/mqtt/ingest` for server-side subscribers and bridges (sign requests with the HMAC).
- Use `/api/mqtt/ingest/proxy` from browser code only when the user is logged in.
- For production, run the server subscriber as a managed process (`pm2`, `systemd`, or cloud run) and restrict which hosts may call the signed endpoint via IP allowlist or an API gateway if necessary.

## Quick examples

- Publisher test script that uses HTTP ingest (already available): `scripts/mqtt_publish_device_test.cjs` supports `USE_INGEST_HTTP=1`.
- Server subscriber script that forwards with HMAC signing: `scripts/mqtt_server_subscriber.cjs`.

