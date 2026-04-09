/* ============================================================
   EduPortal — Mentor Dashboard JS
   All logic: navigation, demo data, matchmaker, activity,
   profile editing, resource sharing, modals, toasts.
   ============================================================ */

// ── Session Guard ──────────────────────────────────────────────
const currentUserId = sessionStorage.getItem('eduportal_uid');
const currentUserRole = sessionStorage.getItem('eduportal_role');

if (sessionStorage.getItem('eduportal_loggedIn') !== 'true' || currentUserRole !== 'mentor') {
    window.location.href = 'index.html';
}

// ═══════════════════════════════════════════════════════════════
//  DEMO DATA
// ═══════════════════════════════════════════════════════════════

const demoStudents = {
    pending: [],
    suggestions: [],
    accepted: []
};

const demoResources = [];

const demoFeed = [];

// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════

let state = {
    currentSection: 'dashboard',
    mentorProfile: null,
    allStudents: [],
    sessionRequests: [],
    resources: [],
    meetingsScheduled: 0,
    totalSessions: 0,
    classLinkTarget: null,
    pendingRequests: [],
    suggestedStudents: [],
    acceptedRequests: []
};

// ── DATA LOADING & HYDRATION ───────────────────────────────── //

function loadData() {
    if (window.eduDB) {
        // Load Students (could be demo or real registered students)
        window.eduDB.onSnapshot('students', (data) => {
            state.allStudents = data;
        });

        // Load Session Requests directed at this mentor
        window.eduDB.onSnapshot('sessionRequests', (data) => {
            state.sessionRequests = data.filter(r => r.mentorId === currentUserId);
            
            // Dynamic stats
            state.meetingsScheduled = state.sessionRequests.filter(r => r.status === 'scheduled').length;
            state.totalSessions = state.sessionRequests.filter(r => r.status === 'completed' || r.status === 'scheduled').length;

            state.pendingRequests = state.sessionRequests.filter(r => r.status === 'pending');
            state.acceptedRequests = state.sessionRequests.filter(r => r.status === 'accepted');
            state.suggestedStudents = getSuggestedStudents();

            updateRequestBadges();
            if (state.currentSection === 'dashboard') renderDashboard();
            if (state.currentSection === 'matchmaker') renderMatchMaker();
            if (state.currentSection === 'activity') renderActivity();
        });
    }
}

function updateRequestBadges() {
    const pendingCount = state.sessionRequests.filter(r => r.status === 'pending').length;
    const navBadge = document.getElementById('nav-badge-matchmaker');
    if (navBadge) {
        navBadge.textContent = pendingCount > 0 ? pendingCount : '';
        navBadge.style.display = pendingCount > 0 ? 'flex' : 'none';
        
        // Also update dashboard shortcut cards if they exist
        const dashBadge = document.getElementById('dash-pending-count');
        if (dashBadge) dashBadge.textContent = pendingCount;
    }
}

// Load mentor profile from sessionStorage if available
function loadMentorProfile() {
    const saved = sessionStorage.getItem('eduportal_current_mentor');
    const defaultName = sessionStorage.getItem('eduportal_name') || 'New Mentor';
    const defaultEmail = sessionStorage.getItem('eduportal_email') || 'mentor@eduportal.com';
    const avatar = sessionStorage.getItem('eduportal_avatar') || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

    if (saved) {
        state.mentorProfile = JSON.parse(saved);
        if (state.mentorProfile.profilePhoto === "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" && avatar) {
            state.mentorProfile.profilePhoto = avatar;
        }
    } else {
        // Fallback to minimal profile based on auth
        state.mentorProfile = {
            name: defaultName,
            age: 0,
            education: "Not provided",
            profilePhoto: avatar,
            fieldType: "technical",
            employmentStatus: "working",
            company: "Not provided",
            role: "Mentor",
            skills: [],
            links: { linkedin: "", github: "" },
            description: "No bio provided.",
            contactEmail: defaultEmail
        };
    }
}

