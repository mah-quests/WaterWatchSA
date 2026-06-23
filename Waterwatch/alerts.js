/**
 * WaterWatch SA — Alerts & Notifications
 * Part 5: US-03 Alert dispatcher | US-10 Automated ETA escalation
 */

// ── State ────────────────────────────────────────────────────────────────────
let alerts       = [];
let nextId       = 1;
let activeFilter = 'all';

// Mock active outages with ETAs (used by the ETA escalation check — US-10)
const ACTIVE_OUTAGES = [
    { id: 101, location: 'Soweto, Johannesburg',   province: 'Gauteng',       households: 8900, eta: new Date(Date.now() - 2 * 3600000) },
    { id: 102, location: 'Umlazi, Durban',          province: 'KwaZulu-Natal', households: 5600, eta: new Date(Date.now() - 45 * 60000)  },
    { id: 103, location: 'Seshego, Polokwane',      province: 'Limpopo',       households: 4200, eta: new Date(Date.now() + 2 * 3600000) },
];

// Tracks which outage IDs have already been escalated to prevent re-triggering
const escalatedIds = new Set();

// ── Alert type config ─────────────────────────────────────────────────────────
const ALERT_CONFIG = {
    outage: {
        icon: '🔴',
        badge: 'Outage Alert',
        titles:   ['New Water Outage Detected', 'Water Supply Interrupted', 'Emergency Outage Reported'],
        locations:['Sandton, Johannesburg', 'Centurion, Pretoria', 'Kabokweni, Nelspruit', 'Mangaung, Bloemfontein'],
        messages: [
            'Water supply disrupted. Crews have been notified and are en route.',
            'Main pipe failure detected. Estimated repair: 6 hours.',
            'Pump station offline. Tankers deployed to critical areas.',
        ],
        households: [1200, 850, 3400, 650],
        channels:   ['push', 'sms', 'email'],
    },
    restoration: {
        icon: '🟢',
        badge: 'Water Restored',
        titles:   ['Water Supply Restored', 'Outage Resolved', 'Service Fully Restored'],
        locations:['Mitchells Plain, Cape Town', 'Khayelitsha, Cape Town', 'Motherwell, Gqeberha'],
        messages: [
            'Water supply fully restored. Thank you for your patience.',
            'Repair complete. Normal pressure restored to all areas.',
            'All households reconnected. Quality confirmed safe.',
        ],
        households: [3200, 1800, 2100],
        channels:   ['push', 'sms', 'email'],
    },
    quality: {
        icon: '🟣',
        badge: 'Quality Warning',
        titles:   ['Water Quality Alert', 'Do Not Drink Advisory', 'Discolouration Detected'],
        locations:['Mangaung, Bloemfontein', 'Orlando East, Soweto', 'Umlazi, Durban'],
        messages: [
            'Discolouration detected. Do NOT drink tap water until further notice.',
            'Pipe corrosion causing turbidity. Boil water before use.',
            'Bacterial readings above safe threshold. Health advisory issued.',
        ],
        households: [2700, 4500, 1100],
        channels:   ['push', 'sms', 'email'],
    },
    escalation: {
        icon: '🟠',
        badge: 'ETA Exceeded',
        titles:   ['Restoration Deadline Missed', 'Escalation: Overdue Outage', 'Urgent: ETA Exceeded'],
        locations:['Soweto, Johannesburg', 'Seshego, Polokwane', 'Umlazi, Durban'],
        messages: [
            'Restoration ETA has passed with no update. Escalated to senior management.',
            'Outage exceeds 12 hours. Emergency protocol activated.',
            'Municipal officer has not posted an update within SLA window.',
        ],
        households: [8900, 4200, 5600],
        channels:   ['push', 'email'],
    },
    municipal: {
        icon: '🔵',
        badge: 'Municipal Update',
        titles:   ['Outage Cause Confirmed', 'New ETA Issued', 'Municipal Announcement'],
        locations:['City of Johannesburg', 'City of Cape Town', 'eThekwini Municipality'],
        messages: [
            'Cause confirmed: aging main supply pipe. New ETA: 18:00 today.',
            'Planned maintenance extended by 2 hours due to equipment failure.',
            'Official statement: drought-level reserves require rotational cuts.',
        ],
        households: null,
        channels:   ['push', 'email'],
    },
};

