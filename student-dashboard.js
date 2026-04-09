/* ============================================================
   EduPortal — Student Dashboard JS
   ============================================================ */

// ── Session Guard ──────────────────────────────────────────────
const currentUserRole = sessionStorage.getItem('eduportal_role');

if (sessionStorage.getItem('eduportal_loggedIn') !== 'true' || currentUserRole !== 'student') {
    window.location.href = 'index.html';
}

// ── Data ─────────────────────────────────────────────────────
const defaultName = localStorage.getItem('eduportal_name') || 'New User';
const defaultEmail = localStorage.getItem('eduportal_email') || 'user@eduportal.com';
const defaultAvatar = localStorage.getItem('eduportal_avatar') || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

const defaultProfile = {
    name: defaultName,
    email: defaultEmail,
    phone: '',
    track: 'Technical',
    subtrack: '',
    level: 'Beginner',
    goal: 'Kickstart my career journey',
    goalPercent: 0,
    goals: '',
    avatar: defaultAvatar
};

const savedProfile = JSON.parse(localStorage.getItem('eduportal_studentProfile') || '{}');
const studentProfile = {
    ...defaultProfile,
    ...savedProfile,
    subtrack: savedProfile.role || defaultProfile.subtrack,
    track: savedProfile.track ? capitalize(savedProfile.track) : defaultProfile.track
};

const notifications = [
    { text: '<strong>Welcome to EduPortal!</strong> Your new mentorship journey begins today.', color: 'blue', time: 'Just now' }
];

let allMentors = [];
let userTrack = localStorage.getItem('eduportal_track') || studentProfile.track || 'Technical';
let currentUserEmail = sessionStorage.getItem('eduportal_email');
let currentUserId = sessionStorage.getItem('eduportal_uid');

// Track all requests locally for UI state
let sessionRequests = [];
let recommendedMentors = [];
let schedule = [];
let resources = [];
let activeSection = 'home';

function loadData() {
    if (window.eduDB) {
        // Real-time listener for mentors (demo + real)
        window.eduDB.onSnapshot('mentors', (data) => {
            allMentors = data;
            const searchTerm = document.getElementById('mentor-search-input')?.value.toLowerCase() || "";
            const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || "all";
            filterMentors(searchTerm, activeFilter);
            if (activeSection === 'discover') renderDiscoverSection();
        });

        // Real-time listener for requests
        window.eduDB.onSnapshot('sessionRequests', (data) => {
            sessionRequests = data.filter(r => r.studentId === currentUserId);
            
            // Populate schedule from scheduled requests
            schedule = sessionRequests.filter(r => r.status === 'scheduled').map(r => {
                const d = new Date(r.meetingDate);
                const day = d.getDate().toString().padStart(2, '0');
                const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
                const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return {
                    id: r.id,
                    day: day,
                    month: month,
                    topic: r.meetingTopic || 'Mentorship Session',
                    time: time,
                    mentor: r.mentorName,
                    link: r.meetingLink
                };
            });
            
            updateApplicationBadges();
            updateRecommendedMentors();
            if (activeSection === 'applications') renderApplications();
            if (activeSection === 'workspace' || activeSection === 'home') renderSchedule();
            
            // Re-render discovery to update button states (Send -> Request Sent)
            if (activeSection === 'discover') renderDiscoverSection();
        });
    }
}

function updateRecommendedMentors() {
    if (!allMentors || allMentors.length === 0) return;

    recommendedMentors = allMentors.filter(m => {
        // Technical track matching
        if (studentProfile.track === 'Technical' && m.track === 'Technical') {
            const studentRole = (studentProfile.role || studentProfile.subtrack || '').toLowerCase();
            const mentorRole = (m.role || m.spec || '').toLowerCase();
            const roleMatch = mentorRole.includes(studentRole) || studentRole.includes(mentorRole);
            
            const studentSkills = studentProfile.skills || [];
            const mentorSkills = m.skills || [];
            const skillMatch = studentSkills.some(s => mentorSkills.includes(s));
            
            return roleMatch || skillMatch;
        } 
        // Non-Technical track matching
        if (studentProfile.track === 'Non-Technical' && m.track === 'Non-Technical') {
            const studentDomain = (studentProfile.domain || studentProfile.subtrack || '').toLowerCase();
            const mentorDomain = (m.domain || m.spec || '').toLowerCase();
            return studentDomain === mentorDomain || mentorDomain.includes(studentDomain);
        }
        return false;
    });

    // Limit to top 3 recommendations
    recommendedMentors = recommendedMentors.slice(0, 3);
}

