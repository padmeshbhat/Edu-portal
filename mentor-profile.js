/* ============================================================
   EduPortal — Mentor Profile Page JavaScript
   ============================================================ */

'use strict';

// ── Session Guard ──────────────────────────────────────────────
if (localStorage.getItem('eduportal_loggedIn') !== 'true' || localStorage.getItem('eduportal_role') !== 'mentor') {
    window.location.href = 'index.html';
}

// ── Particle Canvas (reuse from index.js approach) ────────────
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.r = Math.random() * 1.5 + 0.3;
            this.vx = (Math.random() - 0.5) * 0.25;
            this.vy = (Math.random() - 0.5) * 0.25;
            this.alpha = Math.random() * 0.35 + 0.05;
            const hues = [200, 260, 175];
            this.hue = hues[Math.floor(Math.random() * hues.length)];
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.alpha})`;
            ctx.fill();
        }
    }

    function init() {
        resize();
        particles = Array.from({ length: 80 }, () => new Particle());
        loop();
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    init();
})();

// ── State ─────────────────────────────────────────────────────
let currentFieldType = 'technical'; // 'technical' | 'nontechnical'
let techAchievementCount = 0;
let nontechAchievementCount = 0;
let videoLinkCount = 0;
let mediaLinkCount = 0;

// ── DOM References ────────────────────────────────────────────
const stepDot1 = document.getElementById('step-dot-1');
const stepDot2 = document.getElementById('step-dot-2');
const stepLine1 = document.getElementById('step-line-1');

const sectionBasic = document.getElementById('section-basic');
const sectionTech = document.getElementById('section-technical');
const sectionNonTech = document.getElementById('section-nontechnical');

// ── Step Navigation ───────────────────────────────────────────
document.getElementById('next-to-step2').addEventListener('click', () => {
    goToStep2();
});

document.getElementById('back-to-step1-tech').addEventListener('click', () => {
    goToStep1();
});

document.getElementById('back-to-step1-nontech').addEventListener('click', () => {
    goToStep1();
});

function goToStep2() {
    sectionBasic.classList.remove('active');

    stepDot1.classList.remove('active');
    stepDot1.classList.add('completed');
    stepLine1.classList.add('completed');
    stepDot2.classList.add('active');

    if (currentFieldType === 'technical') {
        sectionTech.classList.add('active');
        sectionNonTech.classList.remove('active');
        // Seed first achievement if empty
        if (techAchievementCount === 0) addTechAchievement();
    } else {
        sectionNonTech.classList.add('active');
        sectionTech.classList.remove('active');
        // Seed first achievement & video if empty
        if (nontechAchievementCount === 0) addNontechAchievement();
        if (videoLinkCount === 0) addVideoLink();
        if (mediaLinkCount === 0) addMediaLink();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep1() {
    sectionTech.classList.remove('active');
    sectionNonTech.classList.remove('active');
    sectionBasic.classList.add('active');

    stepDot2.classList.remove('active');
    stepDot1.classList.remove('completed');
    stepDot1.classList.add('active');
    stepLine1.classList.remove('completed');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Field Type Radio Cards ────────────────────────────────────
const radioTechLabel = document.getElementById('radio-technical-label');
const radioNonTechLabel = document.getElementById('radio-nontechnical-label');
const radioTech = document.getElementById('field-technical');
const radioNonTech = document.getElementById('field-nontechnical');

function updateFieldType(value) {
    currentFieldType = value;
    if (value === 'technical') {
        radioTechLabel.classList.add('active');
        radioNonTechLabel.classList.remove('active');
    } else {
        radioNonTechLabel.classList.add('active');
        radioTechLabel.classList.remove('active');
    }
}

radioTechLabel.addEventListener('click', () => {
    radioTech.checked = true;
    updateFieldType('technical');
});

radioNonTechLabel.addEventListener('click', () => {
    radioNonTech.checked = true;
    updateFieldType('nontechnical');
});

// ── Employment Status Pills ───────────────────────────────────
const workingPill = document.querySelector('label[for="emp-working"]');
const retiredPill = document.querySelector('label[for="emp-retired"]');
const workingFields = document.getElementById('working-fields');
const retiredFields = document.getElementById('retired-fields');

workingPill.addEventListener('click', () => {
    workingPill.classList.add('active');
    retiredPill.classList.remove('active');
    workingFields.classList.remove('hidden');
    retiredFields.classList.add('hidden');
    document.getElementById('emp-working').checked = true;
});

retiredPill.addEventListener('click', () => {
    retiredPill.classList.add('active');
    workingPill.classList.remove('active');
    retiredFields.classList.remove('hidden');
    workingFields.classList.add('hidden');
    document.getElementById('emp-retired').checked = true;
});

// ── Technical Skills Tag Selector ────────────────────────────
document.getElementById('tech-skills-selector').addEventListener('click', (e) => {
    const tag = e.target.closest('.skill-tag');
    if (!tag) return;
    tag.classList.toggle('selected');
    tag.setAttribute('aria-pressed', tag.classList.contains('selected'));
});

// ── Non-Technical Field Tag Selector (single-select) ─────────
const nontechSelector = document.getElementById('nontech-field-selector');
nontechSelector.addEventListener('click', (e) => {
    const tag = e.target.closest('.nontech-tag');
    if (!tag) return;
    nontechSelector.querySelectorAll('.nontech-tag').forEach(t => {
        t.classList.remove('selected');
        t.removeAttribute('aria-pressed');
    });
    tag.classList.add('selected');
    tag.setAttribute('aria-pressed', 'true');
});

// ── Character Counters ────────────────────────────────────────
function attachCharCounter(textareaId, countId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(countId);
    if (!textarea || !counter) return;
    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        counter.textContent = len;
        const parent = counter.closest('.char-counter');
        if (parent) {
            parent.classList.toggle('warning', len >= textarea.maxLength * 0.9);
        }
    });
}
attachCharCounter('tech-description', 'tech-desc-count');
attachCharCounter('nontech-description', 'nontech-desc-count');

// ── Profile Photo Upload ──────────────────────────────────────
const photoArea = document.getElementById('photo-upload-area');
const photoInput = document.getElementById('profile-photo');
const photoImg = document.getElementById('photo-img');
const photoPlaceholder = document.getElementById('photo-placeholder');
const photoOverlay = document.getElementById('photo-overlay');

photoArea.addEventListener('click', () => photoInput.click());
photoArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        photoInput.click();
    }
});

photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        photoImg.src = e.target.result;
        photoImg.classList.remove('hidden');
        photoPlaceholder.classList.add('hidden');
        photoOverlay.style.opacity = '';
    };
    reader.readAsDataURL(file);
});

// ── Tech Achievements ─────────────────────────────────────────
function addTechAchievement() {
    techAchievementCount++;
    const idx = techAchievementCount;
    const container = document.getElementById('tech-achievements-list');

    const item = document.createElement('div');
    item.className = 'achievement-item';
    item.dataset.id = idx;
    item.innerHTML = `
        <div class="achievement-item-header">
            <span class="achievement-num">Achievement #${idx}</span>
            <button type="button" class="remove-btn" aria-label="Remove achievement ${idx}" data-type="tech">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="achievement-grid">
            <div class="form-field">
                <label class="field-label" for="tech-ach-title-${idx}">Achievement Title</label>
                <div class="mp-input-wrap">
                    <input type="text" id="tech-ach-title-${idx}" class="mp-input" placeholder="e.g. Won Google Code Jam 2022">
                </div>
            </div>
            <div class="form-field">
                <label class="field-label">Certificate / Photo</label>
                <label class="file-upload-btn" style="position:relative;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    Attach File
                    <input type="file" id="tech-ach-file-${idx}" accept="image/*,.pdf" aria-label="Upload certificate or photo for achievement ${idx}">
                </label>
                <p class="file-name-display" id="tech-ach-file-name-${idx}">No file chosen</p>
            </div>
        </div>
    `;

    // File input name display
    setTimeout(() => {
        const fileInput = item.querySelector(`#tech-ach-file-${idx}`);
        const nameDisplay = item.querySelector(`#tech-ach-file-name-${idx}`);
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                nameDisplay.textContent = fileInput.files[0].name;
                nameDisplay.classList.add('has-file');
            } else {
                nameDisplay.textContent = 'No file chosen';
                nameDisplay.classList.remove('has-file');
            }
        });

        // Remove button
        item.querySelector('.remove-btn').addEventListener('click', () => {
            item.style.animation = 'none';
            item.style.opacity = '0';
            item.style.transform = 'translateX(10px)';
            item.style.transition = 'all 0.25s ease';
            setTimeout(() => {
                item.remove();
                renumberAchievements('tech-achievements-list', 'Achievement');
            }, 250);
        });
    }, 0);

    container.appendChild(item);
}