// ── Channel helpers ───────────────────────────────────────────────────────────

function getActiveChannels() {
    const channels = [];
    if (document.getElementById('pref-push').checked)  channels.push('push');
    if (document.getElementById('pref-sms').checked)   channels.push('sms');
    if (document.getElementById('pref-email').checked) channels.push('email');
    return channels;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ── Dispatch: creates an alert and shows a toast ──────────────────────────────

function fireAlert(type, overrides) {
    const cfg      = ALERT_CONFIG[type];
    const userChan = getActiveChannels();
    const channels = (overrides && overrides.channels)
        ? overrides.channels.filter(c => userChan.includes(c))
        : cfg.channels.filter(c => userChan.includes(c));

    const alert = {
        id:         nextId++,
        type,
        icon:       cfg.icon,
        badge:      cfg.badge,
        title:      (overrides && overrides.title)      || pick(cfg.titles),
        location:   (overrides && overrides.location)   || pick(cfg.locations),
        message:    (overrides && overrides.message)    || pick(cfg.messages),
        households: (overrides && overrides.households != null)
            ? overrides.households
            : (cfg.households ? pick(cfg.households) : null),
        channels,
        timestamp:  new Date().toISOString(),
        read:       false,
    };

    alerts.unshift(alert);
    showToast(alert);
    renderAlerts();
    updateStats();
    updateBadge();
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(alert) {
    const container = document.getElementById('toast-container');
    const el        = document.createElement('div');
    el.className    = 'toast ' + alert.type;
    el.innerHTML =
        '<div class="toast-icon">' + alert.icon + '</div>' +
        '<div class="toast-body">' +
            '<div class="toast-title">'    + escHtml(alert.title) + '</div>' +
            '<div class="toast-msg">'      + escHtml(alert.location) + ' — ' + escHtml(alert.message.substring(0, 60)) + '…</div>' +
            '<div class="toast-channels">' + alert.channels.map(c => '<span class="ch-badge ' + c + '">' + c + '</span>').join('') + '</div>' +
        '</div>' +
        '<button class="toast-close" onclick="this.parentElement.remove()">×</button>';
    container.prepend(el);
    setTimeout(() => {
        el.style.animation = 'slideOut 0.35s ease forwards';
        setTimeout(() => el.remove(), 350);
    }, 5000);
}

// ── ETA Escalation Check — US-10 ──────────────────────────────────────────────
//
// TODO(human): Implement escalateOverdueAlerts().
//
// Loop through ACTIVE_OUTAGES. For each outage where:
//   - outage.eta is in the past  →  outage.eta < new Date()
//   - AND it hasn't been escalated yet  →  !escalatedIds.has(outage.id)
// Call fireAlert('escalation', { location, households, title, message })
// Then add the outage.id to escalatedIds so it won't fire again.
//
// Hint: use ACTIVE_OUTAGES.forEach(), compare dates with < new Date(),
// and use escalatedIds.has() / escalatedIds.add().
// ─────────────────────────────────────────────────────────────────────────────

function escalateOverdueAlerts() {
    // TODO(human): implement this function
}

function runEscalationCheck() {
    escalateOverdueAlerts();
    showToast({
        type:      'municipal',
        icon:      '⏱',
        title:     'ETA Check Complete',
        location:  'System',
        message:   'Escalation scan finished. See any new escalation alerts above.',
        channels:  [],
    });
}

// ── Filter & Render ───────────────────────────────────────────────────────────

function setFilter(f) {
    activeFilter = f;
    document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.filter === f);
    });
    renderAlerts();
}

