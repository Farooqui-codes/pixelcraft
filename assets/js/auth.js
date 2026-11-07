/**
 * PixelCraft Auth Manager
 * Manages user credentials, UI auth badges, protected routes, and logout.
 */

const PixelCraftAuth = {
    getUser() {
        try {
            const data = localStorage.getItem('pixelcraft_user');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        if (user) {
            localStorage.setItem('pixelcraft_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('pixelcraft_user');
        }
    },

    isLoggedIn() {
        return !!PixelCraftAPI.getToken() && !!this.getUser();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    logout() {
        PixelCraftAPI.setToken(null);
        localStorage.removeItem('pixelcraft_user');
        if (window.PixelCraftUX) {
            PixelCraftUX.showToast('You have been logged out.', 'info');
        }
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 300);
    },

    async checkSession() {
        if (!PixelCraftAPI.getToken()) return null;
        try {
            const res = await PixelCraftAPI.auth.me();
            if (res.success && res.user) {
                this.setUser(res.user);
                this.updateAuthUI(res.user);
                return res.user;
            }
        } catch (e) {
            this.setUser(null);
            PixelCraftAPI.setToken(null);
            this.updateAuthUI(null);
        }
        return null;
    },

    updateAuthUI(user) {
        const guestElements = document.querySelectorAll('.auth-guest-only');
        const userElements = document.querySelectorAll('.auth-user-only');
        const adminElements = document.querySelectorAll('.auth-admin-only');
        const nameDisplays = document.querySelectorAll('.user-name-display');
        const planBadges = document.querySelectorAll('.user-plan-badge');

        if (user) {
            guestElements.forEach(el => el.style.display = 'none');
            userElements.forEach(el => el.style.display = '');

            if (user.role === 'admin') {
                adminElements.forEach(el => el.style.display = '');
            } else {
                adminElements.forEach(el => el.style.display = 'none');
            }

            nameDisplays.forEach(el => { el.textContent = user.full_name || user.email.split('@')[0]; });
            planBadges.forEach(el => {
                const plan = (user.plan || 'free').toUpperCase();
                el.textContent = plan;
                el.className = `badge badge-${user.plan || 'free'} user-plan-badge`;
            });
        } else {
            guestElements.forEach(el => el.style.display = '');
            userElements.forEach(el => el.style.display = 'none');
            adminElements.forEach(el => el.style.display = 'none');
        }
    },

    getPlan() {
        const user = this.getUser();
        return user ? (user.plan || 'free') : 'free';
    },

    isPro() {
        const p = this.getPlan();
        return p === 'pro' || p === 'business' || this.isAdmin();
    },

    isBusiness() {
        const p = this.getPlan();
        return p === 'business' || this.isAdmin();
    },

    hasFeature(featureKey) {
        if (this.isAdmin()) return true;
        const plan = this.getPlan();
        const proFeatures = [
            'all_30_tools', 'premium_templates', 'batch_processing',
            'svg_export', 'high_res_export', 'custom_watermark', 'priority_processing'
        ];
        const businessFeatures = [
            ...proFeatures,
            'team_workspace', 'bulk_invoicing', 'priority_support', 'usage_reports'
        ];

        if (plan === 'business') return true;
        if (plan === 'pro') return proFeatures.includes(featureKey);
        return false;
    },

    canAccessTool(toolId) {
        // Free tier tools vs Pro
        // In PixelCraft, basic tools are free, while specialized tools/options require Pro
        if (this.isPro()) return true;
        return true; // Tools themselves are accessible, specific advanced actions require Pro
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login.html?redirect=${returnUrl}`;
            return false;
        }
        return true;
    },

    requireAdmin() {
        if (!this.isLoggedIn() || !this.isAdmin()) {
            window.location.href = '/workspace.html';
            return false;
        }
        return true;
    }
};

window.PixelCraftAuth = PixelCraftAuth;

document.addEventListener('DOMContentLoaded', () => {
    PixelCraftAuth.checkSession();

    // Hook logout buttons
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            PixelCraftAuth.logout();
        });
    });
});