document.getElementById('add-tech-achievement').addEventListener('click', addTechAchievement);

// ── Non-Tech Achievements ─────────────────────────────────────
function addNontechAchievement() {
    nontechAchievementCount++;
    const idx = nontechAchievementCount;
    const container = document.getElementById('nontech-achievements-list');

    const item = document.createElement('div');
    item.className = 'achievement-item';
    item.dataset.id = idx;
    item.innerHTML = `
        <div class="achievement-item-header">
            <span class="achievement-num">Entry #${idx}</span>
            <button type="button" class="remove-btn" aria-label="Remove entry ${idx}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="form-grid">
            <div class="form-field">
                <label class="field-label" for="nontech-ach-title-${idx}">Achievement / Event Name</label>
                <div class="mp-input-wrap">
                    <input type="text" id="nontech-ach-title-${idx}" class="mp-input" placeholder="e.g. State-level football championship">
                </div>
            </div>
            <div class="form-field">
                <label class="field-label" for="nontech-ach-type-${idx}">Type</label>
                <select id="nontech-ach-type-${idx}" class="mp-select">
                    <option value="">Select type…</option>
                    <option value="Award">🏆 Award</option>
                    <option value="Event Organized">📅 Event Organized</option>
                    <option value="Performance">🎭 Performance</option>
                </select>
            </div>
            <div class="form-field full-width">
                <label class="field-label">Certificate / Photo</label>
                <label class="file-upload-btn" style="position:relative;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    Attach Certificate or Photo
                    <input type="file" id="nontech-ach-file-${idx}" accept="image/*,.pdf" aria-label="Upload for entry ${idx}">
                </label>
                <p class="file-name-display" id="nontech-ach-file-name-${idx}">No file chosen</p>
            </div>
        </div>
    `;

    setTimeout(() => {
        const fileInput = item.querySelector(`#nontech-ach-file-${idx}`);
        const nameDisplay = item.querySelector(`#nontech-ach-file-name-${idx}`);
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                nameDisplay.textContent = fileInput.files[0].name;
                nameDisplay.classList.add('has-file');
            } else {
                nameDisplay.textContent = 'No file chosen';
                nameDisplay.classList.remove('has-file');
            }
        });

        item.querySelector('.remove-btn').addEventListener('click', () => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(10px)';
            item.style.transition = 'all 0.25s ease';
            setTimeout(() => {
                item.remove();
                renumberAchievements('nontech-achievements-list', 'Entry');
            }, 250);
        });
    }, 0);

    container.appendChild(item);
}