function renderAlerts() {
    const list     = document.getElementById('alert-list');
    const filtered = activeFilter === 'all'
        ? alerts
        : alerts.filter(a => a.type === activeFilter);

    if (filtered.length === 0) {
        list.innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-icon">🔔</div>' +
            '<p>No alerts in this category yet.<br>Use the simulate bar below to trigger one.</p>' +
            '</div>';
        return;
    }

    list.innerHTML = filtered.map(a => {
        const hh = a.households
            ? '<span class="households-badge">🏠 ' + a.households.toLocaleString('en-ZA') + ' households</span>'
            : '';
        const chans = a.channels.map(c => '<span class="ch-badge ' + c + '">' + c + '</span>').join('');

        return (
            '<div class="alert-card ' + a.type + (a.read ? '' : ' unread') + '" onclick="markRead(' + a.id + ')">' +
                '<div class="alert-type-icon">' + a.icon + '</div>' +
                '<div class="alert-content">' +
                    '<div class="alert-top">' +
                        '<span class="alert-type-badge ' + a.type + '">' + escHtml(a.badge)  + '</span>' +
                        '<span class="alert-title">'                      + escHtml(a.title) + '</span>' +
                    '</div>' +
                    '<div class="alert-location">📍 ' + escHtml(a.location) + '</div>' +
                    '<div class="alert-msg">'          + escHtml(a.message)  + '</div>' +
                    '<div class="alert-meta">' +
                        '<span class="alert-time">🕐 ' + timeAgo(a.timestamp) + '</span>' +
                        hh +
                        '<div class="channels">' + chans + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }).join('');
}

function updateStats() {
    document.getElementById('stat-total')    .textContent = alerts.length;
    document.getElementById('stat-active')   .textContent = alerts.filter(a => a.type === 'outage').length;
    document.getElementById('stat-resolved') .textContent = alerts.filter(a => a.type === 'restoration').length;
    document.getElementById('stat-escalated').textContent = alerts.filter(a => a.type === 'escalation').length;

    ['all','outage','restoration','quality','escalation','municipal'].forEach(t => {
        const el = document.getElementById('cnt-' + t);
        if (!el) return;
        el.textContent = t === 'all' ? alerts.length : alerts.filter(a => a.type === t).length;
    });
}

function updateBadge() {
    const unread = alerts.filter(a => !a.read).length;
    const badge  = document.getElementById('unread-badge');
    badge.textContent    = unread;
    badge.style.display  = unread > 0 ? 'flex' : 'none';
}

function markRead(id) {
    const a = alerts.find(x => x.id === id);
    if (a) { a.read = true; renderAlerts(); updateBadge(); }
}

function markAllRead() {
    alerts.forEach(a => a.read = true);
    renderAlerts();
    updateBadge();
}

function toggleAllRead() {
    const anyUnread = alerts.some(a => !a.read);
    anyUnread ? markAllRead() : alerts.forEach(a => a.read = false);
    updateBadge();
    renderAlerts();
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function escHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}

function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const s    = Math.floor(diff / 1000);
    if (s < 60)  return s + 's ago';
    const m = Math.floor(s / 60);
    if (m < 60)  return m + 'm ago';
    const h = Math.floor(m / 60);
    return h + 'h ' + (m % 60) + 'm ago';
}

// ── Init — seed starting alerts on page load ──────────────────────────────────

(function init() {
    fireAlert('outage', {
        title:      'Water Outage: Sandton, Johannesburg',
        location:   'Sandton, Johannesburg',
        message:    'Main water supply pipe burst on William Nicol Drive. Repair crews dispatched.',
        households: 1200,
    });
    fireAlert('municipal', {
        title:      'Municipal Update: Soweto Outage',
        location:   'City of Johannesburg',
        message:    'Cause confirmed: aging infrastructure in Orlando East. New ETA: 20:00 tonight.',
        households: null,
    });
    fireAlert('quality', {
        title:      'Do Not Drink Advisory: Mangaung',
        location:   'Mangaung, Bloemfontein',
        message:    'Discolouration detected due to pipe corrosion. Boil water before use.',
        households: 2700,
    });
    fireAlert('restoration', {
        title:      'Water Restored: Mitchells Plain',
        location:   'Mitchells Plain, Cape Town',
        message:    'Scheduled maintenance complete. Water fully restored ahead of schedule.',
        households: 3200,
    });
    updateStats();
    updateBadge();
})();
