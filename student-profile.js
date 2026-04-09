/* ============================================================
   EduPortal — Student Profile Creation JS
   ============================================================ */

// ── Session Guard ──────────────────────────────────────────────
if (localStorage.getItem('eduportal_loggedIn') !== 'true' || localStorage.getItem('eduportal_role') !== 'student') {
    window.location.href = 'index.html';
}

// ── Data Maps ────────────────────────────────────────────────
const roleSkillsMap = {
    'Front-End Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'Angular', 'TypeScript', 'Tailwind CSS', 'Figma', 'Sass', 'Next.js', 'Webpack'],
    'Back-End Developer': ['Node.js', 'Python', 'Java', 'Express.js', 'Django', 'Spring Boot', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'],
    'Full-Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'PostgreSQL', 'Docker', 'Git', 'TypeScript', 'Next.js'],
    'Data Scientist': ['Python', 'R', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'SQL', 'Tableau', 'Matplotlib', 'Statistics', 'Jupyter', 'Spark'],
    'UI/UX Designer': ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems', 'HTML', 'CSS', 'Interaction Design'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Terraform', 'Linux', 'Jenkins', 'Git', 'Ansible', 'Prometheus'],
    'Mobile Developer': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Firebase', 'REST APIs', 'SQLite', 'Dart', 'Xcode'],
    'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'NLP', 'Computer Vision', 'Deep Learning', 'MLOps', 'Pandas'],
    'Cloud Architect': ['AWS', 'GCP', 'Azure', 'Terraform', 'Serverless', 'Microservices', 'Docker', 'Kubernetes', 'Networking', 'Security'],
    'Cybersecurity Analyst': ['Network Security', 'Penetration Testing', 'SIEM', 'Firewalls', 'Encryption', 'Linux', 'Python', 'Wireshark', 'OWASP', 'Forensics'],
    'Game Developer': ['C++', 'C#', 'Unity', 'Unreal Engine', 'Game Design', '3D Modeling', 'Physics Engine', 'Blender', 'OpenGL', 'Godot'],
    'custom': ['HTML', 'CSS', 'JavaScript', 'Python', 'Java', 'C++', 'SQL', 'Git', 'Docker', 'Linux', 'TypeScript', 'React']
};

const hobbySubbranches = {
    'Music': ['Hindustani Vocal', 'Shastriya', 'Western Vocal', 'Guitar', 'Piano', 'Tabla', 'Flute', 'Violin', 'Drums', 'Music Production'],
    'Dance': ['Bharatanatyam', 'Kathak', 'Hip-Hop', 'Contemporary', 'Salsa', 'Ballet', 'Kuchipudi', 'Odissi', 'Jazz', 'Freestyle'],
    'Sports': ['Cricket', 'Football', 'Basketball', 'Swimming', 'Athletics', 'Badminton', 'Tennis', 'Chess', 'Kabaddi', 'Table Tennis'],
    'Art': ['Painting', 'Sculpture', 'Digital Art', 'Calligraphy', 'Pottery', 'Sketching', 'Watercolor', 'Oil Painting', 'Mixed Media'],
    'Drama': ['Theatre Acting', 'Improvisation', 'Screenplay Writing', 'Stage Direction', 'Monologue', 'Stand-up Comedy', 'Mime'],
    'Other': ['Photography', 'Cooking', 'Yoga', 'Fitness', 'Gardening', 'Public Speaking', 'Writing', 'Craft']
};

// ── State ────────────────────────────────────────────────────
let selectedTrack = null;      // 'technical' | 'nontechnical'
let selectedTechSkills = [];
let selectedHobby = null;
let selectedSubbranches = [];
let techAchievements = [];
let nontechAchievements = [];
let techAchCount = 0;
let nontechAchCount = 0;