function updateApplicationBadges() {
    const pendingCount = sessionRequests.filter(r => r.status === 'pending').length;
    const navBadge = document.getElementById('nav-badge-applications');
    if (navBadge) {
        navBadge.textContent = pendingCount > 0 ? pendingCount : '';
        navBadge.style.display = pendingCount > 0 ? 'flex' : 'none';
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});


// ── Dashboard Hydration ──────────────────────────────────────
function hydrateDashboard() {
    // Topbar Profile
    const topName = document.getElementById('topbar-name');
    if (topName) topName.textContent = studentProfile.name || 'Complete your profile';
    
    const topAvatar = document.querySelector('.topbar-avatar img');
    if (topAvatar && studentProfile.avatar) topAvatar.src = studentProfile.avatar;

    const mainAvatar = document.querySelector('.profile-avatar img');
    if (mainAvatar && studentProfile.avatar) mainAvatar.src = studentProfile.avatar;

    // Greeting
    const greetName = document.getElementById('greeting-name');
    if (greetName) greetName.textContent = (studentProfile.name || 'Student').split(' ')[0];

    // Profile View Fields
    const displayFields = {
        'profile-display-name': studentProfile.name,
        'pv-name': studentProfile.name,
        'pv-email': studentProfile.email,
        'pv-phone': studentProfile.phone || 'Not provided',
        'pv-track': studentProfile.track,
        'pv-subtrack': studentProfile.subtrack || 'Not specified',
        'pv-level': studentProfile.level,
        'pv-goals': studentProfile.goals || 'No goals set yet.'
    };

    Object.keys(displayFields).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = displayFields[id];
    });

    const trackDisplay = document.getElementById('profile-display-track');
    if (trackDisplay) trackDisplay.textContent = `${studentProfile.track} — ${studentProfile.subtrack || 'Learner'}`;

    // Pre-fill Edit Form
    document.getElementById('edit-fullname').value = studentProfile.name;
    document.getElementById('edit-email').value = studentProfile.email;
    document.getElementById('edit-phone').value = studentProfile.phone || '';
    document.getElementById('edit-track').value = (studentProfile.track || 'Technical').toLowerCase();
    document.getElementById('edit-subtrack').value = studentProfile.subtrack || '';
    document.getElementById('edit-skill-level').value = studentProfile.level || 'Beginner';
    document.getElementById('edit-goals').value = studentProfile.goals || '';
    
    // Progress Setup
    const progressGoal = document.getElementById('progress-goal');
    const progressPercent = document.getElementById('progress-percent');
    
    if (progressGoal) progressGoal.textContent = studentProfile.goal || 'Not started';
    if (progressPercent) progressPercent.textContent = (studentProfile.goalPercent || 0) + '%';
    
    const qsProgress = document.getElementById('qs-progress');
    if (qsProgress) qsProgress.textContent = (studentProfile.goalPercent || 0) + '%';
    
    // Mentor Empty State Check
    const activeMentor = studentProfile.activeMentorId 
        ? allMentors.find(m => m.id === studentProfile.activeMentorId) 
        : null;

    if (!activeMentor) {
        const qsMentor = document.getElementById('qs-mentor');
        if (qsMentor) qsMentor.textContent = 'None';
        
        const wsSection = document.getElementById('sec-workspace');
        if (wsSection) {
            wsSection.innerHTML = `
                <div class="empty-state" style="text-align:center; padding: 4rem 1rem; color: var(--on-surface-variant);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem; opacity:0.5;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 style="color: var(--on-surface); font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">You have no mentor yet</h3>
                    <p>Find a mentor to get started.</p>
                </div>
            `;
        }
    }
}

