/**
 * PixelCraft 20 Essential SaaS UX Patterns Implementation
 * Provides centralized utilities for toasts, modals, skeleton loaders,
 * debouncing, destructive actions, keyboard shortcuts, and autosave.
 */

const PixelCraftUX = {
    // 1. TOAST NOTIFICATIONS
    showToast(message, type = 'info', duration = 3500) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const iconMap = {
            success: 'fa-circle-check',
            error: 'fa-circle-exclamation',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${iconMap[type] || 'fa-circle-info'}" style="font-size: 1.15rem; color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#35B9FF'}"></i>
            <span style="flex: 1; font-weight: 500;">${message}</span>
            <button type="button" class="btn-ghost" style="padding: 2px 6px; font-size: 0.85rem;" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    },

    // 2. SKELETON LOADERS
    renderSkeletons(container, count = 3, type = 'card') {
        if (!container) return;
        let html = '';
        for (let i = 0; i < count; i++) {
            if (type === 'card') {
                html += `
                    <div class="card skeleton-card skeleton" style="margin-bottom: 1rem;"></div>
                `;
            } else if (type === 'table-row') {
                html += `
                    <tr>
                        <td><div class="skeleton skeleton-text short"></div></td>
                        <td><div class="skeleton skeleton-text"></div></td>
                        <td><div class="skeleton skeleton-text short"></div></td>
                        <td><div class="skeleton skeleton-text" style="width: 80px;"></div></td>
                    </tr>
                `;
            }
        }
        container.innerHTML = html;
    },

    // 6. AUTOSAVE INDICATOR HELPER
    updateAutosaveState(element, state, customMsg = '') {
        if (!element) return;
        element.className = `autosave-pill ${state}`;
        const icons = {
            saving: '<i class="fa-solid fa-spinner fa-spin"></i> Saving changes...',
            saved: '<i class="fa-solid fa-check"></i> Autosaved',
            error: '<i class="fa-solid fa-circle-exclamation"></i> Save failed'
        };
        element.innerHTML = customMsg || icons[state] || '';
    },

    // 7. DEBOUNCE
    debounce(func, wait = 300) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    // 8. THROTTLE
    throttle(func, limit = 300) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // 9. SMART FORM VALIDATION
    validateField(inputEl, condition, errorMsg) {
        const parent = inputEl.closest('.form-group') || inputEl.parentElement;
        let feedback = parent.querySelector('.form-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'form-feedback';
            parent.appendChild(feedback);
        }

        if (!condition) {
            inputEl.style.borderColor = '#EF4444';
            feedback.className = 'form-feedback error';
            feedback.textContent = errorMsg;
            return false;
        } else {
            inputEl.style.borderColor = '#10B981';
            feedback.className = 'form-feedback success';
            feedback.textContent = '';
            return true;
        }
    },

    // 14. TIER-BASED UI INDICATORS / UPGRADE MODAL
    showUpgradeModal(options = {}) {
        let featureName = 'This feature';
        let requiredPlan = 'pro';
        let description = 'Upgrade to PixelCraft Pro or Business to unlock high storage, 4K exports, and all 30 unlocked power tools.';
        let price = 149;
        let benefits = [
            'All 30 tools fully unlocked',
            '50 saved cloud projects',
            'High-speed priority processing'
        ];

        if (typeof options === 'string') {
            featureName = options;
        } else if (typeof options === 'object' && options !== null) {
            featureName = options.featureName || featureName;
            requiredPlan = options.requiredPlan || requiredPlan;
            description = options.description || description;
            price = options.price || (requiredPlan === 'business' ? 399 : 149);
            if (options.benefits && Array.isArray(options.benefits)) {
                benefits = options.benefits;
            } else if (requiredPlan === 'business') {
                benefits = [
                    'Everything in Pro included',
                    '500 saved cloud projects',
                    'Team workspace & shared projects',
                    'Bulk commercial invoicing'
                ];
            }
        }

        const planBadge = requiredPlan === 'business' ? 'badge-business' : 'badge-pro';
        const planName = requiredPlan === 'business' ? 'PixelCraft Business' : 'PixelCraft Pro';

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 480px;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span class="badge ${planBadge}"><i class="fa-solid fa-lock"></i> ${requiredPlan.toUpperCase()} FEATURE</span>
                        <h4 style="margin: 0;">Premium Feature Locked</h4>
                    </div>
                    <button class="btn-icon" id="upgrade-close-btn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 2rem 1.5rem;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(121, 87, 255, 0.15); color: var(--brand-purple); display: flex; align-items: center; justify-content: center; font-size: 1.85rem; margin: 0 auto 1.25rem;">
                        <i class="fa-solid fa-gem"></i>
                    </div>
                    <h3 style="margin-bottom: 0.5rem;">Unlock ${featureName}</h3>
                    <p style="margin: 0 0 1.5rem; color: var(--text-muted); font-size: 0.95rem;">${description}</p>
                    
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; text-align: left; margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.75rem;">
                            <strong>${planName}</strong>
                            <span style="font-size: 1.35rem; font-weight: 800; color: var(--brand-purple);">₹${price} <small style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/month</small></span>
                        </div>
                        <ul style="list-style: none; font-size: 0.88rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.45rem;">
                            ${benefits.map(b => `<li><i class="fa-solid fa-circle-check" style="color: #10B981; margin-right: 8px;"></i> ${b}</li>`).join('')}
                        </ul>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <a href="/pricing.html?plan=${requiredPlan}" class="btn btn-primary btn-lg" style="width: 100%;">
                            <i class="fa-solid fa-bolt"></i> Upgrade to ${requiredPlan.toUpperCase()} (₹${price}/mo)
                        </a>
                        <button type="button" class="btn btn-ghost" id="upgrade-continue-free-btn" style="color: var(--text-muted);">
                            Continue with Free Features
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#upgrade-close-btn').onclick = () => modal.remove();
        modal.querySelector('#upgrade-continue-free-btn').onclick = () => modal.remove();
    },

    // 15. ONBOARDING DATA CAPTURE
    checkOnboarding() {
        const user = PixelCraftAuth.getUser();
        if (user && !localStorage.getItem(`pc_onboarded_${user.id}`)) {
            this.showOnboardingModal(user);
        }
    },

    showOnboardingModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h4>Welcome to PixelCraft, ${user.full_name || 'Creator'}! 👋</h4>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1.25rem;">Help us tailor your creative workspace. How do you plan to use PixelCraft?</p>
                    <form id="onboarding-form">
                        <div class="form-group">
                            <label class="form-label">Primary Creative Goal</label>
                            <select class="form-control" id="onboard-role">
                                <option value="creator">Social Media Content Creator</option>
                                <option value="business">Freelancer / Small Business Owner</option>
                                <option value="developer">Developer & Tech Enthusiast</option>
                                <option value="student">Student / Educator</option>
                                <option value="general" selected>All-in-One Multi-Tool User</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Business / Brand Name (Optional)</label>
                            <input type="text" class="form-control" id="onboard-business" placeholder="e.g. Acme Studio">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                            <button type="button" class="btn btn-ghost" id="onboard-skip">Skip for now</button>
                            <button type="submit" class="btn btn-primary">Save Preferences</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => {
            localStorage.setItem(`pc_onboarded_${user.id}`, 'true');
            modal.remove();
        };

        modal.querySelector('#onboard-skip').onclick = close;
        modal.querySelector('#onboarding-form').onsubmit = async (e) => {
            e.preventDefault();
            const role = document.getElementById('onboard-role').value;
            const business = document.getElementById('onboard-business').value;
            try {
                await PixelCraftAPI.auth.updateProfile({ primary_use: role, business_name: business });
                PixelCraftUX.showToast('Preferences saved!', 'success');
            } catch (err) {
                // Non-blocking
            }
            close();
        };
    },

    // 19. DESTRUCTIVE ACTION PROTECTION
    confirmDestructive(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Are you absolutely sure?',
                message = 'This action cannot be undone. This will permanently delete the selected item.',
                confirmText = 'Delete Permanently',
                cancelText = 'Cancel'
            } = options;

            const modal = document.createElement('div');
            modal.className = 'modal-backdrop active';
            modal.innerHTML = `
                <div class="modal-dialog" style="max-width: 440px;">
                    <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                        <h4 style="color: #EF4444; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-triangle-exclamation"></i> ${title}
                        </h4>
                    </div>
                    <div class="modal-body" style="padding-top: 0.75rem;">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="confirm-cancel-btn">${cancelText}</button>
                        <button class="btn btn-danger" id="confirm-proceed-btn">${confirmText}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#confirm-cancel-btn').onclick = () => {
                modal.remove();
                resolve(false);
            };

            modal.querySelector('#confirm-proceed-btn').onclick = () => {
                modal.remove();
                resolve(true);
            };
        });
    },

    // 13. KEYBOARD SHORTCUTS MODAL
    showShortcutsHelp() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h4>Keyboard Shortcuts</h4>
                    <button class="btn-icon" onclick="this.closest('.modal-backdrop').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <table class="data-table">
                        <tbody>
                            <tr><td><kbd class="cmd-shortcut-badge">Ctrl + K</kbd> / <kbd class="cmd-shortcut-badge">Cmd + K</kbd></td><td>Open Command Palette & Global Search</td></tr>
                            <tr><td><kbd class="cmd-shortcut-badge">Ctrl + Z</kbd></td><td>Undo Design Change (Creator Studio)</td></tr>
                            <tr><td><kbd class="cmd-shortcut-badge">Ctrl + Y</kbd> / <kbd class="cmd-shortcut-badge">Ctrl + Shift + Z</kbd></td><td>Redo Design Change</td></tr>
                            <tr><td><kbd class="cmd-shortcut-badge">Ctrl + S</kbd></td><td>Save Current Tool Project</td></tr>
                            <tr><td><kbd class="cmd-shortcut-badge">Esc</kbd></td><td>Close Active Modal, Palette or Drawer</td></tr>
                            <tr><td><kbd class="cmd-shortcut-badge">?</kbd></td><td>Open Keyboard Shortcuts Help</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 21. TAP TO TOP / BACK TO TOP COMPONENT
    initTapToTop() {
        if (document.querySelector('.tap-to-top-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'tap-to-top-btn';
        btn.setAttribute('aria-label', 'Back to top');
        btn.setAttribute('title', 'Back to top');
        btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        document.body.appendChild(btn);

        const checkScroll = this.throttle(() => {
            if (window.scrollY > 320) {
                btn.classList.add('is-visible');
            } else {
                btn.classList.remove('is-visible');
            }
        }, 150);

        window.addEventListener('scroll', checkScroll, { passive: true });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
            btn.blur();
        });
    },

    // 22. SCROLL REVEAL (INTERSECTION OBSERVER)
    initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        if (!revealElements.length) return;

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.08,
                rootMargin: '0px 0px -40px 0px'
            });

            revealElements.forEach(el => observer.observe(el));

            // Safety fallback: reveal after 600ms in case elements are already visible
            setTimeout(() => {
                revealElements.forEach(el => el.classList.add('revealed'));
            }, 600);
        } else {
            // Fallback for browsers without IntersectionObserver
            revealElements.forEach(el => el.classList.add('revealed'));
        }
    },

    // 23. STICKY NAVBAR SCROLL STATE
    initNavbarScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        const onScroll = this.throttle(() => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, 120);

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    },

    // 24. MOBILE BOTTOM NAVIGATION
    initMobileBottomNav() {
        if (document.querySelector('.mobile-bottom-nav')) return;

        const nav = document.createElement('nav');
        nav.className = 'mobile-bottom-nav';
        nav.setAttribute('aria-label', 'Mobile Bottom Navigation');

        const path = window.location.pathname;
        const isHome = path === '/' || path.endsWith('index.html');
        const isTools = path.includes('tools.html') || path.includes('category.html') || path.includes('tool.html');
        const isWorkspace = path.includes('workspace.html') || path.includes('projects.html') || path.includes('favorites.html') || path.includes('activity.html');
        const isProfile = path.includes('profile.html') || path.includes('settings.html') || path.includes('login.html') || path.includes('signup.html');

        nav.innerHTML = `
            <a href="/index.html" class="mobile-nav-item ${isHome ? 'active' : ''}">
                <i class="fa-solid fa-house"></i>
                <span>Home</span>
            </a>
            <a href="/tools.html" class="mobile-nav-item ${isTools ? 'active' : ''}">
                <i class="fa-solid fa-toolbox"></i>
                <span>Tools</span>
            </a>
            <a href="/workspace.html" class="mobile-nav-item ${isWorkspace ? 'active' : ''}">
                <i class="fa-solid fa-house-laptop"></i>
                <span>Workspace</span>
            </a>
            <a href="${PixelCraftAuth && PixelCraftAuth.isLoggedIn() ? '/profile.html' : '/login.html'}" class="mobile-nav-item ${isProfile ? 'active' : ''}">
                <i class="fa-solid fa-user"></i>
                <span>${PixelCraftAuth && PixelCraftAuth.isLoggedIn() ? 'Profile' : 'Log in'}</span>
            </a>
        `;

        document.body.appendChild(nav);
    },

    // 25. COPY TO CLIPBOARD FEEDBACK
    async copyToClipboard(text, successMsg = 'Copied to clipboard!', triggerBtn = null) {
        if (!text) return false;

        let success = false;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                success = true;
            } else {
                // Fallback using execCommand
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                success = document.execCommand('copy');
                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('Copy failed:', err);
            success = false;
        }

        if (success) {
            this.showToast(successMsg, 'success');
            if (triggerBtn) {
                const origHtml = triggerBtn.innerHTML;
                triggerBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #10B981;"></i> Copied!';
                setTimeout(() => {
                    triggerBtn.innerHTML = origHtml;
                }, 1500);
            }
            return true;
        } else {
            this.showToast('Could not copy to clipboard. Please copy manually.', 'error');
            return false;
        }
    },

    // 26. REUSABLE DRAG & DROP ZONE CONTROLLER
    setupDropzone(element, onFileSelected, options = {}) {
        if (!element) return;
        const { accept = '', maxSizeMB = 25 } = options;

        let fileInput = element.querySelector('input[type="file"]');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.display = 'none';
            if (accept) fileInput.accept = accept;
            element.appendChild(fileInput);
        }

        // Accessibility: allow keyboard users to hit Enter or Space
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', 'File upload dropzone');

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        element.addEventListener('click', (e) => {
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.add('drag-active');
        });

        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drag-active');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drag-active');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                validateAndPass(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                validateAndPass(e.target.files[0]);
            }
        });

        function validateAndPass(file) {
            if (!file) return;

            // Check size
            const maxBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxBytes) {
                PixelCraftUX.showToast(`File is too large (${PixelCraftTools.formatBytes(file.size)}). Max allowed size is ${maxSizeMB}MB.`, 'error');
                return;
            }

            // Check type if accept is configured
            if (accept) {
                const acceptedTypes = accept.split(',').map(s => s.trim().toLowerCase());
                const fileType = file.type.toLowerCase();
                const fileExt = '.' + file.name.split('.').pop().toLowerCase();
                const matched = acceptedTypes.some(t => {
                    if (t.startsWith('.')) return fileExt === t;
                    if (t.endsWith('/*')) return fileType.startsWith(t.replace('/*', ''));
                    return fileType === t;
                });
                if (!matched) {
                    PixelCraftUX.showToast(`Unsupported file type (${file.type || fileExt}). Expected: ${accept}`, 'error');
                    return;
                }
            }

            if (typeof onFileSelected === 'function') {
                onFileSelected(file);
            }
        }
    },

    // 27. INTERACTIVE BEFORE & AFTER COMPARISON SLIDER
    createComparisonSlider(container, beforeSrc, afterSrc, options = {}) {
        if (!container) return;
        const { beforeLabel = 'ORIGINAL', afterLabel = 'COMPRESSED' } = options;

        container.innerHTML = `
            <div class="pc-comparison-slider">
                <span class="pc-slider-badge badge-before">${beforeLabel}</span>
                <span class="pc-slider-badge badge-after">${afterLabel}</span>
                <img src="${afterSrc}" class="pc-comparison-img" alt="After result">
                <div class="pc-comparison-overlay" style="width: 50%;">
                    <img src="${beforeSrc}" class="pc-comparison-img" alt="Before original" style="width: 100%; height: 100%;">
                </div>
                <div class="pc-slider-handle" style="left: 50%;"></div>
            </div>
        `;

        const slider = container.querySelector('.pc-comparison-slider');
        const overlay = container.querySelector('.pc-comparison-overlay');
        const handle = container.querySelector('.pc-slider-handle');

        let isDragging = false;

        function updateSlider(clientX) {
            const rect = slider.getBoundingClientRect();
            let x = clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const pct = (x / rect.width) * 100;

            overlay.style.width = pct + '%';
            handle.style.left = pct + '%';
        }

        // Mouse handlers
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX);
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch handlers (Mobile & Tablet)
        handle.addEventListener('touchstart', (e) => {
            isDragging = true;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging || !e.touches[0]) return;
            updateSlider(e.touches[0].clientX);
        }, { passive: true });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Click on slider track jumps handle
        slider.addEventListener('click', (e) => {
            if (e.target !== handle) {
                updateSlider(e.clientX);
            }
        });
    },

    // 28. UNDO / REDO HISTORY MANAGER
    createHistoryManager(onStateChange, maxHistory = 25) {
        let history = [];
        let currentIndex = -1;

        return {
            pushState(state) {
                // If we're not at the end of history, truncate future redo states
                if (currentIndex < history.length - 1) {
                    history = history.slice(0, currentIndex + 1);
                }
                history.push(JSON.parse(JSON.stringify(state)));
                if (history.length > maxHistory) {
                    history.shift();
                } else {
                    currentIndex++;
                }
                this.notify();
            },

            undo() {
                if (this.canUndo()) {
                    currentIndex--;
                    const state = JSON.parse(JSON.stringify(history[currentIndex]));
                    if (typeof onStateChange === 'function') onStateChange(state);
                    this.notify();
                    return state;
                }
                return null;
            },

            redo() {
                if (this.canRedo()) {
                    currentIndex++;
                    const state = JSON.parse(JSON.stringify(history[currentIndex]));
                    if (typeof onStateChange === 'function') onStateChange(state);
                    this.notify();
                    return state;
                }
                return null;
            },

            canUndo() {
                return currentIndex > 0;
            },

            canRedo() {
                return currentIndex < history.length - 1;
            },

            notify() {
                // Update undo/redo buttons if present in DOM
                const undoBtn = document.querySelector('.btn-undo');
                const redoBtn = document.querySelector('.btn-redo');
                if (undoBtn) undoBtn.disabled = !this.canUndo();
                if (redoBtn) redoBtn.disabled = !this.canRedo();
            }
        };
    }
};

window.PixelCraftUX = PixelCraftUX;

// Global Shortcuts & Initializers
document.addEventListener('keydown', (e) => {
    // Esc closes open modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-backdrop.active');
        if (openModal) openModal.remove();
    }
    // ? displays shortcuts
    if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        PixelCraftUX.showShortcutsHelp();
    }
});

// Mobile Drawer Toggle
document.addEventListener('DOMContentLoaded', () => {
    const drawerToggle = document.querySelector('.mobile-nav-toggle');
    const drawerBackdrop = document.querySelector('.mobile-drawer-backdrop');
    if (drawerToggle && drawerBackdrop) {
        drawerToggle.addEventListener('click', () => {
            drawerBackdrop.classList.toggle('active');
        });
        drawerBackdrop.addEventListener('click', (e) => {
            if (e.target === drawerBackdrop) drawerBackdrop.classList.remove('active');
        });
    }

    // Sidebar collapse state
    const sidebar = document.querySelector('.sidebar');
    const collapseBtn = document.querySelector('#sidebar-collapse-btn');
    if (sidebar && collapseBtn) {
        const savedState = localStorage.getItem('pixelcraft_sidebar_collapsed');
        if (savedState === 'true') sidebar.classList.add('collapsed');

        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('pixelcraft_sidebar_collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    PixelCraftUX.checkOnboarding();
    PixelCraftUX.initTapToTop();
    PixelCraftUX.initScrollReveal();
    PixelCraftUX.initNavbarScroll();
    PixelCraftUX.initMobileBottomNav();
});

