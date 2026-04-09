/**
 * EduPortal Auth — Interactive Logic
 * Tab switching (Student/Mentor), auth view toggle (Signup/Login),
 * floating labels, password toggle, button ripple, particle canvas
 */

(function () {
    'use strict';

    // ── DOM References ──────────────────────────────────────
    const tabStudent = document.getElementById('tab-student');
    const tabMentor  = document.getElementById('tab-mentor');
    const tabSlider  = document.getElementById('tab-slider');
    const panelStudent = document.getElementById('panel-student');
    const panelMentor  = document.getElementById('panel-mentor');
    const loginCard    = document.getElementById('login-card');
    const canvas       = document.getElementById('particle-canvas');
    const ctx          = canvas.getContext('2d');

    let activePortal = 'student';

    // ── Tab Switching (Student ↔ Mentor) ────────────────────
    function switchTab(portal) {
        if (portal === activePortal) return;

        const goingRight = portal === 'mentor';
        activePortal = portal;

        // Update tab buttons
        tabStudent.classList.toggle('active', portal === 'student');
        tabMentor.classList.toggle('active', portal === 'mentor');
        tabStudent.setAttribute('aria-selected', portal === 'student');
        tabMentor.setAttribute('aria-selected', portal === 'mentor');

        // Slide the pill indicator
        tabSlider.classList.toggle('mentor-active', goingRight);

        // Card glow mode
        loginCard.classList.toggle('mentor-mode', goingRight);

        // Animate panels
        const outgoing = goingRight ? panelStudent : panelMentor;
        const incoming = goingRight ? panelMentor : panelStudent;

        outgoing.classList.remove('slide-left', 'slide-right');
        outgoing.classList.add(goingRight ? 'slide-left' : 'slide-right');
        outgoing.setAttribute('hidden', '');

        incoming.classList.remove('slide-left', 'slide-right');
        incoming.removeAttribute('hidden');

        // Focus first input in the active auth-view of the new panel
        setTimeout(() => {
            const activeView = incoming.querySelector('.auth-view.active');
            if (activeView) {
                const firstInput = activeView.querySelector('.input-field');
                if (firstInput) firstInput.focus();
            }
        }, 350);

        // Update page title
        const activeView = incoming.querySelector('.auth-view.active');
        const isSignup = activeView && activeView.dataset.view === 'signup';
        document.title = `EduPortal | ${isSignup ? 'Sign Up' : 'Login'} — Learn. Grow. Lead.`;
    }

    tabStudent.addEventListener('click', () => switchTab('student'));
    tabMentor.addEventListener('click', () => switchTab('mentor'));

    // Keyboard navigation between tabs
    [tabStudent, tabMentor].forEach(tab => {
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const target = e.key === 'ArrowRight' ? tabMentor : tabStudent;
                target.focus();
                target.click();
            }
        });
    });

    // ── Auth View Toggle (Signup ↔ Login) ────────────────────
    document.querySelectorAll('.auth-toggle-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const portal = link.dataset.portal;   // 'student' or 'mentor'
            const target = link.dataset.target;    // 'login' or 'signup'
            const panel = document.getElementById(`panel-${portal}`);

            // Hide all auth-views in this panel
            panel.querySelectorAll('.auth-view').forEach(view => {
                view.classList.remove('active');
            });

            // Show the target view
            const targetView = document.getElementById(`${portal}-${target}-view`);
            if (targetView) {
                targetView.classList.add('active');

                // Re-trigger the slide-up animation
                targetView.style.animation = 'none';
                void targetView.offsetWidth; // reflow
                targetView.style.animation = '';

                // Focus first input
                setTimeout(() => {
                    const firstInput = targetView.querySelector('.input-field');
                    if (firstInput) firstInput.focus();
                }, 100);
            }

            // Update page title
            const label = target === 'signup' ? 'Sign Up' : 'Login';
            document.title = `EduPortal | ${label} — Learn. Grow. Lead.`;
        });
    });

    // ── Password Toggle ─────────────────────────────────────
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');

            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.classList.add('hidden');
                eyeClosed.classList.remove('hidden');
                btn.setAttribute('aria-label', 'Hide password');
            } else {
                input.type = 'password';
                eyeOpen.classList.remove('hidden');
                eyeClosed.classList.add('hidden');
                btn.setAttribute('aria-label', 'Show password');
            }
        });
    });

    // ── Button Ripple Effect ────────────────────────────────
    document.querySelectorAll('.login-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            this.classList.remove('rippling');
            void this.offsetWidth;

            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const rippleEl = this.querySelector('.btn-ripple');
            rippleEl.style.setProperty('--ripple-x', x + 'px');
            rippleEl.style.setProperty('--ripple-y', y + 'px');

            this.classList.add('rippling');
            setTimeout(() => this.classList.remove('rippling'), 600);
        });
    });

    // ── Form Submission ─────────────────────────────────────
    document.querySelectorAll('.login-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = form.querySelector('.login-btn');
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            const isSignup = form.id.includes('signup');

            // Validate all required fields
            const inputs = form.querySelectorAll('.input-field[required]');
            let hasError = false;

            inputs.forEach(input => {
                if (!input.value || (input.type === 'email' && !input.validity.valid)) {
                    shakeInput(input);
                    hasError = true;
                }
            });

            if (hasError) return;

            // Check password match for sign-up forms
            if (isSignup) {
                const password = form.querySelector('input[id$="-password"]');
                const confirm = form.querySelector('input[id$="-confirm"]');
                if (confirm && password && password.value !== confirm.value) {
                    shakeInput(confirm);
                    // Show mismatch message
                    const group = confirm.closest('.input-group');
                    showFieldError(group, 'Passwords do not match');
                    return;
                }
            }

            // Show loader
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            btn.disabled = true;
            btn.style.pointerEvents = 'none';

            // Determine portal type
            const portal = form.id.includes('student') ? 'student' : 'mentor';

            // Store user info in localStorage for cross-page state
            const nameInput = form.querySelector('input[id$="-name"]');
            const emailInput = form.querySelector('input[type="email"]');
            localStorage.setItem('eduportal_role', portal);
            if (nameInput) localStorage.setItem('eduportal_name', nameInput.value.trim());
            if (emailInput) localStorage.setItem('eduportal_email', emailInput.value.trim());
            localStorage.setItem('eduportal_loggedIn', 'true');

            // Simulate request delay
            setTimeout(() => {
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                btn.disabled = false;
                btn.style.pointerEvents = '';

                // Success feedback
                const successText = isSignup ? '✓ Account Created!' : '✓ Success!';
                btnText.textContent = successText;

                setTimeout(() => {
                    // Check if profile is already done for this specific user
                    const email = emailInput.value.trim();
                    const existingProfile = portal === 'student' 
                        ? JSON.parse(localStorage.getItem('eduportal_studentProfile') || '{}')
                        : JSON.parse(localStorage.getItem('eduportal_current_mentor') || '{}');
                    
                    const profileExists = existingProfile && existingProfile.email === email;
                    
                    if (isSignup && !profileExists) {
                        // Signup → Profile Creation page
                        localStorage.setItem('eduportal_profileDone', 'false');
                        if (portal === 'student') {
                            window.location.href = 'student-profile.html';
                        } else {
                            window.location.href = 'mentor-profile.html';
                        }
                    } else {
                        // Login OR Signup with existing profile → Dashboard
                        localStorage.setItem('eduportal_profileDone', 'true');
                        if (portal === 'student') {
                            window.location.href = 'student-dashboard.html';
                        } else {
                            window.location.href = 'mentor-dashboard.html';
                        }
                    }
                }, 1200);
            }, 1800);
        });
    });

    // ── Google Auth Simulation ──────────────────────────────────
    const googleModal = document.getElementById('google-auth-modal');
    const googleModalClose = document.getElementById('google-modal-close');
    let currentGoogleAuthContext = null; // { portal, isSignup, btn, prompt }

    document.querySelectorAll('.google-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const isStudent = btn.id.includes('student');
            const isSignup = btn.id.includes('signup');
            currentGoogleAuthContext = { 
                portal: isStudent ? 'student' : 'mentor', 
                isSignup, 
                btn,
                prompt: 'select_account'
            };

            // Show modal
            googleModal.classList.remove('hidden');
            requestAnimationFrame(() => googleModal.classList.add('show'));
        });
    });

    // Close Google Modal
    function closeGoogleModal() {
        if (!googleModal) return;
        googleModal.classList.remove('show');
        setTimeout(() => googleModal.classList.add('hidden'), 300);
        currentGoogleAuthContext = null;
    }

    googleModalClose?.addEventListener('click', closeGoogleModal);
    googleModal?.addEventListener('click', (e) => {
        if (e.target === googleModal) closeGoogleModal();
    });

    // Handle Google Account Selection
    document.querySelectorAll('.google-account-item:not(.add-account-item)').forEach(item => {
        item.addEventListener('click', () => {
            if (!currentGoogleAuthContext) return;
            const { portal, isSignup, btn } = currentGoogleAuthContext;
            const email = item.dataset.email;
            const name = item.dataset.name;
            const avatar = item.dataset.avatar || "";

            closeGoogleModal();
            triggerGoogleAuth(btn, portal, isSignup, name, email, avatar);
        });
    });

    // Custom Account List/Form Toggling
    const addAccountBtn = document.getElementById('add-google-account-btn');
    const accountList = document.querySelector('.google-account-list');
    const customAccountForm = document.getElementById('google-custom-account-form');
    const customBackBtn = document.getElementById('g-custom-back');

    addAccountBtn?.addEventListener('click', () => {
        accountList.classList.add('hidden');
        customAccountForm.classList.remove('hidden');
    });

    customBackBtn?.addEventListener('click', () => {
        customAccountForm.classList.add('hidden');
        accountList.classList.remove('hidden');
    });

    // Handle Custom Google Form Submit
    customAccountForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentGoogleAuthContext) return;
        const { portal, isSignup, btn } = currentGoogleAuthContext;
        
        const nameInput = document.getElementById('g-custom-name').value.trim();
        const emailInput = document.getElementById('g-custom-email').value.trim();

        if (nameInput && emailInput) {
            closeGoogleModal();
            triggerGoogleAuth(btn, portal, isSignup, nameInput, emailInput);
            
            // Reset form for next time
            setTimeout(() => {
                customAccountForm.reset();
                customAccountForm.classList.add('hidden');
                accountList.classList.remove('hidden');
            }, 500);
        }
    });

    // Shared visual feedback and redirect
    function triggerGoogleAuth(btn, portal, isSignup, name, email, avatar = "") {
        // Visual feedback on the original button
        const originalText = btn.querySelector('span').textContent;
        btn.querySelector('span').textContent = 'Authenticating...';
        btn.style.opacity = '0.8';
        btn.style.pointerEvents = 'none';

        setTimeout(() => {
            // Store auth token using selected account details
            // Generate a simple UID for the user if not already set for this email
            let uid = localStorage.getItem(`eduportal_uid_${email}`);
            if (!uid) {
                uid = 'user_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem(`eduportal_uid_${email}`, uid);
            }

            sessionStorage.setItem('eduportal_role', portal);
            sessionStorage.setItem('eduportal_name', name);
            sessionStorage.setItem('eduportal_email', email);
            sessionStorage.setItem('eduportal_uid', uid);
            if (avatar) sessionStorage.setItem('eduportal_avatar', avatar);
            sessionStorage.setItem('eduportal_loggedIn', 'true');

            btn.querySelector('span').textContent = '✓ Authenticated!';
            btn.style.background = 'rgba(255,255,255,0.15)'; // Flash highlight

            setTimeout(() => {
                // Check if profile is already done for this specific user
                // We use the email as the key to verify if the saved profile belongs to this user
                const studentProfile = JSON.parse(localStorage.getItem('eduportal_studentProfile') || '{}');
                const mentorProfile = JSON.parse(localStorage.getItem('eduportal_current_mentor') || '{}');
                
                const profileMatches = (portal === 'student' && studentProfile.email === email) || 
                                      (portal === 'mentor' && mentorProfile.contactEmail === email);

                if (isSignup && !profileMatches) {
                    sessionStorage.setItem('eduportal_profileDone', 'false');
                    window.location.href = portal === 'student' ? 'student-profile.html' : 'mentor-profile.html';
                } else {
                    sessionStorage.setItem('eduportal_profileDone', 'true');
                    window.location.href = portal === 'student' ? 'student-dashboard.html' : 'mentor-dashboard.html';
                }
            }, 800);
        }, 800);
    }

    function shakeInput(input) {
        const group = input.closest('.input-group');
        group.style.animation = 'shake 0.4s ease';
        input.style.borderColor = 'var(--error)';
        input.focus();

        setTimeout(() => {
            group.style.animation = '';
            input.style.borderColor = '';
        }, 500);
    }

    function showFieldError(group, message) {
        // Remove existing error
        const existing = group.querySelector('.field-error');
        if (existing) existing.remove();

        const errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        errorEl.style.cssText = `
            display: block;
            font-size: 0.75rem;
            color: var(--error);
            margin-top: 4px;
            font-weight: 500;
            animation: fade-in-up 0.3s ease;
        `;
        group.appendChild(errorEl);

        setTimeout(() => {
            if (errorEl.parentNode) errorEl.remove();
        }, 3000);
    }

    // Add shake keyframes dynamically
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // ── Particle Canvas ─────────────────────────────────────
    let particles = [];
    const PARTICLE_COUNT = 50;
    let animFrameId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.3,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.4 + 0.1,
            hue: Math.random() > 0.5 ? 190 : 260
        };
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.opacity})`;
            ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(109, 221, 255, ${0.04 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        animFrameId = requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    initParticles();
    drawParticles();

    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animFrameId);
        } else {
            drawParticles();
        }
    });

    // ── Google Button Press Feedback ────────────────────────
    document.querySelectorAll('.google-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(0.98)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        });
    });

})();