function updateTopbar() {
    const nameEl = document.getElementById('topbar-name');
    const avatarEl = document.getElementById('topbar-avatar-img');
    const mobileAvatarEl = document.querySelector('#topbar-avatar-mobile img');
    
    if (nameEl) nameEl.textContent = state.mentorProfile.name;
    if (avatarEl) avatarEl.src = state.mentorProfile.profilePhoto;
    if (mobileAvatarEl) mobileAvatarEl.src = state.mentorProfile.profilePhoto;

    // Also update greeting if it exists
    const greeting = document.getElementById('dashboard-greeting');
    if (greeting) greeting.textContent = `Hello, ${state.mentorProfile.name.split(' ')[0]}!`;
}

// ═══════════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════════

const sectionMeta = {
    dashboard:  { title: "Dashboard",       sub: "Welcome back! Here's your overview." },
    matchmaker: { title: "Match Maker",     sub: "Manage mentorship requests and discover students." },
    activity:   { title: "Activity",        sub: "Your active mentees and scheduled sessions." },
    profile:    { title: "Edit Profile",    sub: "Update your mentor profile information." },
    resources:  { title: "Resource Sharing", sub: "Share useful resources with your mentees." }
};

function switchSection(sectionId) {
    state.currentSection = sectionId;

    // Update sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Update sections
    document.querySelectorAll('.dash-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === 'sec-' + sectionId);
    });

    // Update topbar
    const meta = sectionMeta[sectionId];
    document.getElementById('topbar-title').textContent = meta.title;
    document.getElementById('topbar-sub').textContent = meta.sub;

    // Mobile title
    const mobileTitle = document.querySelector('.mobile-title');
    if (mobileTitle) mobileTitle.textContent = meta.title;

    // Close mobile sidebar
    closeMobileSidebar();

    // Refresh section data
    if (sectionId === 'dashboard') renderDashboard();
    if (sectionId === 'matchmaker') renderMatchMaker();
    if (sectionId === 'activity') renderActivity();
    if (sectionId === 'profile') loadProfileForm();
    if (sectionId === 'resources') renderResources();
}

// Sidebar nav click handlers
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

// ═══════════════════════════════════════════════════════════════
//  MOBILE SIDEBAR
// ═══════════════════════════════════════════════════════════════

const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
let overlay = null;

hamburger?.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);

    if (isOpen) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay show';
            overlay.addEventListener('click', closeMobileSidebar);
            document.body.appendChild(overlay);
        } else {
            overlay.classList.add('show');
        }
    } else {
        closeMobileSidebar();
    }
});