// ── DOM Helpers ──────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Step Navigation ──────────────────────────────────────────
function goToSection(sectionId) {
    $$('.form-section').forEach(s => s.classList.remove('active'));
    const sec = $(sectionId);
    if (sec) {
        sec.classList.add('active');
        sec.style.animation = 'none';
        sec.offsetHeight;
        sec.style.animation = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const dot = $(`#step-dot-${i}`);
        if (!dot) continue;
        dot.classList.remove('active', 'completed');
        if (i < activeStep) dot.classList.add('completed');
        else if (i === activeStep) dot.classList.add('active');
    }
    for (let i = 1; i <= 2; i++) {
        const line = $(`#step-line-${i}`);
        if (!line) continue;
        line.classList.toggle('completed', i < activeStep);
    }
}

// ── Photo Upload ─────────────────────────────────────────────
const photoArea = $('#photo-upload-area');
const photoInput = $('#profile-photo');
const photoImg = $('#photo-img');
const photoPlaceholder = $('#photo-placeholder');

photoArea?.addEventListener('click', () => photoInput?.click());
photoArea?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        photoInput?.click();
    }
});

photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        photoImg.src = ev.target.result;
        photoImg.classList.remove('hidden');
        photoPlaceholder?.classList.add('hidden');
    };
    reader.readAsDataURL(file);
});

// ── Track Selection ──────────────────────────────────────────
$$('input[name="track-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
        selectedTrack = radio.value;
        $$('.radio-card').forEach(c => c.classList.remove('active'));
        radio.closest('.radio-card')?.classList.add('active');
    });
});

// ── Step 1 → Step 2 ──────────────────────────────────────────
$('#next-to-step2')?.addEventListener('click', () => {
    // Validate
    const name = $('#full-name').value.trim();
    const age = $('#age').value.trim();
    const email = $('#contact-email').value.trim();

    clearErrors();

    let hasError = false;
    if (!name) { showFieldError('full-name', 'Please enter your name'); hasError = true; }
    if (!age) { showFieldError('age', 'Please enter your age'); hasError = true; }
    if (!email) { showFieldError('contact-email', 'Please enter your email'); hasError = true; }
    if (!selectedTrack) {
        showToast('Select a track', 'Please choose Technical or Non-Technical');
        hasError = true;
    }
    if (hasError) return;

    updateStepIndicator(2);

    if (selectedTrack === 'technical') {
        goToSection('#section-technical');
    } else {
        goToSection('#section-nontechnical');
    }
});

// ── Back to Step 1 ───────────────────────────────────────────
$('#back-to-step1-tech')?.addEventListener('click', () => {
    updateStepIndicator(1);
    goToSection('#section-basic');
});

$('#back-to-step1-nontech')?.addEventListener('click', () => {
    updateStepIndicator(1);
    goToSection('#section-basic');
});

// ── Tech Role → Dynamic Skill Chips ──────────────────────────
$('#tech-role')?.addEventListener('change', (e) => {
    const role = e.target.value;
    if (role === 'custom') {
        $('#custom-role-wrap')?.classList.remove('hidden');
    } else {
        $('#custom-role-wrap')?.classList.add('hidden');
    }
    renderTechSkills(role);
});

function renderTechSkills(role) {
    const container = $('#tech-skills-selector');
    if (!container) return;
    const skills = roleSkillsMap[role] || roleSkillsMap['custom'];
    selectedTechSkills = [];
    container.innerHTML = skills.map(s =>
        `<button type="button" class="skill-tag" data-value="${s}">${s}</button>`
    ).join('');

    container.querySelectorAll('.skill-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const val = btn.dataset.value;
            if (btn.classList.contains('selected')) {
                if (!selectedTechSkills.includes(val)) selectedTechSkills.push(val);
            } else {
                selectedTechSkills = selectedTechSkills.filter(s => s !== val);
            }
        });
    });
}

// Init default skills
renderTechSkills('custom');

// ── Tech About Character Counter ─────────────────────────────
$('#tech-about')?.addEventListener('input', (e) => {
    const count = e.target.value.length;
    const counter = $('#tech-about-count');
    if (counter) counter.textContent = count;
    counter?.parentElement.classList.toggle('warning', count >= 480);
});

$('#nontech-about')?.addEventListener('input', (e) => {
    const count = e.target.value.length;
    const counter = $('#nontech-about-count');
    if (counter) counter.textContent = count;
    counter?.parentElement.classList.toggle('warning', count >= 480);
});

