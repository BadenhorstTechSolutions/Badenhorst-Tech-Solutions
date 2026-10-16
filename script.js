// Set to true so public visitors see closed status by default
const FORCE_CLOSED_EARLY = false; 

// Secret Admin Access Trigger
let logoClicks = 0;
const logoEl = document.getElementById('adminTrigger');
if (logoEl) {
    logoEl.style.cursor = 'pointer';
    logoEl.addEventListener('click', () => {
        logoClicks++;
        if (logoClicks >= 5) {
            window.location.href = 'admin.html';
            logoClicks = 0;
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.href = 'admin.html';
    }
});

function verifyPin() {
    const pinInput = document.getElementById('adminPin');
    if (!pinInput) return; // Safely exit if not on admin page

    const pin = pinInput.value;
    if (pin === '4300') {
        document.getElementById('adminAuthStep').style.display = 'none';
        document.getElementById('adminControlsStep').style.display = 'block';
        
        let currentClosedState = FORCE_CLOSED_EARLY;
        const localState = localStorage.getItem('bts_closed_early');
        if (localState !== null) {
            currentClosedState = (localState === 'true');
        }
        document.getElementById('closeEarlyToggle').checked = currentClosedState;
    } else {
        document.getElementById('pinError').style.display = 'block';
    }
}

function toggleClosedEarly() {
    const toggle = document.getElementById('closeEarlyToggle');
    if (!toggle) return;
    
    const isChecked = toggle.checked;
    localStorage.setItem('bts_closed_early', isChecked);
    updateStatus();
}

function updateStatus() {
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();
    
    // Check if these elements exist on the current page before updating
    const statusElement = document.getElementById('shop-status');
    const bannerElement = document.getElementById('closedEarlyBanner');
    
    let isManuallyClosed = FORCE_CLOSED_EARLY;
    const savedClosedState = localStorage.getItem('bts_closed_early');
    if (savedClosedState !== null) {
        isManuallyClosed = (savedClosedState === 'true');
    }

    let isOpen = false;

    if (!isManuallyClosed) {
        if (day >= 1 && day <= 2) { if (hour >= 8 && hour < 21) isOpen = true; } // Mon-Tue
        else if (day === 3) { if (hour >= 8 && hour < 22) isOpen = true; }      // Wed
        else if (day === 4) { if (hour >= 8 && hour < 21) isOpen = true; }      // Thu
        else if (day >= 5 && day <= 6) { if (hour >= 8 && hour < 22) isOpen = true; } // Fri-Sat
    }

    if (statusElement) {
        if (isManuallyClosed) {
            statusElement.innerHTML = "○ Closed Early / Busy";
            statusElement.className = "status-badge closed";
        } else if (isOpen) {
            statusElement.innerHTML = "● Open Now";
            statusElement.className = "status-badge open";
        } else {
            statusElement.innerHTML = "○ Closed Now";
            statusElement.className = "status-badge closed";
        }
    }
    
    if (bannerElement) {
        bannerElement.style.display = isManuallyClosed ? 'block' : 'none';
    }
}

updateStatus();
setInterval(updateStatus, 60000);

// ===== Public Feedback =====
// Paste your Supabase details here (setup steps are in supabase-setup.sql).
// These two values are safe to be public. The database rules protect your data.
const SUPABASE_URL = 'sb_publishable_hhbeT3IwXclyUiiuHUtoMw_KWAMGxvw';  // e.g. https://abcdxyz.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxbGtjYmhsY21kamRleXluYmhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDMxNDgsImV4cCI6MjEwNzcxOTE0OH0.rbZqGwaY069EXEV8WQb7fA75O-FFiXD2dBxf-2cI6N8';  // the public "anon" or "publishable" key

// Only shown while Supabase is not set up yet.
const PUBLIC_FEEDBACK = [];

(function () {
    const base = SUPABASE_URL.replace(/\/+$/, '');
    const configured = Boolean(base && SUPABASE_KEY);
    const listEl = document.getElementById('feedbackList');

    function sbHeaders(extra) {
        const h = Object.assign({ apikey: SUPABASE_KEY }, extra);
        if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = 'Bearer ' + SUPABASE_KEY;
        return h;
    }

    function note(msg) {
        if (!listEl) return;
        listEl.textContent = '';
        const p = document.createElement('p');
        p.className = 'feedback-empty';
        p.textContent = msg;
        listEl.appendChild(p);
    }

    function render(items) {
        if (!listEl) return;
        if (!items.length) {
            note('No public feedback yet. Be the first to share your experience.');
            return;
        }
        listEl.textContent = '';
        items.forEach((f) => {
            const item = document.createElement('div');
            item.className = 'feedback-item';

            const stars = document.createElement('div');
            stars.className = 'fb-stars';
            const r = Math.max(1, Math.min(5, Number(f.rating) || 5));
            stars.textContent = '\u2605'.repeat(r) + '\u2606'.repeat(5 - r);
            stars.setAttribute('aria-label', r + ' out of 5 stars');

            const text = document.createElement('p');
            text.textContent = f.text;

            const meta = document.createElement('div');
            meta.className = 'fb-meta';
            meta.textContent = [f.name || 'Anonymous', f.date].filter(Boolean).join(' \u00b7 ');

            item.append(stars, text, meta);
            listEl.appendChild(item);
        });
    }

    async function loadFeedback() {
        if (!listEl) return;
        if (!configured) { render(PUBLIC_FEEDBACK); return; }
        note('Loading feedback...');
        try {
            const url = base + '/rest/v1/feedback?select=name,rating,message,created_at&approved=eq.true&order=created_at.desc&limit=50';
            const res = await fetch(url, { headers: sbHeaders() });
            if (!res.ok) throw new Error('Load failed');
            const rows = await res.json();
            render(rows.map((r) => ({
                name: r.name,
                rating: r.rating,
                text: r.message,
                date: new Date(r.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
            })));
        } catch (err) {
            note('Feedback could not be loaded right now.');
        }
    }

    loadFeedback();

    const fbForm = document.getElementById('feedbackForm');
    if (!fbForm) return;
    const fbBtn = document.getElementById('feedbackBtn');
    const fbMsg = document.getElementById('feedbackMsg');

    fbForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        fbBtn.disabled = true;
        fbMsg.className = '';
        fbMsg.textContent = 'Sending...';
        const fd = new FormData(fbForm);
        try {
            // 1) Always email the feedback to you through Formspree
            const res = await fetch(fbForm.action, {
                method: 'POST',
                body: fd,
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error('Request failed');

            // 2) If the visitor agreed to share it, save it as "pending" in Supabase
            let saved = false;
            if (configured && fd.get('share_publicly') === 'yes' && !fd.get('_gotcha')) {
                try {
                    const r = await fetch(base + '/rest/v1/feedback', {
                        method: 'POST',
                        headers: sbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
                        body: JSON.stringify({
                            name: String(fd.get('name') || '').trim() || null,
                            rating: Number(fd.get('rating')),
                            message: String(fd.get('feedback') || '').trim()
                        })
                    });
                    saved = r.ok;
                } catch (err) { /* the email already went through */ }
            }

            fbForm.reset();
            fbMsg.className = 'ok';
            fbMsg.textContent = saved
                ? 'Thank you! Your feedback was sent and will appear here once it has been approved.'
                : 'Thank you! Your feedback has been sent.';
        } catch (err) {
            fbMsg.className = 'err';
            fbMsg.textContent = 'Could not send your feedback. Please try again or message us on WhatsApp.';
        } finally {
            fbBtn.disabled = false;
        }
    });
})();