document.getElementById('add-nontech-achievement').addEventListener('click', addNontechAchievement);

// ── Video Links ───────────────────────────────────────────────
function addVideoLink() {
    videoLinkCount++;
    const idx = videoLinkCount;
    if (idx > 3) {
        showToastMessage('⚠️ Maximum 3 video links allowed.', false);
        videoLinkCount--;
        return;
    }
    const container = document.getElementById('video-links-list');

    const item = document.createElement('div');
    item.className = 'video-link-item';
    item.dataset.id = idx;
    item.innerHTML = `
        <div class="mp-input-wrap">
            <input type="url" id="video-url-${idx}" class="mp-input" placeholder="https://youtube.com/watch?v=... or paste video URL">
        </div>
        <label class="file-upload-btn" style="position:relative; white-space:nowrap; flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            File
            <input type="file" id="video-file-${idx}" accept="video/*" aria-label="Upload video ${idx}">
        </label>
        <button type="button" class="remove-btn" aria-label="Remove video ${idx}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    item.querySelector('.remove-btn').addEventListener('click', () => {
        item.style.opacity = '0';
        item.style.transition = 'opacity 0.25s ease';
        setTimeout(() => { item.remove(); videoLinkCount--; }, 250);
    });

    container.appendChild(item);
}

document.getElementById('add-video-link').addEventListener('click', addVideoLink);

// ── Media Links ───────────────────────────────────────────────
function addMediaLink() {
    mediaLinkCount++;
    const idx = mediaLinkCount;
    const container = document.getElementById('media-links-list');

    const item = document.createElement('div');
    item.className = 'media-link-item';
    item.dataset.id = idx;
    item.innerHTML = `
        <div class="mp-input-wrap">
            <input type="url" id="media-url-${idx}" class="mp-input" placeholder="https://youtube.com/... or instagram.com/...">
        </div>
        <button type="button" class="remove-btn" aria-label="Remove media link ${idx}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    item.querySelector('.remove-btn').addEventListener('click', () => {
        item.style.opacity = '0';
        item.style.transition = 'opacity 0.25s ease';
        setTimeout(() => { item.remove(); mediaLinkCount--; }, 250);
    });

    container.appendChild(item);
}