// ── Tech Achievements Toggle ─────────────────────────────────
$('#has-tech-achievements')?.addEventListener('change', (e) => {
    const container = $('#tech-achievements-container');
    const status = $('#tech-ach-status');
    if (e.target.checked) {
        container?.classList.remove('hidden');
        if (status) status.textContent = 'Yes';
        if (techAchCount === 0) addTechAchievement();
    } else {
        container?.classList.add('hidden');
        if (status) status.textContent = 'No';
    }
});

function addTechAchievement() {
    techAchCount++;
    const list = $('#tech-achievements-list');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'achievement-item';
    item.id = `tech-ach-${techAchCount}`;
    item.innerHTML = `
        <div class="achievement-item-header">
            <span class="achievement-num">Certificate #${techAchCount}</span>
            <button type="button" class="remove-btn" onclick="removeTechAch('tech-ach-${techAchCount}')" aria-label="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="achievement-grid">
            <div class="form-field">
                <label class="field-label">Certificate / Course Name</label>
                <div class="mp-input-wrap">
                    <input type="text" class="mp-input ach-name" placeholder="e.g. AWS Cloud Practitioner">
                </div>
            </div>
            <div class="form-field">
                <label class="field-label">Issuing Organization</label>
                <div class="mp-input-wrap">
                    <input type="text" class="mp-input ach-org" placeholder="e.g. Amazon Web Services">
                </div>
            </div>
        </div>
        <div class="form-field" style="margin-top:0.75rem;">
            <label class="file-upload-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Certificate
                <input type="file" accept=".pdf,image/*" class="file-input-hidden ach-file">
            </label>
            <p class="file-name-display ach-file-name">PDF or image</p>
        </div>
    `;

    list.appendChild(item);

    // File name display
    item.querySelector('.ach-file')?.addEventListener('change', (e) => {
        const name = e.target.files[0]?.name || 'No file chosen';
        const display = item.querySelector('.ach-file-name');
        if (display) {
            display.textContent = name;
            display.classList.toggle('has-file', !!e.target.files[0]);
        }
    });
}

window.removeTechAch = function(id) {
    document.getElementById(id)?.remove();
};

$('#add-tech-achievement')?.addEventListener('click', addTechAchievement);

// ── Hobby Selection ──────────────────────────────────────────
$$('.hobby-card').forEach(card => {
    card.addEventListener('click', () => {
        $$('.hobby-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedHobby = card.dataset.hobby;
        renderSubbranches(selectedHobby);
    });
});

function renderSubbranches(hobby) {
    const section = $('#nontech-subbranch-section');
    const container = $('#nontech-subbranch-selector');
    if (!section || !container) return;

    section.classList.remove('hidden');
    const branches = hobbySubbranches[hobby] || hobbySubbranches['Other'];
    selectedSubbranches = [];

    container.innerHTML = branches.map(b =>
        `<button type="button" class="skill-tag nontech-chip" data-value="${b}">${b}</button>`
    ).join('');

    container.querySelectorAll('.skill-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const val = btn.dataset.value;
            if (btn.classList.contains('selected')) {
                if (!selectedSubbranches.includes(val)) selectedSubbranches.push(val);
            } else {
                selectedSubbranches = selectedSubbranches.filter(s => s !== val);
            }
        });
    });
}

// Custom subbranch
$('#add-custom-subbranch')?.addEventListener('click', () => {
    const input = $('#custom-subbranch');
    const val = input?.value.trim();
    if (!val) return;

    const container = $('#nontech-subbranch-selector');
    if (!container) return;

    // Check for duplicate
    if (selectedSubbranches.includes(val)) {
        showToast('Already added', `"${val}" is already in your list`);
        return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skill-tag nontech-chip selected';
    btn.dataset.value = val;
    btn.textContent = val;
    selectedSubbranches.push(val);

    btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
        if (btn.classList.contains('selected')) {
            if (!selectedSubbranches.includes(val)) selectedSubbranches.push(val);
        } else {
            selectedSubbranches = selectedSubbranches.filter(s => s !== val);
        }
    });

    container.appendChild(btn);
    input.value = '';
});

