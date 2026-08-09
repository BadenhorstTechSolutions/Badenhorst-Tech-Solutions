// Set to true so public visitors see closed status by default
const FORCE_CLOSED_EARLY = true; 

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