const READ_API_KEY = "ARCMQNXADI90592Y";

// --- GLOBAL CONFIGURATION (SUPABASE) ---
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_KEY = "your-anon-key";
let dbClient = null;

try {
    // The library defines 'supabase' globally
    if (typeof supabase !== 'undefined' && SUPABASE_URL !== "https://your-project.supabase.co") {
        dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn("Cloud DB not initialized. Using local mock history.");
}

// DOM Elements
const channelInput = document.getElementById('channel-id');
const updateBtn = document.getElementById('update-btn');
const statusBadge = document.getElementById('connection-status');
const lastUpdateTime = document.getElementById('last-update-time');
const sensorContainer = document.getElementById('sensor-container');

// Icons Mapping
const icons = {
    temp: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 13V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V13C6.79 14.66 6.34 17.79 8 20C9.66 22.21 12.79 22.66 15 21C15.66 20.5 16.22 19.83 16.61 19.08C17.58 17.2 17.15 14.93 15.5 13.5L15 13ZM12 4C12.55 4 13 4.45 13 5V8H11V5C11 4.45 11.45 4 12 4Z" fill="currentColor"/></svg>`,
    hum: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C16.42 22 20 18.42 20 14C20 9.5 12 2 12 2C12 2 4 9.5 4 14C4 18.42 7.58 22 12 22ZM12 5.3C13.65 7.4 17.5 11.57 17.5 14C17.5 17.03 15.03 19.5 12 19.5C8.97 19.5 6.5 17.03 6.5 14C6.5 11.57 10.35 7.4 12 5.3Z" fill="currentColor"/></svg>`,
    gas: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 14C19.5 13.17 18.83 12.5 18 12.5C17.17 12.5 16.5 13.17 16.5 14C16.5 14.83 17.17 15.5 18 15.5C18.83 15.5 19.5 14.83 19.5 14ZM18 10.5C18.83 10.5 19.5 9.83 19.5 9C19.5 8.17 18.83 7.5 18 7.5C17.17 7.5 16.5 8.17 16.5 9C16.5 9.83 17.17 10.5 18 10.5ZM13 22C15.65 22 17.92 20.31 18.73 17.93C18.23 18.06 17.7 18.15 17.16 18.22C16.21 16.66 14.53 15.56 12.57 15.34C11.64 15.22 10.74 15.12 10 15L9.61 12.35L14 11V7H10L10.31 8.87C8.5 9.38 7.03 10.79 6.44 12.57C6.07 13.67 6.07 16.33 6.44 17.43C7.26 19.89 9.34 22 13 22Z" fill="currentColor"/></svg>`,
    generic: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 13V11H11V13H13ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/></svg>`
};

// State
let channelId = localStorage.getItem('thingspeak_channel_id') || '';
let charts = {};
let intervalId = null;
let activeFields = [];

async function logAccess(cid) {
    if (!cid) return;
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const accessData = {
            channelId: cid,
            time: new Date().toLocaleString(),
            ip: ipData.ip
        };

        // 1. Log to cloud database if available
        if (dbClient) {
            await dbClient.from('access_logs').insert([accessData]);
        }

        // 2. Also log to local server (if running)
        fetch('/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accessData)
        }).catch(() => { });

        // 3. Save to local mock logs for Admin Panel preview
        const mockLogs = JSON.parse(localStorage.getItem('admin_mock_logs') || '[]');
        mockLogs.push(accessData);
        if (mockLogs.length > 50) mockLogs.shift();
        localStorage.setItem('admin_mock_logs', JSON.stringify(mockLogs));

    } catch (err) {
        console.warn("Logging error:", err);
    }
}

// Chart Options
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index',
    },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#38bdf8',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
                title: (context) => {
                    const label = context[0].label;
                    return label.includes(', ') ? label.split(', ') : label;
                },
                label: (context) => {
                    const dataset = context.dataset;
                    const unit = dataset.unit || '';
                    return `Value: ${context.parsed.y} ${unit}`;
                }
            }
        }
    },
    scales: {
        x: { display: false },
        y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
        }
    },
    elements: {
        line: {
            tension: 0.4,
            borderWidth: 2
        },
        point: {
            radius: 0,
            hoverRadius: 6,
            hoverBackgroundColor: '#38bdf8'
        }
    }
};

function getFieldConfig(name) {
    const lower = name.toLowerCase();
    if (lower.includes('temp')) return { type: 'temp', unit: '°C', color: '#f87171', iconClass: 'temp-icon' };
    if (lower.includes('hum')) return { type: 'hum', unit: '%', color: '#38bdf8', iconClass: 'humidity-icon' };
    if (lower.includes('gas') || lower.includes('mq')) return { type: 'gas', unit: 'PPM', color: '#34d399', iconClass: 'gas-icon' };
    return { type: 'generic', unit: '', color: '#818cf8', iconClass: 'temp-icon' };
}

function createCard(fieldId, fieldName) {
    const config = getFieldConfig(fieldName);
    const card = document.createElement('div');
    card.className = `card glass-panel sensor-card`;
    card.id = `card-${fieldId}`;

    card.innerHTML = `
        <div class="card-header">
            <div class="icon-box ${config.iconClass}">${icons[config.type]}</div>
            <h2 id="title-${fieldId}">${fieldName}</h2>
        </div>
        <div class="card-body">
            <div class="metric-value">
                <span id="value-${fieldId}">--</span><span class="unit">${config.unit}</span>
            </div>
        </div>
        <div class="card-chart">
            <canvas id="chart-${fieldId}"></canvas>
        </div>
    `;
    return card;
}

async function initDashboard() {
    if (!channelId) {
        sensorContainer.innerHTML = `
            <div class="loader-container">
                <p>Welcome! Please enter your ThingSpeak Channel ID above to start monitoring.</p>
            </div>
        `;
        statusBadge.textContent = 'Awaiting Channel ID';
        statusBadge.className = 'status-badge connecting';
        return;
    }

    statusBadge.textContent = 'Initializing...';

    try {
        const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${READ_API_KEY}&results=1`);
        const data = await response.json();
        const channel = data.channel;

        // Find all active fields
        activeFields = [];
        for (let i = 1; i <= 8; i++) {
            if (channel[`field${i}`] && !channel[`field${i}`].toLowerCase().includes('relay')) {
                activeFields.push({ id: `field${i}`, name: channel[`field${i}`] });
            }
        }

        // Log this access history
        logAccess(channelId);

        renderCards();
        fetchData();

        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(fetchData, 15000);

    } catch (error) {
        console.error("Init Error:", error);
        statusBadge.textContent = 'Error';
    }
}