// ── Non-tech Achievements Toggle ─────────────────────────────
$('#has-nontech-achievements')?.addEventListener('change', (e) => {
    const container = $('#nontech-achievements-container');
    const status = $('#nontech-ach-status');
    if (e.target.checked) {
        container?.classList.remove('hidden');
        if (status) status.textContent = 'Yes';
        if (nontechAchCount === 0) addNontechAchievement();
    } else {
        container?.classList.add('hidden');
        if (status) status.textContent = 'No';
    }
});

function addNontechAchievement() {
    nontechAchCount++;
    const list = $('#nontech-achievements-list');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'achievement-item';
    item.id = `nontech-ach-${nontechAchCount}`;
    item.innerHTML = `
        <div class="achievement-item-header">
            <span class="achievement-num">Achievement #${nontechAchCount}</span>
            <button type="button" class="remove-btn" onclick="removeNontechAch('nontech-ach-${nontechAchCount}')" aria-label="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="achievement-grid">
            <div class="form-field">
                <label class="field-label">Achievement / Event Name</label>
                <div class="mp-input-wrap">
                    <input type="text" class="mp-input ach-name" placeholder="e.g. Inter-College Dance Championship">
                </div>
            </div>
            <div class="form-field">
                <label class="field-label">When</label>
                <div class="mp-input-wrap">
                    <input type="date" class="mp-input ach-date">
                </div>
            </div>
        </div>
        <div class="form-field" style="margin-top:0.75rem;">
            <label class="file-upload-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Photo
                <input type="file" accept="image/*" class="file-input-hidden ach-file">
            </label>
            <p class="file-name-display ach-file-name">Optional photo</p>
        </div>
    `;

    list.appendChild(item);

    item.querySelector('.ach-file')?.addEventListener('change', (e) => {
        const name = e.target.files[0]?.name || 'No file chosen';
        const display = item.querySelector('.ach-file-name');
        if (display) {
            display.textContent = name;
            display.classList.toggle('has-file', !!e.target.files[0]);
        }
    });
}

window.removeNontechAch = function(id) {
    document.getElementById(id)?.remove();
};

$('#add-nontech-achievement')?.addEventListener('click', addNontechAchievement);

// ── Video Link Preview ───────────────────────────────────────
$('#video-link')?.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    const wrap = $('#video-preview-wrap');
    const thumb = $('#video-thumb-img');

    if (!wrap || !thumb) return;

    // Extract YouTube thumbnail
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
        thumb.src = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
        wrap.classList.remove('hidden');
    } else {
        wrap.classList.add('hidden');
    }
});

$('#video-file')?.addEventListener('change', (e) => {
    const name = e.target.files[0]?.name || 'No file chosen';
    const display = $('#video-file-name');
    if (display) {
        display.textContent = name;
        display.classList.toggle('has-file', !!e.target.files[0]);
    }
});

// ── Step 2 → Step 3 (Review) ─────────────────────────────────
$('#next-to-review-tech')?.addEventListener('click', () => {
    updateStepIndicator(3);
    buildReview();
    goToSection('#section-review');
});

$('#next-to-review-nontech')?.addEventListener('click', () => {
    updateStepIndicator(3);
    buildReview();
    goToSection('#section-review');
});

// ── Back to Step 2 ───────────────────────────────────────────
$('#back-to-step2')?.addEventListener('click', () => {
    updateStepIndicator(2);
    if (selectedTrack === 'technical') {
        goToSection('#section-technical');
    } else {
        goToSection('#section-nontechnical');
    }
});