// ── Section & Navigation ─────────────────────────────────────
const sectionTitles = {
    home: { title: 'Home', sub: 'Welcome back to your dashboard' },
    discover: { title: 'Find a Mentor', sub: 'Discover mentors matched to your learning track' },
    applications: { title: 'My Applications', sub: 'Track the status of your session requests' },
    workspace: { title: 'Active Mentorship', sub: 'Your current mentorship workspace' },
    resources: { title: 'Resources', sub: 'Files and links shared by your mentors' },
    profile: { title: 'Profile', sub: 'Manage your personal information' }
};

function switchSection(section) {
    // Nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (navItem) navItem.classList.add('active');

    // Sections
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(`sec-${section}`);
    if (sec) {
        sec.classList.add('active');
        // Re-trigger animation
        sec.style.animation = 'none';
        sec.offsetHeight; // force reflow
        sec.style.animation = '';
    }

    // Top bar
    const info = sectionTitles[section] || {};
    const topTitle = document.getElementById('topbar-title');
    const topSub = document.getElementById('topbar-sub');
    const mobTitle = document.getElementById('mobile-title');
    if (topTitle) topTitle.textContent = info.title || section;
    if (topSub) topSub.textContent = info.sub || '';
    if (mobTitle) mobTitle.textContent = info.title || section;

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('hamburger')?.classList.remove('open');

    // Section specific init
    activeSection = section;
    if (section === 'discover') renderDiscoverSection();
    if (section === 'applications') renderApplications();
    if (section === 'resources') renderResources();
    if (section === 'workspace') renderSchedule();
}

// Nav click handlers
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

// Mobile hamburger
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    hamburger.classList.toggle('open');
});

// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
        hamburger.classList.remove('open');
    }
});

// ── Render Functions ─────────────────────────────────────────

// Notifications
function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    list.innerHTML = notifications.map(n => `
        <div class="notif-item">
            <span class="notif-dot ${n.color}"></span>
            <div class="notif-content">
                <p class="notif-text">${n.text}</p>
                <span class="notif-time">${n.time}</span>
            </div>
        </div>
    `).join('');
}