function closeMobileSidebar() {
    sidebar.classList.remove('open');
    hamburger?.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 1: DASHBOARD
// ═══════════════════════════════════════════════════════════════

function renderDashboard() {
    // Level Calculation
    const sessions = state.totalSessions;
    let level, progress, hint;
    if (sessions <= 5) {
        level = "Beginner";
        progress = (sessions / 6) * 100;
        hint = `${sessions} / 6 sessions to Intermediate`;
    } else if (sessions <= 15) {
        level = "Intermediate";
        progress = ((sessions - 5) / 11) * 100;
        hint = `${sessions} / 16 sessions to Expert`;
    } else {
        level = "Expert";
        progress = 100;
        hint = `${sessions} sessions completed — You're an Expert! 🎉`;
    }

    document.getElementById('stat-level').textContent = level;
    document.getElementById('level-bar').style.width = progress + '%';
    document.getElementById('stat-sessions').textContent = hint;

    // Counts
    const pendingCount = state.sessionRequests.filter(r => r.status === 'pending').length;
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-meetings').textContent = state.meetingsScheduled;

    // Badge
    const navBadge = document.getElementById('nav-badge-matchmaker');
    if (navBadge) {
        navBadge.textContent = pendingCount > 0 ? pendingCount : '';
        navBadge.style.display = pendingCount > 0 ? 'flex' : 'none';
    }

    // Welcome
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    document.getElementById('greeting-time').textContent = greeting;
    document.getElementById('greeting-name').textContent = (state.mentorProfile?.name || 'Mentor').split(' ')[0];
    document.getElementById('welcome-pending').textContent = pendingCount;
    document.getElementById('welcome-meetings').textContent = state.meetingsScheduled;

    // Feed
    const feedList = document.getElementById('feed-list');
    feedList.innerHTML = demoFeed.map(f => `
        <div class="feed-item">
            <div class="feed-dot ${f.color}"></div>
            <div class="feed-text">${f.text}</div>
            <span class="feed-time">${f.time}</span>
        </div>
    `).join('');

function updateTopbar() {
    const mp = state.mentorProfile;
    if (!mp) return;

    const name = mp.name || 'Mentor';
    document.getElementById('topbar-name').textContent = name;

    const avatars = document.querySelectorAll('#topbar-avatar-img, #topbar-avatar-mobile img');
    const photo = mp.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d1b2a&color=6dddff&size=80`;
    avatars.forEach(img => { if (img) img.src = photo; });
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 2: MATCH MAKER
// ═══════════════════════════════════════════════════════════════

// Sub-tab switching
document.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.subtab;
        document.querySelectorAll('.sub-tab').forEach(t => t.classList.toggle('active', t.dataset.subtab === target));
        document.querySelectorAll('.sub-panel').forEach(p => {
            p.classList.toggle('active', p.id === 'panel-' + target);
        });
    });
});

function renderMatchMaker() {
    renderPendingList();
    renderSuggestionsList();

    const pendingCount = state.sessionRequests.filter(r => r.status === 'pending').length;
    const suggestions = getSuggestedStudents();
    const suggestedCount = suggestions.length;

    const subBadgePending = document.getElementById('sub-badge-pending');
    const subBadgeSuggestions = document.getElementById('sub-badge-suggestions');
    if (subBadgePending) subBadgePending.textContent = pendingCount;
    if (subBadgeSuggestions) subBadgeSuggestions.textContent = suggestedCount;
}

function getSuggestedStudents() {
    if (!state.mentorProfile || !state.allStudents) return [];
    const mentorTrack = state.mentorProfile.trackType === 'technical' ? 'Technical' : 'Non-Technical';
    
    return state.allStudents.filter(s => {
        // Filter out already accepted or pending or self (if any)
        const hasReq = state.sessionRequests.find(r => r.studentId === (s.uid || s.id));
        if (hasReq) return false;

        // MATCHING LOGIC
        if (mentorTrack === 'Technical' && s.track === 'Technical') {
            const mentorRole = (state.mentorProfile.role || '').toLowerCase();
            const studentRole = (s.role || '').toLowerCase();
            const roleMatch = mentorRole.includes(studentRole) || studentRole.includes(mentorRole);
            const mentorSkills = state.mentorProfile.skills || [];
            const studentSkills = s.skills || [];
            const skillMatch = mentorSkills.some(sk => studentSkills.includes(sk));
            return roleMatch || skillMatch;
        } else if (mentorTrack === 'Non-Technical' && s.track === 'Non-Technical') {
            const mentorDomain = (state.mentorProfile.nonTechnical?.field || '').toLowerCase();
            const studentDomain = (s.role || '').toLowerCase();
            return mentorDomain === studentDomain;
        }
        return false;
    });
}

function renderPendingList() {
    const container = document.getElementById('pending-list');
    const empty = document.getElementById('empty-pending');
    if (!container || !empty) return;

    const pending = state.sessionRequests.filter(r => r.status === 'pending');

    if (pending.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    container.innerHTML = pending.map(r => `
        <div class="student-row" data-id="${r.id}">
            <img src="${r.studentPhoto || 'https://i.pravatar.cc/150?img=1'}" alt="${r.studentName}" class="student-avatar">
            <div class="student-info">
                <div class="student-name">${r.studentName}</div>
                <div class="student-detail">${r.role || 'Student'} · Requested ${formatDate(r.createdAt)}</div>
            </div>
            <div class="student-actions">
                <button class="btn-view" onclick="viewStudentProfile('${r.studentId}', 'pending')">View Profile</button>
                <button class="btn-accept" onclick="acceptRequest('${r.id}', '${r.studentName}')">Accept</button>
                <button class="btn-decline" onclick="declineRequest('${r.id}', '${r.studentName}')">Decline</button>
            </div>
        </div>
    `).join('');
}

function renderSuggestionsList() {
    const container = document.getElementById('suggestions-list');
    const empty = document.getElementById('empty-suggestions');
    if (!container || !empty) return;

    const suggestions = getSuggestedStudents();

    if (suggestions.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    container.innerHTML = suggestions.map(s => `
        <div class="student-row" data-id="${s.uid || s.id}">
            <img src="${s.photo || 'https://i.pravatar.cc/150?img=1'}" alt="${s.name}" class="student-avatar">
            <div class="student-info">
                <div class="student-name">${s.name}</div>
                <div class="student-detail">${s.role || 'Student'} · ${s.education || 'Undergraduate'}</div>
            </div>
            <div class="student-actions">
                <button class="btn-view" onclick="viewStudentProfile('${s.uid || s.id}', 'suggestions')">View Profile</button>
                <button class="btn-send" onclick="sendInvite('${s.uid || s.id}', '${s.name}', '${s.photo || 'https://i.pravatar.cc/150?img=1'}')">Send Request</button>
            </div>
        </div>
    `).join('');
}

function acceptRequest(requestId, studentName) {
    if (!window.eduDB) return;
    window.eduDB.updateDoc('sessionRequests', requestId, { status: 'accepted' });
    showToast('Request Accepted!', `${studentName} is now your mentee.`);
}

function declineRequest(requestId, studentName) {
    if (!window.eduDB) return;
    window.eduDB.updateDoc('sessionRequests', requestId, { status: 'declined' });
    showToast('Request Declined', `${studentName}'s request was declined.`);
}

function sendInvite(studentId, studentName, studentPhoto) {
    if (!window.eduDB) return;
    
    const request = {
        studentId: studentId,
        studentName: studentName,
        studentPhoto: studentPhoto || 'https://i.pravatar.cc/150?img=1',
        mentorId: currentUserId,
        mentorName: state.mentorProfile.name,
        mentorPhoto: state.mentorProfile.profilePhoto,
        track: state.mentorProfile.trackType === 'technical' ? 'Technical' : 'Non-Technical',
        role: state.mentorProfile.role || state.mentorProfile.nonTechnical?.field || 'Mentor',
        status: 'pending',
        createdAt: new Date().toISOString(),
        isMentorInitiated: true
    };

    window.eduDB.addDoc('sessionRequests', request);
    showToast('Invite Sent!', `Mentorship invite sent to ${studentName}.`);
}

// ═══════════════════════════════════════════════════════════════
//  SECTION 3: ACTIVITY
// ═══════════════════════════════════════════════════════════════

function renderActivity() {
    const container = document.getElementById('accepted-list');
    const empty = document.getElementById('empty-accepted');
    if (!container || !empty) return;

    const accepted = state.sessionRequests.filter(r => r.status === 'accepted');

    // Close class link panel
    document.getElementById('class-link-panel').classList.add('hidden');
    document.getElementById('activity-list-wrap').classList.remove('hidden');

    if (accepted.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    container.innerHTML = accepted.map(r => `
        <div class="student-row" data-id="${r.id}">
            <img src="${r.studentPhoto || 'https://i.pravatar.cc/150?img=1'}" alt="${r.studentName}" class="student-avatar">
            <div class="student-info">
                <div class="student-name">${r.studentName}</div>
                <div class="student-detail">${r.role} · Active Mentee</div>
            </div>
            <div class="student-actions">
                <button class="btn-view" onclick="viewStudentProfile('${r.studentId}', 'accepted')">View Profile</button>
                <button class="btn-send" onclick="openClassLinkPanel('${r.id}')">Send Class Link</button>
            </div>
        </div>
    `).join('');
}

function openClassLinkPanel(requestId) {
    const req = state.sessionRequests.find(r => r.id === requestId);
    if (!req) return;

    state.classLinkTarget = req;

    document.getElementById('panel-student-name').textContent = 'to ' + req.studentName;
    document.getElementById('cls-mentor-name').value = state.mentorProfile?.name || '';

    // Set default datetime to tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const localISO = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    document.getElementById('cls-datetime').value = localISO;

    document.getElementById('cls-topic').value = '';
    document.getElementById('cls-link').value = '';

    // Show panel
    document.getElementById('class-link-panel').classList.remove('hidden');

    // Scroll to panel
    document.getElementById('class-link-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('panel-back')?.addEventListener('click', () => {
    document.getElementById('class-link-panel').classList.add('hidden');
    state.classLinkTarget = null;
});

document.getElementById('class-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const req = state.classLinkTarget;
    if (!req) return;

    const formData = {
        mentor_name:    document.getElementById('cls-mentor-name').value,
        session_date:   document.getElementById('cls-datetime').value,
        session_topic:  document.getElementById('cls-topic').value,
        meeting_link:   document.getElementById('cls-link').value,
        student_email:  req.studentEmail || 'student@eduportal.com',
        student_name:   req.studentName
    };

    // Actual email sending (requires SERVICE_ID, TEMPLATE_ID, and valid PUBLIC_KEY)
    if (typeof emailjs !== 'undefined') {
        emailjs.send("service_gp3riu8", "template_Ic0g8jb", formData)
            .then(() => {
                showToast('Email Sent!', `Meeting invite sent to ${req.studentName}`);
            })
            .catch((err) => {
                console.warn('EmailJS error:', err);
                showToast('Details Saved!', `Class scheduled for ${req.studentName}`);
            });
    }

    // Update session record in DB
    if (window.eduDB) {
        window.eduDB.updateDoc('sessionRequests', req.id, {
            status: 'scheduled',
            meetingLink: formData.meeting_link,
            meetingDate: formData.session_date,
            meetingTopic: formData.session_topic
        });
    }

    // Update local stats for UI
    state.meetingsScheduled++;
    state.totalSessions++;

    // Close panel and notify
    document.getElementById('class-link-panel').classList.add('hidden');
    document.getElementById('activity-list-wrap').classList.remove('hidden');
    state.classLinkTarget = null;
    
    renderActivity();
    renderDashboard();
});

// ═══════════════════════════════════════════════════════════════
//  SECTION 4: PROFILE EDITING
// ═══════════════════════════════════════════════════════════════

function loadProfileForm() {
    const mp = state.mentorProfile;
    if (!mp) return;

    // Avatar
    const avatarImg = document.getElementById('edit-avatar');
    avatarImg.src = mp.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name || 'M')}&background=0d1b2a&color=6dddff&size=160`;

    document.getElementById('edit-display-name').textContent = mp.name || 'Mentor';
    document.getElementById('edit-display-type').textContent = (mp.fieldType === 'technical' ? 'Technical' : 'Non-Technical') + ' Mentor';

    // Common
    document.getElementById('edit-name').value = mp.name || '';
    document.getElementById('edit-age').value = mp.age || '';
    document.getElementById('edit-education').value = mp.education || '';

    // Field type buttons
    const isTech = mp.fieldType === 'technical';
    document.getElementById('type-tech-btn').classList.toggle('active', isTech);
    document.getElementById('type-nontech-btn').classList.toggle('active', !isTech);
    document.getElementById('edit-tech-fields').classList.toggle('hidden', !isTech);
    document.getElementById('edit-nontech-fields').classList.toggle('hidden', isTech);

    if (isTech) {
        const isWorking = mp.employmentStatus !== 'retired';
        document.getElementById('edit-working').classList.toggle('active', isWorking);
        document.getElementById('edit-retired').classList.toggle('active', !isWorking);
        document.getElementById('edit-working-fields').classList.toggle('hidden', !isWorking);
        document.getElementById('edit-retired-fields').classList.toggle('hidden', isWorking);

        document.getElementById('edit-company').value = mp.company || '';
        document.getElementById('edit-role').value = mp.role || '';
        document.getElementById('edit-prev-companies').value = mp.previousCompanies || '';
        document.getElementById('edit-prev-roles').value = mp.previousRoles || '';

        const skills = Array.isArray(mp.skills) ? mp.skills.join(', ') : (mp.skills || '');
        document.getElementById('edit-skills').value = skills;

        document.getElementById('edit-linkedin').value = mp.links?.linkedin || '';
        document.getElementById('edit-github').value = mp.links?.github || '';
        document.getElementById('edit-description').value = mp.description || '';
        document.getElementById('edit-contact-email').value = mp.contactEmail || '';
    } else {
        document.getElementById('edit-field').value = mp.field || '';
        document.getElementById('edit-subbranch').value = mp.subBranch || '';
        document.getElementById('edit-nt-description').value = mp.description || '';
    }
}

// Type toggle
document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
        document.getElementById('edit-tech-fields').classList.toggle('hidden', type !== 'technical');
        document.getElementById('edit-nontech-fields').classList.toggle('hidden', type === 'technical');
    });
});

// Employment toggle
document.querySelectorAll('.pill[data-status]').forEach(pill => {
    pill.addEventListener('click', () => {
        const status = pill.dataset.status;
        document.querySelectorAll('.pill[data-status]').forEach(p => p.classList.toggle('active', p.dataset.status === status));
        document.getElementById('edit-working-fields').classList.toggle('hidden', status !== 'working');
        document.getElementById('edit-retired-fields').classList.toggle('hidden', status !== 'retired');
    });
});

// Profile save
document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const isTech = document.getElementById('type-tech-btn').classList.contains('active');
    const isWorking = document.getElementById('edit-working').classList.contains('active');

    const updated = {
        ...state.mentorProfile,
        name: document.getElementById('edit-name').value,
        age: parseInt(document.getElementById('edit-age').value) || null,
        education: document.getElementById('edit-education').value,
        fieldType: isTech ? 'technical' : 'nonTechnical'
    };

    if (isTech) {
        updated.employmentStatus = isWorking ? 'working' : 'retired';
        updated.company = document.getElementById('edit-company').value;
        updated.role = document.getElementById('edit-role').value;
        updated.previousCompanies = document.getElementById('edit-prev-companies').value;
        updated.previousRoles = document.getElementById('edit-prev-roles').value;
        updated.skills = document.getElementById('edit-skills').value.split(',').map(s => s.trim()).filter(Boolean);
        updated.links = {
            ...(updated.links || {}),
            linkedin: document.getElementById('edit-linkedin').value,
            github: document.getElementById('edit-github').value
        };
        updated.description = document.getElementById('edit-description').value;
        updated.contactEmail = document.getElementById('edit-contact-email').value;
    } else {
        updated.field = document.getElementById('edit-field').value;
        updated.subBranch = document.getElementById('edit-subbranch').value;
        updated.description = document.getElementById('edit-nt-description').value;
    }

    state.mentorProfile = updated;
    localStorage.setItem('eduportal_current_mentor', JSON.stringify(updated));

    updateTopbar();
    showToast('Profile Updated!', 'Your profile has been saved successfully.');
});

// ═══════════════════════════════════════════════════════════════
//  SECTION 5: RESOURCE SHARING
// ═══════════════════════════════════════════════════════════════

function renderResources() {
    const container = document.getElementById('resource-list');
    const empty = document.getElementById('empty-resources');

    if (state.resources.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    const categoryIcons = {
        Article: '📄', Video: '🎬', Tool: '🔧', Course: '📚', Other: '📌'
    };

    container.innerHTML = state.resources.map(r => `
        <div class="resource-item" data-id="${r.id}">
            <div class="resource-icon ${r.category.toLowerCase()}">${categoryIcons[r.category] || '📌'}</div>
            <div class="resource-info">
                <div class="resource-title">${escHtml(r.title)}</div>
                ${r.url.startsWith('http') ? `<a href="${escHtml(r.url)}" class="resource-url" target="_blank" rel="noopener">${escHtml(r.url)}</a>` : `<span class="resource-url">${escHtml(r.url)}</span>`}
            </div>
            <div class="resource-meta">
                <span class="resource-badge ${r.category.toLowerCase()}">${r.category}</span>
                <span class="resource-date">${formatDate(r.date)}</span>
                <button class="resource-delete" onclick="deleteResource('${r.id}')" aria-label="Delete resource">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

document.getElementById('resource-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('res-title').value.trim();
    const url = document.getElementById('res-url').value.trim();
    const category = document.getElementById('res-category').value;

    if (!title || !url) return;

    state.resources.unshift({
        id: 'res-' + Date.now(),
        title,
        url,
        category,
        date: new Date().toISOString().split('T')[0]
    });

    document.getElementById('res-title').value = '';
    document.getElementById('res-url').value = '';
    document.getElementById('res-category').value = 'Article';

    renderResources();
    showToast('Resource Shared!', `"${title}" has been shared with your mentees.`);
});