function renderCards() {
    sensorContainer.innerHTML = '';
    charts = {};

    activeFields.forEach(field => {
        const card = createCard(field.id, field.name);
        sensorContainer.appendChild(card);

        const ctx = document.getElementById(`chart-${field.id}`).getContext('2d');
        const config = getFieldConfig(field.name);

        charts[field.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: field.name,
                    borderColor: config.color,
                    backgroundColor: config.color + '1A',
                    fill: true,
                    data: [],
                    unit: config.unit
                }]
            },
            options: commonChartOptions
        });
    });
}

async function fetchData() {
    try {
        const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${READ_API_KEY}&results=20`);
        const data = await response.json();
        const feeds = data.feeds;
        const lastFeed = feeds[feeds.length - 1];

        activeFields.forEach(field => {
            const value = lastFeed[field.id];
            const displayValue = value ? parseFloat(value).toFixed(1) : '--';
            document.getElementById(`value-${field.id}`).textContent = displayValue;

            // Update Chart
            const labels = feeds.map(f => new Date(f.created_at).toLocaleString());
            const fieldData = feeds.map(f => parseFloat(f[field.id]));

            const chart = charts[field.id];
            chart.data.labels = labels;
            chart.data.datasets[0].data = fieldData;
            chart.update('none');
        });

        lastUpdateTime.textContent = new Date(lastFeed.created_at).toLocaleTimeString();
        statusBadge.textContent = 'Live';
        statusBadge.className = 'status-badge connected';

    } catch (error) {
        console.error("Fetch Error:", error);
        statusBadge.textContent = 'Disconnected';
    }
}

updateBtn.addEventListener('click', () => {
    const newId = channelInput.value.trim();
    if (newId) {
        channelId = newId;
        localStorage.setItem('thingspeak_channel_id', channelId);
        initDashboard();
    }
});

// Start
channelInput.value = channelId;
if (!channelId) {
    channelInput.focus();
}
initDashboard();