// Progress ring
function renderProgressRing() {
    const circle = document.getElementById('progress-circle');
    if (!circle) return;
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (studentProfile.goalPercent / 100) * circumference;

    // Add SVG gradient defs
    const svg = circle.closest('svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6dddff"/>
            <stop offset="100%" stop-color="#ac8aff"/>
        </linearGradient>
    `;
    svg.prepend(defs);
    circle.setAttribute('stroke', 'url(#progress-grad)');

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    // Animate on load
    setTimeout(() => {
        circle.style.strokeDashoffset = offset;
    }, 300);
}

// Mentor cards
function renderMentorCards(mentors, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = mentors.map(m => {
        // MATCHING LOGIC
        // Technical: Match by role contains role OR skills overlap
        // Non-Technical: Match by domain
        let isMatch = false;
        if (studentProfile.track === 'Technical' && m.track === 'Technical') {
            const studentRole = studentProfile.role?.toLowerCase() || '';
            const mentorRole = (m.role || m.spec || '').toLowerCase();
            const roleMatch = mentorRole.includes(studentRole) || studentRole.includes(mentorRole);
            const studentSkills = studentProfile.skills || [];
            const mentorSkills = m.skills || [];
            const skillMatch = studentSkills.some(s => mentorSkills.includes(s));
            isMatch = roleMatch || skillMatch;
        } else if (studentProfile.track === 'Non-Technical' && m.track === 'Non-Technical') {
            const studentDomain = studentProfile.role?.toLowerCase() || ''; // role is domain in non-tech
            const mentorDomain = (m.domain || m.spec || '').toLowerCase();
            isMatch = studentDomain === mentorDomain;
        }

        const isHidden = containerId === 'mentor-grid-all' && !isMatch;
        
        // Check if request already sent
        const existingReq = sessionRequests.find(r => r.mentorId === (m.uid || m.id));
        const btnText = existingReq ? (existingReq.status === 'pending' ? 'Request Sent' : existingReq.status.toUpperCase()) : 'Send Session Request';
        const btnDisabled = existingReq ? 'disabled' : '';

        return `
        <div class="mentor-card" data-filter="${m.filter || (m.track === 'Technical' ? 'technical' : 'non-technical')}" data-track="${m.track || 'Technical'}" style="${isHidden ? 'display:none;' : ''}">
            <div class="mentor-card-top">
                <img src="${m.profilePhoto || m.avatar}" alt="${m.name}" class="mentor-avatar">
                <div>
                    <h4 class="mentor-name">${m.name}</h4>
                    <p class="mentor-spec">${m.spec}</p>
                </div>
            </div>
            <div class="mentor-skills">
                ${m.skills ? m.skills.map(s => `<span class="skill-tag">${s}</span>`).join('') : ''}
            </div>
            <div class="mentor-card-actions">
                <button class="btn-secondary-sm" onclick="openMentorModal(${m.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    View Profile
                </button>
                <button class="btn-primary-sm" onclick="sendSessionRequest('${m.uid || m.id}', '${m.name}', '${m.avatar}')" ${btnDisabled}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    ${btnText}
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function renderDiscoverSection() {
    renderMentorCards(recommendedMentors, 'mentor-grid');
    renderMentorCards(allMentors, 'mentor-grid-all');
}

// Applications table (Legacy or Generic) - Redirecting to the main list
function renderApplications() {
    renderApplicationsList();
}

// Schedule
function renderSchedule() {
    const list = document.getElementById('schedule-list');
    if (!list) return;

    if (schedule.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--on-surface-variant);">
                <p>No upcoming sessions scheduled.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = schedule.map(s => `
        <div class="schedule-item">
            <div class="schedule-date">
                <span class="schedule-day">${s.day}</span>
                <span class="schedule-month">${s.month}</span>
            </div>
            <div class="schedule-sep"></div>
            <div class="schedule-info">
                <h4 class="schedule-topic">${s.topic}</h4>
                <p class="schedule-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${s.time}
                </p>
                <p class="schedule-mentor">with ${s.mentor}</p>
            </div>
            <button class="join-btn" onclick="window.open('${s.link}', '_blank')">Join</button>
        </div>
    `).join('');
}

// Resources
function renderResources(filter = 'all') {
    const grid = document.getElementById('resource-grid');
    if (!grid) return;

    const filtered = filter === 'all' ? resources : resources.filter(r => r.type === filter);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--on-surface-variant); grid-column: 1 / -1;">
                <p>No resources available.</p>
            </div>
        `;
        return;
    }

    const typeIcons = {
        pdf: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        link: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        file: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`
    };

    const actionLabels = { pdf: 'Download', link: 'Open Link', file: 'Download' };

    grid.innerHTML = filtered.map(r => `
        <div class="resource-card" data-type="${r.type}">
            <div class="resource-card-top">
                <div class="resource-icon ${r.type}">
                    ${typeIcons[r.type]}
                </div>
                <div>
                    <h4 class="resource-title">${r.title}</h4>
                    <p class="resource-meta">${r.type.toUpperCase()} • ${r.date}</p>
                </div>
            </div>
            <p class="resource-shared">Shared by <strong>${r.sharedBy}</strong></p>
            <button class="resource-action" onclick="showToast('Opening resource...', '${r.title}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                ${actionLabels[r.type]}
            </button>
        </div>
    `).join('');
}