document.getElementById('add-media-link').addEventListener('click', addMediaLink);

// ── Renumber achievements after removal ───────────────────────
function renumberAchievements(containerId, label) {
    const items = document.querySelectorAll(`#${containerId} .achievement-item`);
    items.forEach((item, i) => {
        const numEl = item.querySelector('.achievement-num');
        if (numEl) numEl.textContent = `${label} #${i + 1}`;
    });
}

// ── Collect Form Data ─────────────────────────────────────────
function collectFormData() {
    const data = {
        fieldType: currentFieldType,
        basicInfo: {
            fullName: document.getElementById('full-name').value.trim(),
            age: document.getElementById('age').value,
            education: document.getElementById('education').value.trim(),
            hasPhoto: !!document.getElementById('profile-photo').files.length,
        }
    };

    if (currentFieldType === 'technical') {
        const empStatus = document.querySelector('input[name="emp-status"]:checked')?.value;
        const selectedSkills = [...document.querySelectorAll('#tech-skills-selector .skill-tag.selected')].map(t => t.dataset.value);

        const techAchievements = [];
        document.querySelectorAll('#tech-achievements-list .achievement-item').forEach((item, i) => {
            const idx = i + 1;
            techAchievements.push({
                title: document.getElementById(`tech-ach-title-${item.dataset.id}`)?.value.trim() || '',
                hasFile: !!(document.getElementById(`tech-ach-file-${item.dataset.id}`)?.files.length),
            });
        });

        data.technical = {
            employmentStatus: empStatus,
            companyName: empStatus === 'working' ? document.getElementById('company-name').value.trim() : null,
            roleDesignation: empStatus === 'working' ? document.getElementById('role-designation').value.trim() : null,
            prevCompanies: empStatus === 'retired' ? document.getElementById('prev-companies').value.trim() : null,
            prevRoles: empStatus === 'retired' ? document.getElementById('prev-roles').value.trim() : null,
            skills: selectedSkills,
            linkedIn: document.getElementById('linkedin-url').value.trim(),
            github: document.getElementById('github-url').value.trim(),
            leetcode: document.getElementById('leetcode-url').value.trim(),
            codeforces: document.getElementById('codeforces-url').value.trim(),
            otherLinkLabel: document.getElementById('other-link-label').value.trim(),
            otherLinkUrl: document.getElementById('other-link-url').value.trim(),
            description: document.getElementById('tech-description').value.trim(),
            achievements: techAchievements,
            contactEmail: document.getElementById('contact-email').value.trim(),
        };
    } else {
        const selectedField = document.querySelector('#nontech-field-selector .nontech-tag.selected')?.dataset.value || '';

        const nontechAchievements = [];
        document.querySelectorAll('#nontech-achievements-list .achievement-item').forEach((item) => {
            nontechAchievements.push({
                name: document.getElementById(`nontech-ach-title-${item.dataset.id}`)?.value.trim() || '',
                type: document.getElementById(`nontech-ach-type-${item.dataset.id}`)?.value || '',
                hasFile: !!(document.getElementById(`nontech-ach-file-${item.dataset.id}`)?.files.length),
            });
        });

        const videoLinks = [];
        document.querySelectorAll('#video-links-list .video-link-item').forEach((item) => {
            const url = document.getElementById(`video-url-${item.dataset.id}`)?.value.trim() || '';
            const hasFile = !!(document.getElementById(`video-file-${item.dataset.id}`)?.files.length);
            if (url || hasFile) videoLinks.push({ url, hasFile });
        });

        const mediaLinks = [];
        document.querySelectorAll('#media-links-list .media-link-item').forEach((item) => {
            const url = document.getElementById(`media-url-${item.dataset.id}`)?.value.trim() || '';
            if (url) mediaLinks.push(url);
        });

        data.nonTechnical = {
            field: selectedField,
            subBranch: document.getElementById('sub-branch').value.trim(),
            description: document.getElementById('nontech-description').value.trim(),
            achievements: nontechAchievements,
            videoLinks,
            mediaLinks,
        };
    }

    return data;
}