// ── Build Review ─────────────────────────────────────────────
function buildReview() {
    const container = $('#review-content');
    if (!container) return;

    const name = $('#full-name')?.value.trim() || '';
    const age = $('#age')?.value.trim() || '';
    const email = $('#contact-email')?.value.trim() || '';
    const photoSrc = $('#photo-img')?.src || '';
    const hasPhoto = photoSrc && !$('#photo-img')?.classList.contains('hidden');

    let html = '';

    // ── Basic Info Card ──
    html += `
        <div class="review-card">
            <div class="review-card-header">
                <span class="review-card-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Basic Information
                </span>
                <button type="button" class="review-edit-btn" onclick="editStep(1)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                </button>
            </div>
            ${hasPhoto ? `<img class="review-photo" src="${photoSrc}" alt="Profile">` : ''}
            <div class="review-grid">
                <div class="review-item">
                    <span class="review-label">Full Name</span>
                    <span class="review-value">${name || '<em class="empty">Not provided</em>'}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Age</span>
                    <span class="review-value">${age || '<em class="empty">—</em>'}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Email</span>
                    <span class="review-value">${email || '<em class="empty">—</em>'}</span>
                </div>
                <div class="review-item">
                    <span class="review-label">Track</span>
                    <span class="review-value">${selectedTrack === 'technical' ? '💻 Technical' : '🎨 Non-Technical'}</span>
                </div>
            </div>
        </div>
    `;

    // ── Track-specific Card ──
    if (selectedTrack === 'technical') {
        const education = $('#tech-education')?.value || '';
        let role = $('#tech-role')?.value || '';
        if (role === 'custom') role = $('#custom-role')?.value.trim() || 'Custom Role';
        const about = $('#tech-about')?.value.trim() || '';

        html += `
            <div class="review-card">
                <div class="review-card-header">
                    <span class="review-card-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        Technical Details
                    </span>
                    <button type="button" class="review-edit-btn" onclick="editStep(2)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
                </div>
                <div class="review-grid">
                    <div class="review-item">
                        <span class="review-label">Education</span>
                        <span class="review-value">${education || '<em class="empty">—</em>'}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">Goal / Role</span>
                        <span class="review-value">${role || '<em class="empty">—</em>'}</span>
                    </div>
                </div>
                ${selectedTechSkills.length ? `
                    <div class="review-item" style="margin-top:1rem;">
                        <span class="review-label">Skills</span>
                        <div class="review-tags">
                            ${selectedTechSkills.map(s => `<span class="review-tag">${s}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                ${about ? `
                    <div class="review-item" style="margin-top:1rem;">
                        <span class="review-label">About</span>
                        <p class="review-about">${about}</p>
                    </div>
                ` : ''}
                ${buildAchievementsReview('tech')}
            </div>
        `;
    } else {
        const education = $('#nontech-education')?.value || '';
        const about = $('#nontech-about')?.value.trim() || '';
        const videoLink = $('#video-link')?.value.trim() || '';

        html += `
            <div class="review-card">
                <div class="review-card-header">
                    <span class="review-card-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        Non-Technical Details
                    </span>
                    <button type="button" class="review-edit-btn" onclick="editStep(2)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
                </div>
                <div class="review-grid">
                    <div class="review-item">
                        <span class="review-label">Education</span>
                        <span class="review-value">${education || '<em class="empty">—</em>'}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-label">Dream / Hobby</span>
                        <span class="review-value">${selectedHobby || '<em class="empty">—</em>'}</span>
                    </div>
                </div>
                ${selectedSubbranches.length ? `
                    <div class="review-item" style="margin-top:1rem;">
                        <span class="review-label">Specializations</span>
                        <div class="review-tags">
                            ${selectedSubbranches.map(s => `<span class="review-tag nontech">${s}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                ${about ? `
                    <div class="review-item" style="margin-top:1rem;">
                        <span class="review-label">About</span>
                        <p class="review-about">${about}</p>
                    </div>
                ` : ''}
                ${videoLink ? `
                    <div class="review-item" style="margin-top:1rem;">
                        <span class="review-label">Talent Video</span>
                        <span class="review-value"><a href="${videoLink}" target="_blank" style="color:var(--primary)">${videoLink}</a></span>
                    </div>
                ` : ''}
                ${buildAchievementsReview('nontech')}
            </div>
        `;
    }

    container.innerHTML = html;
}

function buildAchievementsReview(type) {
    const items = $$(`#${type}-achievements-list .achievement-item`);
    if (!items.length) return '';

    let html = '<div style="margin-top:1rem;"><span class="review-label">Achievements</span>';

    items.forEach(item => {
        const name = item.querySelector('.ach-name')?.value || '';
        const org = item.querySelector('.ach-org')?.value || '';
        const date = item.querySelector('.ach-date')?.value || '';
        if (!name) return;
        html += `
            <div class="review-achievement-item">
                <p class="review-ach-name">${name}</p>
                <p class="review-ach-org">${org || date || ''}</p>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// ── Edit Step (from review) ──────────────────────────────────
window.editStep = function(step) {
    if (step === 1) {
        updateStepIndicator(1);
        goToSection('#section-basic');
    } else {
        updateStepIndicator(2);
        if (selectedTrack === 'technical') goToSection('#section-technical');
        else goToSection('#section-nontechnical');
    }
};

$('#student-profile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Save profile data to localStorage for the dashboard
    const profileData = {
        uid: localStorage.getItem('eduportal_uid'),
        name: $('#full-name')?.value.trim() || '',
        age: $('#age')?.value.trim() || '',
        email: $('#contact-email')?.value.trim() || '',
        photo: $('#photo-img')?.src || '',
        track: selectedTrack,
        role: selectedTrack === 'technical' ? ($('#tech-role')?.value === 'custom' ? $('#custom-role')?.value.trim() : $('#tech-role')?.value) || 'Not specified' : selectedHobby || 'Not specified',
        skills: selectedTrack === 'technical' ? selectedTechSkills : selectedSubbranches,
        education: (selectedTrack === 'technical' ? $('#tech-education')?.value : $('#nontech-education')?.value) || 'Not specified',
        bio: (selectedTrack === 'technical' ? $('#tech-about')?.value.trim() : $('#nontech-about')?.value.trim()) || 'No bio provided.',
        isDemo: false
    };

    // Save to the new database layer
    if (window.eduDB) {
        window.eduDB.updateDoc('students', profileData.uid, profileData) || window.eduDB.addDoc('students', profileData);
    }
    
    localStorage.setItem('eduportal_studentProfile', JSON.stringify(profileData));
    localStorage.setItem('eduportal_profileDone', 'true');
    localStorage.setItem('eduportal_name', profileData.name);
    localStorage.setItem('eduportal_email', profileData.email);

    // Hide form, show success
    $('#student-profile-form')?.classList.add('hidden');
    $('#step-indicator')?.classList.add('hidden');
    $('#success-screen')?.classList.remove('hidden');

    launchConfetti();
});

// ── Field Validation Helpers ─────────────────────────────────
function showFieldError(fieldId, message) {
    const input = $(`#${fieldId}`);
    if (!input) return;
    input.classList.add('error');
    const error = document.createElement('p');
    error.className = 'field-error';
    error.textContent = message;
    input.closest('.form-field')?.appendChild(error);
}

function clearErrors() {
    $$('.field-error').forEach(e => e.remove());
    $$('.mp-input.error').forEach(i => i.classList.remove('error'));
}

// ── Toast ────────────────────────────────────────────────────
function showToast(title, msg) {
    const toast = $('#toast');
    const tTitle = $('#toast-title');
    const tMsg = $('#toast-msg');
    if (!toast) return;
    if (tTitle) tTitle.textContent = title;
    if (tMsg) tMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

$('#toast-close')?.addEventListener('click', () => {
    $('#toast')?.classList.remove('show');
});

// ── Confetti ─────────────────────────────────────────────────
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6dddff', '#ac8aff', '#fbbf24', '#34d399', '#ff6e84', '#ff9f43', '#fff'];
    const particles = [];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 4,
            h: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 4 + 2,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }

    let frame = 0;
    const maxFrames = 200;

    function animate() {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.rotSpeed;
            p.vy += 0.05; // gravity

            if (frame > maxFrames * 0.6) {
                p.opacity -= 0.02;
                if (p.opacity < 0) p.opacity = 0;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        if (frame < maxFrames) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    animate();
}

// ── Particle Background (reused from mentor-profile) ─────────
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.3 + 0.1
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dots.forEach(d => {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
            if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(109,221,255,${d.alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
});