// ── Mentor Modal ─────────────────────────────────────────────
function openMentorModal(mentorId) {
    const mentor = allMentors.find(m => m.id === mentorId);
    if (!mentor) return;

    const modal = document.getElementById('mentor-modal');
    const body = document.getElementById('mentor-modal-body');

    body.innerHTML = `
        <div class="modal-mentor-top">
            <img src="${mentor.avatar}" alt="${mentor.name}" class="modal-mentor-avatar">
            <h3 class="modal-mentor-name">${mentor.name}</h3>
            <p class="modal-mentor-spec">${mentor.spec}</p>
        </div>
        <p class="modal-mentor-bio">${mentor.bio}</p>
        <div class="modal-skills-wrap">
            <p class="modal-skills-title">Skills & Expertise</p>
            <div class="modal-skills">
                ${mentor.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
        </div>
        <div class="modal-action">
            ${(() => {
                const existingReq = sessionRequests.find(r => r.mentorId === (mentor.uid || mentor.id));
                if (existingReq) {
                    return `<button class="btn-primary" disabled style="opacity: 0.7; cursor: not-allowed;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                Request ${existingReq.status.charAt(0).toUpperCase() + existingReq.status.slice(1)}
                            </button>`;
                }
                return `<button class="btn-primary" onclick="sendSessionRequest('${mentor.uid || mentor.id}', '${mentor.name}', '${mentor.profilePhoto || mentor.avatar}'); closeMentorModal();">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            Send Session Request
                        </button>`;
            })()}
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeMentorModal() {
    document.getElementById('mentor-modal')?.classList.add('hidden');
}

document.getElementById('modal-close-btn')?.addEventListener('click', closeMentorModal);
document.getElementById('mentor-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeMentorModal();
});

// ── Send Request Logic ───────────────────────────────────────
function sendSessionRequest(mentorId, mentorName, mentorPhoto) {
    if (!window.eduDB) return;

    const request = {
        studentId: currentUserId,
        studentName: studentProfile.name,
        studentEmail: studentProfile.email,
        studentPhoto: studentProfile.photo,
        mentorId: mentorId,
        mentorName: mentorName,
        mentorPhoto: mentorPhoto,
        track: studentProfile.track,
        role: studentProfile.role,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    window.eduDB.addDoc('sessionRequests', request);
    showToast('Request Sent!', `Your session request was sent to ${mentorName}`);
}

function renderApplicationsList() {
    // This handles both the table view (desktop) and list view (mobile/cards)
    
    const tbody = document.getElementById('app-table-body');
    if (tbody) {
        tbody.innerHTML = sessionRequests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(r => `
            <tr>
                <td>
                    <div class="mentor-cell">
                        <img src="${r.mentorPhoto}" alt="${r.mentorName}" class="avatar-img-sm">
                        <span class="mentor-cell-name">${r.mentorName}</span>
                    </div>
                </td>
                <td>${r.track} • ${r.role}</td>
                <td>${new Date(r.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge status-${r.status}">${r.status.toUpperCase()}</span></td>
            </tr>
        `).join('');
    }

    const list = document.getElementById('applications-list');
    if (!list) return;

    if (sessionRequests.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--on-surface-variant);">
                <p>You haven't sent any session requests yet.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = sessionRequests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(r => `
        <div class="application-card">
            <div class="app-mentor">
                <img src="${r.mentorPhoto}" alt="${r.mentorName}" class="app-avatar">
                <div class="app-info">
                    <h4>${r.mentorName}</h4>
                    <p>${r.track} • ${r.role}</p>
                </div>
            </div>
            <div class="app-status">
                <span class="status-badge status-${r.status}">${r.status.toUpperCase()}</span>
                <span class="app-date">${new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

// ── Toast ────────────────────────────────────────────────────
function showToast(title, msg) {
    const toast = document.getElementById('toast');
    const tTitle = document.getElementById('toast-title');
    const tMsg = document.getElementById('toast-msg');
    if (!toast) return;

    tTitle.textContent = title;
    tMsg.textContent = msg;
    toast.classList.add('show');

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Profile ──────────────────────────────────────────────────
const editBtn = document.getElementById('profile-edit-btn');
const cancelBtn = document.getElementById('profile-cancel-btn');
const profileView = document.getElementById('profile-view');
const profileEdit = document.getElementById('profile-edit');
const profileForm = document.getElementById('profile-form');

editBtn?.addEventListener('click', () => {
    profileView?.classList.add('hidden');
    profileEdit?.classList.remove('hidden');
});

cancelBtn?.addEventListener('click', () => {
    profileEdit?.classList.add('hidden');
    profileView?.classList.remove('hidden');
});

profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Update display values
    const fields = [
        { id: 'edit-fullname', target: 'pv-name', also: 'profile-display-name' },
        { id: 'edit-email', target: 'pv-email' },
        { id: 'edit-phone', target: 'pv-phone' },
        { id: 'edit-track', target: 'pv-track' },
        { id: 'edit-subtrack', target: 'pv-subtrack' },
        { id: 'edit-skill-level', target: 'pv-level' },
        { id: 'edit-goals', target: 'pv-goals' }
    ];

    fields.forEach(f => {
        const input = document.getElementById(f.id);
        const display = document.getElementById(f.target);
        if (input && display) display.textContent = input.value;
        if (f.also) {
            const alsoEl = document.getElementById(f.also);
            if (alsoEl) alsoEl.textContent = input.value;
        }
    });

    // Update track display
    const track = document.getElementById('edit-track')?.value || '';
    const subtrack = document.getElementById('edit-subtrack')?.value || '';
    const trackDisplay = document.getElementById('profile-display-track');
    if (trackDisplay) trackDisplay.textContent = `${track} — ${subtrack}`;

    // Update topbar name and global state
    const nameInput = document.getElementById('edit-fullname');
    const newName = nameInput?.value || studentProfile.name;
    
    const topName = document.getElementById('topbar-name');
    if (topName) topName.textContent = newName;
    
    const greetName = document.getElementById('greeting-name');
    if (greetName) greetName.textContent = newName.split(' ')[0];

    // Save to localStorage
    const updatedProfile = {
        ...studentProfile,
        name: newName,
        email: document.getElementById('edit-email').value,
        phone: document.getElementById('edit-phone').value,
        track: track,
        subtrack: subtrack,
        level: document.getElementById('edit-skill-level').value,
        goals: document.getElementById('edit-goals').value
    };
    
    localStorage.setItem('eduportal_studentProfile', JSON.stringify(updatedProfile));
    localStorage.setItem('eduportal_name', newName);

    profileEdit?.classList.add('hidden');
    profileView?.classList.remove('hidden');

    showToast('Profile Updated!', 'Your changes have been saved successfully.');
});

// ── Deletion Protection (Requirement) ────────────────────────
function deleteMentorFromSystem(mentorId) {
    const mentor = allMentors.find(m => m.id === mentorId);
    if (mentor && mentor.isDemo) {
        console.warn("Deletion blocked: Cannot delete a permanent demo mentor.");
        return; // Block deletion silently as per requirement
    }
    // Actual deletion logic would go here if implemented
}

// ── Filter Logic ─────────────────────────────────────────────

// Mentor search & filter
const searchInput = document.getElementById('mentor-search');
searchInput?.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    filterMentors(query, getCurrentFilter());
});

function getCurrentFilter() {
    const active = document.querySelector('.filter-chip[data-filter].active');
    return active ? active.dataset.filter : 'all';
}

document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const query = searchInput?.value?.toLowerCase() || '';
        filterMentors(query, chip.dataset.filter);
    });
});