function deleteResource(resId) {
    state.resources = state.resources.filter(r => r.id !== resId);
    renderResources();
    showToast('Resource Deleted', 'The resource has been removed.');
}

// ═══════════════════════════════════════════════════════════════
//  MODAL — Student Profile Viewer
// ═══════════════════════════════════════════════════════════════

function getSuggestedStudents() {
    if (!state.mentorProfile) return [];
    
    // Simple matching: Filter students in the same track as the mentor
    // and who haven't already sent a request or been accepted
    const mentorTrack = state.mentorProfile.fieldType || state.mentorProfile.track;
    const mentorSkills = (state.mentorProfile.skills || []).map(s => s.toLowerCase());

    return state.allStudents.filter(student => {
        // 1. Same track?
        const studentTrack = student.track || student.fieldType;
        if (studentTrack?.toLowerCase() !== mentorTrack?.toLowerCase()) return false;

        // 2. Already matched?
        const alreadyMatched = state.sessionRequests.some(r => r.studentId === (student.uid || student.id));
        if (alreadyMatched) return false;

        // 3. (Optional) Skill overlap score - if tech
        if (mentorTrack === 'technical' && mentorSkills.length > 0) {
            const studentSkills = (student.skills || []).map(s => s.toLowerCase());
            const hasCommonSkill = studentSkills.some(s => mentorSkills.includes(s));
            // We'll show all in same track for now, but prioritize matches if we sorted
            return true;
        }

        return true;
    }).slice(0, 6); // Limit to top 6 suggestions
}

