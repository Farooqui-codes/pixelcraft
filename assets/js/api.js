/**
 * PixelCraft Centralized API Client
 * Clean REST wrapper with automatic token management, network error handling,
 * and graceful fallback.
 */

const API_BASE = '/api';

const PixelCraftAPI = {
    getToken() {
        return localStorage.getItem('pixelcraft_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('pixelcraft_token', token);
        } else {
            localStorage.removeItem('pixelcraft_token');
        }
    },

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            config.body = JSON.stringify(options.body);
        }

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 401 && !endpoint.includes('/auth/login')) {
                    // Session expired
                    this.setToken(null);
                    localStorage.removeItem('pixelcraft_user');
                    if (window.location.pathname.includes('workspace') || window.location.pathname.includes('admin')) {
                        window.location.href = '/login.html?expired=1';
                    }
                }
                const error = new Error(data.message || `Request failed with status ${res.status}`);
                error.status = res.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (err) {
            if (!navigator.onLine) {
                console.warn('Network offline, using cached or optimistic state.');
                throw new Error('You are currently offline. Please check your internet connection.');
            }
            throw err;
        }
    },

    // Auth endpoints
    auth: {
        signup: (data) => PixelCraftAPI.request('/auth/signup', { method: 'POST', body: data }),
        login: (data) => PixelCraftAPI.request('/auth/login', { method: 'POST', body: data }),
        me: () => PixelCraftAPI.request('/auth/me'),
        updateProfile: (data) => PixelCraftAPI.request('/auth/profile', { method: 'PUT', body: data }),
        changePassword: (data) => PixelCraftAPI.request('/auth/change-password', { method: 'POST', body: data }),
        forgotPassword: (data) => PixelCraftAPI.request('/auth/forgot-password', { method: 'POST', body: data }),
        resetPassword: (data) => PixelCraftAPI.request('/auth/reset-password', { method: 'POST', body: data })
    },

    // Tools
    tools: {
        list: (params = '') => PixelCraftAPI.request(`/tools${params ? '?' + params : ''}`),
        get: (id) => PixelCraftAPI.request(`/tools/${id}`),
        logUsage: (data) => PixelCraftAPI.request('/tools/log-usage', { method: 'POST', body: data }),
        recentActivity: () => PixelCraftAPI.request('/tools/user/recent'),
        activityStats: () => PixelCraftAPI.request('/tools/user/activity-stats'),
        clearHistory: () => PixelCraftAPI.request('/tools/history', { method: 'DELETE' })
    },

    // Projects (CRUD & Public Share)
    projects: {
        list: (params = '') => PixelCraftAPI.request(`/projects${params ? '?' + params : ''}`),
        get: (id) => PixelCraftAPI.request(`/projects/${id}`),
        public: (id) => PixelCraftAPI.request(`/projects/public/${id}`),
        create: (data) => PixelCraftAPI.request('/projects', { method: 'POST', body: data }),
        update: (id, data) => PixelCraftAPI.request(`/projects/${id}`, { method: 'PUT', body: data }),
        duplicate: (id) => PixelCraftAPI.request(`/projects/${id}/duplicate`, { method: 'POST' }),
        delete: (id) => PixelCraftAPI.request(`/projects/${id}`, { method: 'DELETE' }),
        bulkDelete: (ids) => PixelCraftAPI.request('/projects/bulk-delete', { method: 'POST', body: { ids } })
    },

    // Templates Marketplace
    templates: {
        list: (params = '') => PixelCraftAPI.request(`/templates${params ? '?' + params : ''}`),
        get: (id) => PixelCraftAPI.request(`/templates/${id}`),
        saveToProjects: (id) => PixelCraftAPI.request(`/templates/${id}/save-project`, { method: 'POST' })
    },

    // Brand Kit Studio
    brandKit: {
        get: () => PixelCraftAPI.request('/brand-kit'),
        update: (data) => PixelCraftAPI.request('/brand-kit', { method: 'PUT', body: data })
    },

    // In-App Notification Center
    notifications: {
        list: () => PixelCraftAPI.request('/notifications'),
        markRead: (id) => PixelCraftAPI.request(`/notifications/${id}/read`, { method: 'PUT' }),
        markAllRead: () => PixelCraftAPI.request('/notifications/read-all', { method: 'PUT' }),
        preferences: () => PixelCraftAPI.request('/notifications/preferences'),
        updatePreferences: (preferences) => PixelCraftAPI.request('/notifications/preferences', { method: 'PUT', body: { preferences } })
    },

    // Community, Feature Requests & Public Changelog
    community: {
        requests: (params = '') => PixelCraftAPI.request(`/community/feature-requests${params ? '?' + params : ''}`),
        createRequest: (data) => PixelCraftAPI.request('/community/feature-requests', { method: 'POST', body: data }),
        vote: (id) => PixelCraftAPI.request(`/community/feature-requests/${id}/vote`, { method: 'POST' }),
        changelog: () => PixelCraftAPI.request('/community/changelog'),
        addChangelog: (data) => PixelCraftAPI.request('/community/changelog', { method: 'POST', body: data })
    },

    // Multi-Tool Workflows Pipeline
    workflows: {
        list: () => PixelCraftAPI.request('/workflows'),
        execute: (payload) => PixelCraftAPI.request('/workflows/execute', { method: 'POST', body: payload })
    },

    // Favorites
    favorites: {
        list: () => PixelCraftAPI.request('/favorites'),
        toggle: (tool_id) => PixelCraftAPI.request('/favorites/toggle', { method: 'POST', body: { tool_id } })
    },

    // Contact Support
    contact: {
        send: (data) => PixelCraftAPI.request('/contact', { method: 'POST', body: data })
    },

    // Subscriptions & Monetization
    subscriptions: {
        plans: () => PixelCraftAPI.request('/subscriptions/plans'),
        current: () => PixelCraftAPI.request('/subscriptions/current'),
        usage: () => PixelCraftAPI.request('/subscriptions/usage'),
        applyCoupon: (code, targetPlan = 'pro') => PixelCraftAPI.request('/subscriptions/apply-coupon', { method: 'POST', body: { code, targetPlan } }),
        upgrade: (targetPlan, couponCode = null, paymentMethod = 'razorpay') => PixelCraftAPI.request('/subscriptions/upgrade', { method: 'POST', body: { targetPlan, couponCode, paymentMethod } }),
        cancel: () => PixelCraftAPI.request('/subscriptions/cancel', { method: 'POST' }),
        reactivate: () => PixelCraftAPI.request('/subscriptions/reactivate', { method: 'POST' }),
        invoices: () => PixelCraftAPI.request('/subscriptions/invoices'),
        receipt: (orderId) => PixelCraftAPI.request(`/subscriptions/invoices/${orderId}/receipt`),
        referrals: () => PixelCraftAPI.request('/subscriptions/referrals')
    },

    // Admin Console
    admin: {
        stats: () => PixelCraftAPI.request('/admin/stats'),
        users: (params = '') => PixelCraftAPI.request(`/admin/users${params ? '?' + params : ''}`),
        updateUser: (id, data) => PixelCraftAPI.request(`/admin/users/${id}`, { method: 'PUT', body: data }),
        deleteUser: (id) => PixelCraftAPI.request(`/admin/users/${id}`, { method: 'DELETE' }),
        projects: (params = '') => PixelCraftAPI.request(`/admin/projects${params ? '?' + params : ''}`),
        support: () => PixelCraftAPI.request('/admin/support'),
        updateSupport: (id, status) => PixelCraftAPI.request(`/admin/support/${id}`, { method: 'PUT', body: { status } }),
        settings: () => PixelCraftAPI.request('/admin/settings'),
        updateSetting: (key, value) => PixelCraftAPI.request(`/admin/settings/${key}`, { method: 'PUT', body: { value } }),
        plans: () => PixelCraftAPI.request('/admin/plans'),
        updatePlans: (plans) => PixelCraftAPI.request('/admin/plans', { method: 'PUT', body: { plans } }),
        subscriptions: (params = '') => PixelCraftAPI.request(`/admin/subscriptions${params ? '?' + params : ''}`),
        updateSubscription: (id, data) => PixelCraftAPI.request(`/admin/subscriptions/${id}`, { method: 'PUT', body: data }),
        transactions: (params = '') => PixelCraftAPI.request(`/admin/transactions${params ? '?' + params : ''}`),
        coupons: () => PixelCraftAPI.request('/admin/coupons'),
        saveCoupon: (data) => PixelCraftAPI.request('/admin/coupons', { method: 'POST', body: data }),
        deleteCoupon: (code) => PixelCraftAPI.request(`/admin/coupons/${code}`, { method: 'DELETE' }),
        usageLogs: (params = '') => PixelCraftAPI.request(`/admin/usage-logs${params ? '?' + params : ''}`),
        createTemplate: (data) => PixelCraftAPI.request('/admin/templates', { method: 'POST', body: data }),
        updateTemplate: (id, data) => PixelCraftAPI.request(`/admin/templates/${id}`, { method: 'PUT', body: data }),
        deleteTemplate: (id) => PixelCraftAPI.request(`/admin/templates/${id}`, { method: 'DELETE' }),
        updateFeatureRequest: (id, status) => PixelCraftAPI.request(`/admin/feature-requests/${id}`, { method: 'PUT', body: { status } }),
        deleteFeatureRequest: (id) => PixelCraftAPI.request(`/admin/feature-requests/${id}`, { method: 'DELETE' }),
        broadcastNotification: (data) => PixelCraftAPI.request('/admin/notifications/broadcast', { method: 'POST', body: data })
    }
};

window.PixelCraftAPI = PixelCraftAPI;

