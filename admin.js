// --- CONFIGURATION ---
const ADMIN_USER = "Ramunarlapati";
const ADMIN_PASS = "Ramu@Admin";

// --- GLOBAL CONFIGURATION (SUPABASE) ---
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_KEY = "your-anon-key";
let dbClient = null;

try {
    if (typeof supabase !== 'undefined' && SUPABASE_URL !== "https://your-project.supabase.co") {
        dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) { }

// --- DOM ELEMENTS ---
const loginOverlay = document.getElementById('login-overlay');
const adminContent = document.getElementById('admin-content');
const userInput = document.getElementById('admin-user');
const passInput = document.getElementById('admin-pass');
const loginBtn = document.getElementById('login-btn');
const errorMsg = document.getElementById('login-error');
const historyTableBody = document.getElementById('admin-history-list');
const downloadBtn = document.getElementById('download-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- LOGIN LOGIC ---
loginBtn.addEventListener('click', () => {
    if (userInput.value === ADMIN_USER && passInput.value === ADMIN_PASS) {
        sessionStorage.setItem('admin_auth', 'true');
        showAdminPanel();
    } else {
        errorMsg.style.display = 'block';
        setTimeout(() => { errorMsg.style.display = 'none'; }, 3000);
    }
});

function showAdminPanel() {
    loginOverlay.style.display = 'none';
    adminContent.style.display = 'block';
    loadHistory();
    // Refresh history every 10 seconds
    setInterval(loadHistory, 10000);
}

// --- HISTORY LOGIC ---
async function loadHistory() {
    // 1. Try to fetch from Supabase if configured
    if (dbClient) {
        const { data, error } = await dbClient
            .from('access_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            renderHistory(data);
            return;
        }
    }

    // 2. Fallback to session history (mock for local demonstration)
    const mockData = JSON.parse(localStorage.getItem('admin_mock_logs') || '[]');
    renderHistory(mockData.reverse());
}

function renderHistory(logs) {
    historyTableBody.innerHTML = '';
    logs.forEach(log => {
        const row = document.createElement('tr');
        row.className = 'history-row';
        row.innerHTML = `
            <td><span class="channel-badge">${log.channelId}</span></td>
            <td>${log.time}</td>
            <td>${log.ip}</td>
        `;
        historyTableBody.appendChild(row);
    });
}

function downloadHistory() {
    const rows = historyTableBody.querySelectorAll('.history-row');
    if (rows.length === 0) return alert("No history to download!");

    let content = "CHANNEL_ID | ACCESS_TIME | IP_ADDRESS\n";
    content += "-------------------------------------------\n";

    rows.forEach(row => {
        const id = row.querySelector('.channel-badge').textContent;
        const tds = row.querySelectorAll('td');
        content += `${id.padEnd(11)} | ${tds[1].textContent.padEnd(25)} | ${tds[2].textContent}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_access_report_${new Date().getTime()}.txt`;
    a.click();
}

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_auth');
    window.location.reload();
});

downloadBtn.addEventListener('click', downloadHistory);

// Check current session
if (sessionStorage.getItem('admin_auth') === 'true') {
    showAdminPanel();
}
