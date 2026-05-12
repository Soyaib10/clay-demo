// ===== Configuration =====
const API_BASE = window.location.origin;
const REFRESH_INTERVAL = 3000; // 3 seconds

// ===== State =====
let leads = [];
let autoRefreshInterval = null;
let lastLeadCount = 0;

// ===== DOM Elements =====
const totalLeadsEl = document.getElementById('total-leads');
const lastReceivedEl = document.getElementById('last-received');
const totalListsEl = document.getElementById('total-lists');
const leadsBody = document.getElementById('leads-body');
const emptyState = document.getElementById('empty-state');
const leadsTable = document.getElementById('leads-table');
const endpointUrlEl = document.getElementById('endpoint-url');
const toast = document.getElementById('toast');
const autoRefreshToggle = document.getElementById('auto-refresh');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    // Set endpoint URL
    endpointUrlEl.textContent = `${API_BASE}/api/leads`;

    // Load initial data
    fetchLeads();

    // Start auto-refresh
    startAutoRefresh();

    // Event listeners
    document.getElementById('refresh-btn').addEventListener('click', fetchLeads);
    document.getElementById('download-btn').addEventListener('click', downloadCSV);
    document.getElementById('test-btn').addEventListener('click', openModal);
    document.getElementById('clear-btn').addEventListener('click', clearLeads);
    autoRefreshToggle.addEventListener('change', toggleAutoRefresh);
});

// ===== API Functions =====
async function fetchLeads() {
    try {
        const response = await fetch(`${API_BASE}/api/leads`);
        const data = await response.json();

        if (data.success) {
            const newLeads = data.data.leads;
            const hasNewLeads = newLeads.length > lastLeadCount;

            leads = newLeads;
            lastLeadCount = leads.length;

            renderLeads(hasNewLeads);
            updateStats();

            if (hasNewLeads && leads.length > 0) {
                showToast(`${newLeads.length - lastLeadCount + leads.length} new lead(s) received!`, 'success');
            }
        }
    } catch (error) {
        console.error('Error fetching leads:', error);
        showToast('Failed to fetch leads', 'error');
    }
}

async function sendTestLead() {
    const lead = {
        list_name: document.getElementById('test-listname').value || 'demo-list',
        first_name: document.getElementById('test-firstname').value || 'John',
        last_name: document.getElementById('test-lastname').value || 'Doe',
        company: document.getElementById('test-company').value || 'Acme Inc',
        job_title: document.getElementById('test-jobtitle').value || 'CEO',
        location: document.getElementById('test-location').value || 'New York, USA',
        linkedin_url: document.getElementById('test-linkedin').value || 'https://linkedin.com/in/johndoe',
        connections: 500,
        headline: 'Building the future'
    };

    try {
        const response = await fetch(`${API_BASE}/api/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(lead)
        });

        const data = await response.json();

        if (data.success) {
            showToast('Test lead sent successfully!', 'success');
            closeModal();
            fetchLeads();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error sending test lead:', error);
        showToast('Failed to send test lead', 'error');
    }
}

async function clearLeads() {
    if (!confirm('Are you sure you want to clear all leads?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/leads`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('All leads cleared', 'info');
            fetchLeads();
        }
    } catch (error) {
        console.error('Error clearing leads:', error);
        showToast('Failed to clear leads', 'error');
    }
}

function downloadCSV() {
    if (leads.length === 0) {
        showToast('No leads to download', 'error');
        return;
    }

    window.location.href = `${API_BASE}/api/leads/csv`;
    showToast('CSV download started!', 'success');
}

// ===== Rendering =====
function renderLeads(highlightNew = false) {
    if (leads.length === 0) {
        leadsTable.style.display = 'none';
        emptyState.classList.add('active');
        return;
    }

    leadsTable.style.display = 'table';
    emptyState.classList.remove('active');

    leadsBody.innerHTML = leads.map((lead, index) => {
        const isNew = highlightNew && index === leads.length - 1;
        const rowClass = isNew ? 'new-lead' : '';

        return `
            <tr class="${rowClass}">
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(lead.first_name)} ${escapeHtml(lead.last_name)}</strong></td>
                <td>${escapeHtml(lead.company)}</td>
                <td>${escapeHtml(lead.job_title)}</td>
                <td>${escapeHtml(lead.location)}</td>
                <td>
                    ${lead.linkedin_url 
                        ? `<a href="${escapeHtml(lead.linkedin_url)}" target="_blank" class="linkedin-link">🔗 View</a>` 
                        : '-'
                    }
                </td>
                <td><span class="badge badge-list">${escapeHtml(lead.list_name || 'default')}</span></td>
                <td>${formatTime(lead.received_at)}</td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    totalLeadsEl.textContent = leads.length;

    if (leads.length > 0) {
        const lastLead = leads[leads.length - 1];
        lastReceivedEl.textContent = formatTime(lastLead.received_at);

        // Count unique lists
        const lists = new Set(leads.map(l => l.list_name).filter(Boolean));
        totalListsEl.textContent = lists.size;
    } else {
        lastReceivedEl.textContent = '-';
        totalListsEl.textContent = '0';
    }
}

// ===== Auto Refresh =====
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(fetchLeads, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

function toggleAutoRefresh() {
    if (autoRefreshToggle.checked) {
        startAutoRefresh();
        showToast('Auto-refresh enabled', 'info');
    } else {
        stopAutoRefresh();
        showToast('Auto-refresh disabled', 'info');
    }
}

// ===== Modal =====
function openModal() {
    document.getElementById('test-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('test-modal').classList.remove('active');
}

// Close modal on outside click
document.getElementById('test-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('test-modal')) {
        closeModal();
    }
});

// ===== Utilities =====
function copyEndpoint() {
    const url = endpointUrlEl.textContent;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Endpoint URL copied!', 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Endpoint URL copied!', 'success');
    });
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add badge style for list names
const style = document.createElement('style');
style.textContent = `
    .badge-list {
        background: #e0e7ff;
        color: #4338ca;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }
`;
document.head.appendChild(style);