function filterMentors(query, filter) {
    const cards = document.querySelectorAll('#mentor-grid-all .mentor-card');
    cards.forEach(card => {
        const matchesFilter = filter === 'all' || card.dataset.filter === filter;
        const text = card.textContent.toLowerCase();
        const matchesSearch = !query || text.includes(query);
        card.style.display = matchesFilter && matchesSearch ? '' : 'none';
    });
}

// Resource filter
document.querySelectorAll('.filter-chip[data-rfilter]').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-rfilter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderResources(chip.dataset.rfilter);
    });
});

// ── View Full Profile Button ─────────────────────────────────
document.getElementById('ws-view-profile')?.addEventListener('click', () => {
    if (studentProfile.activeMentorId) {
        openMentorModal(studentProfile.activeMentorId); 
    }
});

// ── Dynamic Greeting ─────────────────────────────────────────
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    const texts = [
        `Ready to level up your Java skills, ${studentProfile.name.split(' ')[0]}!`,
        `Let's build something amazing today, ${studentProfile.name.split(' ')[0]}!`,
        `${greeting}, ${studentProfile.name.split(' ')[0]}! Ready to learn?`,
        `Keep pushing forward, ${studentProfile.name.split(' ')[0]}! 🎯`,
    ];

    const greetingText = document.getElementById('greeting-text');
    if (greetingText) {
        greetingText.textContent = texts[Math.floor(Math.random() * texts.length)];
    }
}

// ── Capitalize Helper ────────────────────────────────────────
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Init ─────────────────────────────────────────────────────
function init() {
    hydrateDashboard();
    updateGreeting();
    renderNotifications();
    renderProgressRing();
    renderMentorCards(recommendedMentors, 'mentor-grid');
    renderMentorCards(allMentors, 'mentor-grid-all');
    renderApplications();
    renderSchedule();
    renderResources();
}

document.addEventListener('DOMContentLoaded', init);
