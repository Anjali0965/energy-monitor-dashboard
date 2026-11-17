# Aether Energy Monitor

A dark, responsive dashboard for ESP32 live energy measurements using HiveMQ Cloud MQTT, a Node.js server and browser WebSocket feed.

## Displayed measurements
Voltage (V), current (A), power (W), total rotations, RPM, wind speed (m/s), PZEM status, last reading timestamp and a chart of recent readings.

## Deploy on Render
1. Create a **Web Service** or **Blueprint** connected to this private repository.
2. If creating a web service directly, choose Node runtime, build command `npm install`, start command `npm start`. The included `render.yaml` is configured for a paid Starter plan; verify prices before accepting.
3. Set server environment variables: `MQTT_HOST`, `MQTT_PORT=8883`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_TOPIC=esp32/energy`. Never commit live secrets to GitHub.
4. Deploy and open the HTTPS URL Render provides. The server listens on Render's `PORT` automatically.
5. Keep the ESP32 online and publishing JSON to `esp32/energy` on the same HiveMQ broker.

The server subscribes over encrypted MQTT and broadcasts readings over WebSockets. No broker password is sent to browsers. Data is held only in memory (up to 120 readings; resets on restart).

## Run locally
Node.js 20+ required. Run `npm install`, set environment variables in your shell, then run `npm start`. Open http://localhost:3000. Without MQTT credentials the dashboard can show explicitly labeled sample readings using **Try demo data**.

## Security
**Immediately change the Wi-Fi and HiveMQ passwords in the originally shared ESP32 sketch before production deployment.** That sketch also calls `setInsecure()`, which disables TLS server certificate verification: configure CA verification for production. A public deployment exposes dashboard readings to anyone with the URL; add authentication for confidential data. Calibrate the wind sensor's conversion factor for accurate readings.

## Incoming JSON example
```json
{"voltage":230.5,"current":0.37,"power":85.2,"rotation":125,"rpm":120.0,"wind_speed":3.4,"pzem_status":"CONNECTED"}
```