// ── Form Submit ───────────────────────────────────────────────
document.getElementById('mentor-profile-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = collectFormData();
    console.log('📋 Mentor Profile Data:', formData);
    console.log(JSON.stringify(formData, null, 2));

    // Save profile to localStorage and new DB layer
    const uid = localStorage.getItem('eduportal_uid');
    formData.uid = uid;
    formData.isDemo = false;
    
    // Add common fields for easier matching in the DB collection
    formData.track = formData.trackType === 'technical' ? 'Technical' : 'Non-Technical';
    formData.name = formData.name || localStorage.getItem('eduportal_name');
    formData.email = formData.email || localStorage.getItem('eduportal_email');
    formData.profilePhoto = formData.avatar || localStorage.getItem('eduportal_avatar') || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

    if (window.eduDB) {
        window.eduDB.updateDoc('mentors', uid, formData) || window.eduDB.addDoc('mentors', formData);
    }

    localStorage.setItem('eduportal_current_mentor', JSON.stringify(formData));
    localStorage.setItem('eduportal_profileDone', 'true');

    showToast();

    // Redirect to Mentor Dashboard after toast
    setTimeout(() => {
        window.location.href = 'mentor-dashboard.html';
    }, 2000);
});

// ── Toast ─────────────────────────────────────────────────────
function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
}

function showToastMessage(message, success = true) {
    const toast = document.getElementById('toast');
    const titleEl = toast.querySelector('.toast-title');
    const msgEl = toast.querySelector('.toast-msg');
    const iconEl = toast.querySelector('.toast-icon');

    if (!success) {
        titleEl.textContent = 'Notice';
        msgEl.textContent = message;
        iconEl.style.background = 'linear-gradient(135deg, #ff6e84, #e53e3e)';
    } else {
        titleEl.textContent = 'Profile Saved!';
        msgEl.textContent = message;
        iconEl.style.background = 'linear-gradient(135deg, #059669, #34d399)';
    }

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

document.getElementById('toast-close').addEventListener('click', () => {
    document.getElementById('toast').classList.remove('show');
});

// ── Keyboard accessibility for radio pills ────────────────────
document.querySelectorAll('.radio-pill').forEach(pill => {
    pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pill.click();
        }
    });
});

// ── Smooth hover effect for subsections ──────────────────────
document.querySelectorAll('.subsection').forEach(subsection => {
    subsection.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease';
    subsection.addEventListener('mouseenter', () => {
        subsection.style.transform = 'translateY(-1px)';
    });
    subsection.addEventListener('mouseleave', () => {
        subsection.style.transform = '';
    });
});
