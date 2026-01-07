# Things Speak Dashboard

A beautiful, realtime dashboard to monitor your DHT11 (Temperature & Humidity) and MQ2 (Air Quality) sensors using ThingSpeak.

## Setup

1. **Open the Dashboard**:
   Since modern browsers restrict fetching data from local files (`file://`), you need to run a local server.
   
   You can use Python or Node.js:
   
   **Using Python:**
   ```bash
   python -m http.server
   ```
   Then open `http://localhost:8000`

   **Using Node.js:**
   ```bash
   npx http-server .
   ```
   Then open `http://127.0.0.1:8080`

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
