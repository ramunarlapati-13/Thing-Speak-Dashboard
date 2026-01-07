# Things Speak Dashboard

A beautiful, realtime dashboard to monitor your DHT11 (Temperature & Humidity) and MQ2 (Air Quality) sensors using ThingSpeak.

## Setup

1. **Run with History Logging (Recommended)**:
   This enables "lively" monitoring of Channel IDs, access times, and IP addresses into `access_log.txt`.
   
   ```bash
   node server.js
   ```
   Then open `http://localhost:3000`

2. **Standard Local Server**:
   You can still use `python -m http.server` or `npx http-server .`, but access history logging will be disabled.


2. **Configure**:
   - Enter your **ThingSpeak Channel ID** in the configuration box.
   - The Read Key is already pre-configured (`ARCMQNXADI90592Y`).

3. **Monitor**:
   - The dashboard will update every 15 seconds.
   - Charts show historical trends.

## Features
- **Glassmorphism Design**: Modern, transparent UI.
- **Realtime Updates**: Auto-refresh without page reload.
- **Responsive**: Works on mobile and desktop.
- **Data Visualization**: Interactive charts using Chart.js.

## Customization
To change the API keys or default Channel ID, edit `script.js`:
```javascript
const READ_API_KEY = "YOUR_READ_KEY";
let channelId = "YOUR_CHANNEL_ID";
```