function viewStudentProfile(studentId, pool) {
    let student = null;
    if (pool === 'pending') {
        const req = state.pendingRequests.find(r => r.studentId === studentId);
        student = state.allStudents.find(s => (s.uid || s.id) === studentId) || {
            name: req?.studentName || "Student",
            avatar: req?.studentPhoto || "https://i.pravatar.cc/150",
            role: req?.role || "Student",
            bio: "Student has not provided a bio.",
            education: "Not specificed",
            email: req?.studentEmail || "No email"
        };
    }
    if (pool === 'suggestions') {
        student = state.suggestedStudents.find(s => (s.uid || s.id) === studentId);
    }
    if (pool === 'accepted') {
        const req = state.acceptedRequests.find(r => r.studentId === studentId);
        student = state.allStudents.find(s => (s.uid || s.id) === studentId) || {
            name: req?.studentName || "Student",
            avatar: req?.studentPhoto || "https://i.pravatar.cc/150",
            role: req?.role || "Student",
            bio: "Student has not provided a bio.",
            education: "Not specificed",
            email: req?.studentEmail || "No email"
        };
    }
    if (!student) return;

    const body = document.getElementById('student-modal-body');
    body.innerHTML = `
        <div class="modal-student-header">
            <img src="${student.avatar}" alt="${student.name}" class="modal-student-avatar">
            <div>
                <div class="modal-student-name">${student.name}</div>
                <div class="modal-student-sub">${student.interest}</div>
            </div>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Age</span>
            <span class="modal-detail-value">${student.age} years</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Education</span>
            <span class="modal-detail-value">${student.education}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Email</span>
            <span class="modal-detail-value">${student.email}</span>
        </div>
        ${student.sessionsCompleted !== undefined ? `
        <div class="modal-detail-row">
            <span class="modal-detail-label">Sessions</span>
            <span class="modal-detail-value">${student.sessionsCompleted} completed</span>
        </div>` : ''}
        <div class="modal-detail-row" style="flex-direction: column; gap: 0.375rem;">
            <span class="modal-detail-label">About</span>
            <span class="modal-detail-value" style="line-height:1.6">${student.bio}</span>
        </div>
    `;

    const modal = document.getElementById('student-modal');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('show'));
}

// Close modal
document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
document.getElementById('student-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'student-modal') closeModal();
});

function closeModal() {
    const modal = document.getElementById('student-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════

function showToast(title, msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title || 'Success!';
    document.getElementById('toast-msg').textContent = msg || 'Action completed.';
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadMentorProfile();
    updateTopbar();
    loadData();
    renderDashboard();
});
