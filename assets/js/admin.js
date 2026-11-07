/**
 * PixelCraft Admin Dashboard Controller
 * Secure administrative metrics, user management, project auditing,
 * subscription lifecycle, monetization pricing engine, payment ledger, and coupons.
 */

const PixelCraftAdmin = {
    plansData: null,

    async init() {
        if (!PixelCraftAuth.requireAdmin()) return;
        await Promise.allSettled([
            this.loadStats(),
            this.loadUsers(),
            this.loadPlans(),
            this.loadSubscriptions(),
            this.loadTransactions(),
            this.loadCoupons(),
            this.loadTemplates(),
            this.loadFeatureRequests(),
            this.loadSupport(),
            this.loadSettings()
        ]);
        this.bindEvents();
    },

    bindEvents() {
        // Tab switcher
        const tabBtns = document.querySelectorAll('.admin-tab-btn');
        const tabPanes = document.querySelectorAll('.admin-tab-pane');

        tabBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.style.display = 'none');

                btn.classList.add('active');
                const targetId = btn.dataset.target;
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    targetPane.style.display = 'block';
                    if (targetId === 'admin-monetization') this.loadPlans();
                    else if (targetId === 'admin-subscriptions') this.loadSubscriptions();
                    else if (targetId === 'admin-transactions') this.loadTransactions();
                    else if (targetId === 'admin-coupons') this.loadCoupons();
                    else if (targetId === 'admin-users') this.loadUsers();
                    else if (targetId === 'admin-templates') this.loadTemplates();
                    else if (targetId === 'admin-community') this.loadFeatureRequests();
                }
            };
        });

        // Templates search & filters
        const tplSearch = document.getElementById('admin-tpl-search');
        const tplCategory = document.getElementById('admin-tpl-category');
        const tplTier = document.getElementById('admin-tpl-tier');
        if (tplSearch && tplCategory && tplTier) {
            const filterTpls = () => this.loadTemplates(tplSearch.value.trim(), tplCategory.value, tplTier.value);
            tplSearch.oninput = PixelCraftUX.debounce ? PixelCraftUX.debounce(filterTpls, 300) : filterTpls;
            tplCategory.onchange = filterTpls;
            tplTier.onchange = filterTpls;
        }

        // User search & filters
        const userSearch = document.getElementById('admin-user-search');
        const userPlan = document.getElementById('admin-user-plan');
        if (userSearch && userPlan) {
            const filterUsers = () => this.loadUsers(userSearch.value.trim(), userPlan.value);
            userSearch.oninput = PixelCraftUX.debounce ? PixelCraftUX.debounce(filterUsers, 300) : filterUsers;
            userPlan.onchange = filterUsers;
        }

        // Subscriptions filters
        const subSearch = document.getElementById('admin-sub-search');
        const subPlan = document.getElementById('admin-sub-plan');
        const subStatus = document.getElementById('admin-sub-status');
        if (subSearch && subPlan && subStatus) {
            const filterSubs = () => this.loadSubscriptions(subSearch.value.trim(), subPlan.value, subStatus.value);
            subSearch.oninput = PixelCraftUX.debounce ? PixelCraftUX.debounce(filterSubs, 300) : filterSubs;
            subPlan.onchange = filterSubs;
            subStatus.onchange = filterSubs;
        }

        // Transactions filters
        const txSearch = document.getElementById('admin-tx-search');
        const txStatus = document.getElementById('admin-tx-status');
        if (txSearch && txStatus) {
            const filterTx = () => this.loadTransactions(txSearch.value.trim(), txStatus.value);
            txSearch.oninput = PixelCraftUX.debounce ? PixelCraftUX.debounce(filterTx, 300) : filterTx;
            txStatus.onchange = filterTx;
        }

        // Maintenance toggle
        const maintToggle = document.getElementById('maint-toggle');
        if (maintToggle) {
            maintToggle.onchange = (e) => this.toggleMaintenance(e.target.checked);
        }
    },

    async loadStats() {
        try {
            const res = await PixelCraftAPI.admin.stats();
            const { stats } = res;

            const elUsers = document.getElementById('stat-total-users');
            const elProj = document.getElementById('stat-total-projects');
            const elRuns = document.getElementById('stat-tool-runs');
            const elRev = document.getElementById('stat-revenue');
            const elTix = document.getElementById('stat-open-tickets');

            if (elUsers) elUsers.textContent = stats.totalUsers;
            if (elProj) elProj.textContent = stats.totalProjects;
            if (elRuns) elRuns.textContent = stats.totalToolRuns;
            if (elRev) elRev.textContent = `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`;
            if (elTix) elTix.textContent = stats.openSupportTickets;

            // Popular tools
            const popEl = document.getElementById('admin-popular-tools');
            if (popEl && stats.popularTools) {
                popEl.innerHTML = stats.popularTools.map(t => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.9rem;">
                        <span>${t.tool_id}</span>
                        <span class="badge badge-free">${t.count} runs</span>
                    </div>
                `).join('');
            }
        } catch (e) {
            console.error('Failed to load admin stats:', e);
        }
    },

    async loadUsers(search = '', plan = 'all') {
        const tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;

        try {
            const query = `search=${encodeURIComponent(search)}&plan=${plan}`;
            const res = await PixelCraftAPI.admin.users(query);
            const users = res.users || [];

            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No users found matching query.</td></tr>`;
                return;
            }

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>
                        <strong>${u.full_name || 'Anonymous User'}</strong>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${u.email}</div>
                    </td>
                    <td><span class="badge badge-${u.plan}">${u.plan}</span></td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-pro' : 'badge-free'}">${u.role}</span></td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">${new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                        <div style="display: flex; gap: 0.4rem;">
                            <button class="btn btn-secondary btn-sm" onclick="PixelCraftAdmin.editUserPlan('${u.id}', '${u.plan}')" title="Change Tier"><i class="fa-solid fa-crown"></i></button>
                            <button class="btn btn-ghost btn-sm" style="color: #EF4444;" onclick="PixelCraftAdmin.deleteUser('${u.id}', '${u.email}')" title="Delete User"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" style="color: #EF4444; padding: 1rem;">Failed to load users: ${e.message}</td></tr>`;
        }
    },

    async editUserPlan(id, currentPlan) {
        const newPlan = prompt(`Change user plan (free, pro, business):`, currentPlan);
        if (newPlan && ['free', 'pro', 'business'].includes(newPlan.toLowerCase())) {
            try {
                await PixelCraftAPI.admin.updateUser(id, { plan: newPlan.toLowerCase() });
                PixelCraftUX.showToast(`User plan updated to ${newPlan}!`, 'success');
                this.loadUsers();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    async deleteUser(id, email) {
        const confirmed = await PixelCraftUX.confirmDestructive({
            title: 'Delete User Account?',
            message: `Are you sure you want to delete user ${email} and all associated projects?`
        });

        if (confirmed) {
            try {
                await PixelCraftAPI.admin.deleteUser(id);
                PixelCraftUX.showToast('User account deleted.', 'success');
                this.loadUsers();
                this.loadStats();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    // ----------------------------------------------------
    // PLANS & MONETIZATION PRICING ENGINE
    // ----------------------------------------------------
    async loadPlans() {
        try {
            const res = await PixelCraftAPI.admin.plans();
            if (!res || !res.plans) return;
            this.plansData = res.plans;

            // Free
            const free = res.plans.free;
            if (free) {
                const elDaily = document.getElementById('plan-free-dailyOps');
                const elProj = document.getElementById('plan-free-maxProjects');
                const elStore = document.getElementById('plan-free-maxStorageMB');
                const elFile = document.getElementById('plan-free-maxFileSizeMB');
                const elBatch = document.getElementById('plan-free-batchLimit');

                if (elDaily) elDaily.value = free.dailyOps;
                if (elProj) elProj.value = free.maxProjects;
                if (elStore) elStore.value = free.maxStorageMB;
                if (elFile) elFile.value = free.maxFileSizeMB;
                if (elBatch) elBatch.value = free.batchLimit;
            }

            // Pro
            const pro = res.plans.pro;
            if (pro) {
                const elPrice = document.getElementById('plan-pro-price');
                const elDaily = document.getElementById('plan-pro-dailyOps');
                const elProj = document.getElementById('plan-pro-maxProjects');
                const elStore = document.getElementById('plan-pro-maxStorageMB');
                const elFile = document.getElementById('plan-pro-maxFileSizeMB');
                const elBatch = document.getElementById('plan-pro-batchLimit');

                if (elPrice) elPrice.value = pro.priceMonthly;
                if (elDaily) elDaily.value = pro.dailyOps;
                if (elProj) elProj.value = pro.maxProjects;
                if (elStore) elStore.value = pro.maxStorageMB;
                if (elFile) elFile.value = pro.maxFileSizeMB;
                if (elBatch) elBatch.value = pro.batchLimit;
            }

            // Business
            const biz = res.plans.business;
            if (biz) {
                const elPrice = document.getElementById('plan-business-price');
                const elDaily = document.getElementById('plan-business-dailyOps');
                const elProj = document.getElementById('plan-business-maxProjects');
                const elStore = document.getElementById('plan-business-maxStorageMB');
                const elFile = document.getElementById('plan-business-maxFileSizeMB');
                const elBatch = document.getElementById('plan-business-batchLimit');

                if (elPrice) elPrice.value = biz.priceMonthly;
                if (elDaily) elDaily.value = biz.dailyOps;
                if (elProj) elProj.value = biz.maxProjects;
                if (elStore) elStore.value = biz.maxStorageMB;
                if (elFile) elFile.value = biz.maxFileSizeMB;
                if (elBatch) elBatch.value = biz.batchLimit;
            }
        } catch (e) {
            console.error('Failed to load plans:', e);
        }
    },

    async savePlans() {
        const btn = document.getElementById('btn-save-plans');
        if (btn) btn.disabled = true;

        try {
            const updated = JSON.parse(JSON.stringify(this.plansData || {}));

            // Free
            if (!updated.free) updated.free = { id: 'free', name: 'Free Plan', features: [] };
            updated.free.dailyOps = parseInt(document.getElementById('plan-free-dailyOps')?.value, 10) || 10;
            updated.free.maxProjects = parseInt(document.getElementById('plan-free-maxProjects')?.value, 10) || 5;
            updated.free.maxStorageMB = parseInt(document.getElementById('plan-free-maxStorageMB')?.value, 10) || 25;
            updated.free.maxFileSizeMB = parseInt(document.getElementById('plan-free-maxFileSizeMB')?.value, 10) || 10;
            updated.free.batchLimit = parseInt(document.getElementById('plan-free-batchLimit')?.value, 10) || 1;

            // Pro
            if (!updated.pro) updated.pro = { id: 'pro', name: 'Pro Plan', features: [] };
            updated.pro.priceMonthly = parseInt(document.getElementById('plan-pro-price')?.value, 10) || 149;
            updated.pro.dailyOps = parseInt(document.getElementById('plan-pro-dailyOps')?.value, 10) || 100;
            updated.pro.maxProjects = parseInt(document.getElementById('plan-pro-maxProjects')?.value, 10) || 50;
            updated.pro.maxStorageMB = parseInt(document.getElementById('plan-pro-maxStorageMB')?.value, 10) || 500;
            updated.pro.maxFileSizeMB = parseInt(document.getElementById('plan-pro-maxFileSizeMB')?.value, 10) || 50;
            updated.pro.batchLimit = parseInt(document.getElementById('plan-pro-batchLimit')?.value, 10) || 10;

            // Business
            if (!updated.business) updated.business = { id: 'business', name: 'Business Plan', features: [] };
            updated.business.priceMonthly = parseInt(document.getElementById('plan-business-price')?.value, 10) || 399;
            updated.business.dailyOps = parseInt(document.getElementById('plan-business-dailyOps')?.value, 10) || 1000;
            updated.business.maxProjects = parseInt(document.getElementById('plan-business-maxProjects')?.value, 10) || 500;
            updated.business.maxStorageMB = parseInt(document.getElementById('plan-business-maxStorageMB')?.value, 10) || 5120;
            updated.business.maxFileSizeMB = parseInt(document.getElementById('plan-business-maxFileSizeMB')?.value, 10) || 100;
            updated.business.batchLimit = parseInt(document.getElementById('plan-business-batchLimit')?.value, 10) || 50;

            const res = await PixelCraftAPI.admin.updatePlans(updated);
            if (res.success) {
                this.plansData = res.plans;
                PixelCraftUX.showToast('Subscription pricing and usage limits saved live!', 'success');
            }
        } catch (err) {
            PixelCraftUX.showToast(err.message || 'Failed to update plans.', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    // ----------------------------------------------------
    // CUSTOMER SUBSCRIPTIONS
    // ----------------------------------------------------
    async loadSubscriptions(search = '', plan = 'all', status = 'all') {
        const tbody = document.getElementById('admin-subs-tbody');
        if (!tbody) return;

        try {
            const query = `search=${encodeURIComponent(search)}&plan=${plan}&status=${status}`;
            const res = await PixelCraftAPI.admin.subscriptions(query);
            const subs = res.subscriptions || [];

            if (subs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No subscription records found.</td></tr>`;
                return;
            }

            tbody.innerHTML = subs.map(s => {
                const isAutoRenew = !s.cancel_at_period_end;
                const endFormatted = s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : 'Lifetime / None';

                return `
                    <tr>
                        <td>
                            <strong>${s.user_name || 'Customer'}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${s.user_email}</div>
                        </td>
                        <td><span class="badge badge-${s.plan}">${s.plan.toUpperCase()}</span></td>
                        <td>
                            <span class="badge ${s.status === 'active' ? 'badge-pro' : 'badge-free'}">${s.status.toUpperCase()}</span>
                        </td>
                        <td style="font-size: 0.85rem;">${endFormatted}</td>
                        <td>
                            <span style="font-size: 0.85rem; color: ${isAutoRenew ? '#10B981' : '#F59E0B'};">
                                <i class="fa-solid ${isAutoRenew ? 'fa-arrows-rotate' : 'fa-ban'}"></i> ${isAutoRenew ? 'Active' : 'Cancels at end'}
                            </span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 0.4rem;">
                                <button class="btn btn-secondary btn-sm" onclick="PixelCraftAdmin.extendSubscription('${s.id}', 30)" title="Extend 30 Days">
                                    <i class="fa-solid fa-calendar-plus"></i> +30d
                                </button>
                                <button class="btn btn-ghost btn-sm" onclick="PixelCraftAdmin.changeSubscriptionTier('${s.id}', '${s.plan}')" title="Change Plan Tier">
                                    <i class="fa-solid fa-crown"></i>
                                </button>
                                <button class="btn btn-ghost btn-sm" style="color: #EF4444;" onclick="PixelCraftAdmin.cancelSubscription('${s.id}')" title="Cancel Subscription">
                                    <i class="fa-solid fa-circle-xmark"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" style="color: #EF4444; padding: 1rem;">Failed to load subscriptions: ${e.message}</td></tr>`;
        }
    },

    async extendSubscription(id, days = 30) {
        try {
            await PixelCraftAPI.admin.updateSubscription(id, { extendDays: days });
            PixelCraftUX.showToast(`Extended subscription by ${days} days!`, 'success');
            this.loadSubscriptions();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    async changeSubscriptionTier(id, currentPlan) {
        const newPlan = prompt('Change tier to (free, pro, business):', currentPlan);
        if (newPlan && ['free', 'pro', 'business'].includes(newPlan.toLowerCase())) {
            try {
                await PixelCraftAPI.admin.updateSubscription(id, { plan: newPlan.toLowerCase(), status: 'active' });
                PixelCraftUX.showToast(`Subscription tier modified to ${newPlan}!`, 'success');
                this.loadSubscriptions();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    async cancelSubscription(id) {
        const confirmed = confirm('Cancel this subscription at period end? The customer will preserve all their saved projects.');
        if (confirmed) {
            try {
                await PixelCraftAPI.admin.updateSubscription(id, { cancel_at_period_end: true });
                PixelCraftUX.showToast('Subscription set to cancel at period end.', 'info');
                this.loadSubscriptions();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    // ----------------------------------------------------
    // PAYMENT TRANSACTIONS / AUDIT LEDGER
    // ----------------------------------------------------
    async loadTransactions(search = '', status = 'all') {
        const tbody = document.getElementById('admin-tx-tbody');
        if (!tbody) return;

        try {
            const query = `search=${encodeURIComponent(search)}&status=${status}`;
            const res = await PixelCraftAPI.admin.transactions(query);
            const txs = res.transactions || [];

            if (txs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No payment transactions recorded yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = txs.map(t => `
                <tr>
                    <td><code>${t.invoice_num || 'N/A'}</code></td>
                    <td>
                        <strong>${t.user_name || 'Customer'}</strong>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${t.user_email}</div>
                    </td>
                    <td><span class="badge badge-${t.plan}">${(t.plan || 'pro').toUpperCase()}</span></td>
                    <td><strong>₹${(t.amount || 0).toLocaleString('en-IN')}</strong></td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">₹${(t.tax_amount || 0).toLocaleString('en-IN')}</td>
                    <td>
                        ${t.coupon_code ? `<span class="badge" style="background: rgba(121, 87, 255, 0.15); color: #7957FF;">${t.coupon_code}</span>` : '<span style="color: var(--text-muted); font-size: 0.85rem;">None</span>'}
                    </td>
                    <td>
                        <span class="badge ${t.status === 'captured' ? 'badge-pro' : 'badge-free'}" style="${t.status === 'captured' ? 'background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);' : ''}">
                            <i class="fa-solid ${t.status === 'captured' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${(t.status || 'captured').toUpperCase()}
                        </span>
                    </td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">${new Date(t.created_at).toLocaleString()}</td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="8" style="color: #EF4444; padding: 1rem;">Failed to load transactions: ${e.message}</td></tr>`;
        }
    },

    // ----------------------------------------------------
    // COUPONS & DISCOUNTS
    // ----------------------------------------------------
    async loadCoupons() {
        const tbody = document.getElementById('admin-coupons-tbody');
        if (!tbody) return;

        try {
            const res = await PixelCraftAPI.admin.coupons();
            const coupons = res.coupons || [];

            if (coupons.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No coupons configured yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = coupons.map(c => `
                <tr>
                    <td><code>${c.code}</code></td>
                    <td><strong>${c.discountPercent}% OFF</strong></td>
                    <td style="font-size: 0.85rem;">${c.validUntil}</td>
                    <td style="font-size: 0.85rem;"><strong>${c.uses || 0}</strong> / ${c.maxUses || 1000}</td>
                    <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px;">${c.description || '-'}</td>
                    <td>
                        <button class="btn btn-ghost btn-sm" style="color: #EF4444;" onclick="PixelCraftAdmin.deleteCoupon('${c.code}')" title="Delete Coupon">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" style="color: #EF4444; padding: 1rem;">Failed to load coupons: ${e.message}</td></tr>`;
        }
    },

    async saveCoupon(e) {
        if (e && e.preventDefault) e.preventDefault();
        const codeInput = document.getElementById('coupon-code');
        const discInput = document.getElementById('coupon-discount');
        const expInput = document.getElementById('coupon-expiry');
        const maxInput = document.getElementById('coupon-max-uses');
        const descInput = document.getElementById('coupon-desc');

        if (!codeInput || !discInput) return;

        try {
            await PixelCraftAPI.admin.saveCoupon({
                code: codeInput.value.trim().toUpperCase(),
                discountPercent: parseInt(discInput.value, 10),
                validUntil: expInput.value || '2028-12-31',
                maxUses: parseInt(maxInput.value, 10) || 1000,
                description: descInput.value.trim()
            });

            PixelCraftUX.showToast(`Coupon ${codeInput.value.toUpperCase()} saved!`, 'success');
            codeInput.value = '';
            descInput.value = '';
            this.loadCoupons();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    async deleteCoupon(code) {
        const confirmed = confirm(`Are you sure you want to deactivate and remove coupon ${code}?`);
        if (confirmed) {
            try {
                await PixelCraftAPI.admin.deleteCoupon(code);
                PixelCraftUX.showToast(`Coupon ${code} removed.`, 'info');
                this.loadCoupons();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    // ----------------------------------------------------
    // SUPPORT MESSAGES
    // ----------------------------------------------------
    async loadSupport() {
        const tbody = document.getElementById('admin-support-tbody');
        if (!tbody) return;

        try {
            const res = await PixelCraftAPI.admin.support();
            const msgs = res.messages || [];

            if (msgs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No support messages yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = msgs.map(m => `
                <tr>
                    <td><strong>${m.name}</strong><br><small style="color: var(--text-muted);">${m.email}</small></td>
                    <td>${m.subject}</td>
                    <td style="font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.message}</td>
                    <td>
                        <span class="badge ${m.status === 'open' ? 'badge-pro' : 'badge-free'}">${m.status}</span>
                    </td>
                    <td>
                        <select class="form-control" style="padding: 2px 6px; font-size: 0.8rem;" onchange="PixelCraftAdmin.updateTicket('${m.id}', this.value)">
                            <option value="open" ${m.status === 'open' ? 'selected' : ''}>Open</option>
                            <option value="in_progress" ${m.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${m.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                            <option value="closed" ${m.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.warn('Failed to load support:', e);
        }
    },

    async updateTicket(id, status) {
        try {
            await PixelCraftAPI.admin.updateSupport(id, status);
            PixelCraftUX.showToast(`Ticket status set to ${status}!`, 'success');
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    async loadSettings() {
        try {
            const res = await PixelCraftAPI.admin.settings();
            const settings = res.settings || [];
            const maint = settings.find(s => s.key === 'maintenance_mode');
            if (maint) {
                const check = document.getElementById('maint-toggle');
                if (check) check.checked = !!maint.value.enabled;
            }
        } catch (e) {
            console.warn('Settings load error:', e);
        }
    },

    async toggleMaintenance(enabled) {
        try {
            await PixelCraftAPI.admin.updateSetting('maintenance_mode', {
                enabled,
                message: 'PixelCraft is currently undergoing scheduled maintenance.'
            });
            PixelCraftUX.showToast(`Maintenance mode ${enabled ? 'Enabled' : 'Disabled'}.`, 'info');
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    // -------------------------------------------------------------
    // TEMPLATE MARKETPLACE MANAGEMENT
    // -------------------------------------------------------------
    async loadTemplates(search = '', category = 'all', tier = 'all') {
        const tbody = document.getElementById('admin-templates-tbody');
        if (!tbody) return;

        try {
            const queryParams = new URLSearchParams();
            if (category && category !== 'all') queryParams.append('category', category);
            if (tier && tier !== 'all') queryParams.append('tier', tier);
            if (search) queryParams.append('search', search);

            const res = await PixelCraftAPI.templates.list(queryParams.toString());
            const templates = res.templates || [];

            if (templates.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No templates found matching criteria.</td></tr>';
                return;
            }

            tbody.innerHTML = templates.map(t => `
                <tr>
                    <td>
                        <div style="font-weight: 600; color: var(--text-main);">${PixelCraftUX.escapeHtml ? PixelCraftUX.escapeHtml(t.title) : t.title}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">tool: ${t.tool_id}</div>
                    </td>
                    <td><span class="badge" style="text-transform: capitalize;">${t.category}</span></td>
                    <td><span style="font-size: 0.85rem; font-family: monospace; text-transform: uppercase;">${t.format}</span></td>
                    <td>
                        <span class="badge ${t.tier === 'pro' ? 'badge-pro' : 'badge-free'}">
                            ${t.tier === 'pro' ? '<i class="fa-solid fa-crown"></i> PRO' : 'FREE'}
                        </span>
                    </td>
                    <td>
                        <span class="badge" style="background-color: ${t.is_active !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${t.is_active !== false ? '#10B981' : '#EF4444'};">
                            ${t.is_active !== false ? 'Active' : 'Unpublished'}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary btn-sm" onclick="PixelCraftAdmin.toggleTemplateStatus('${t.id}', ${t.is_active !== false})">
                                <i class="fa-solid ${t.is_active !== false ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                            <button class="btn btn-ghost btn-sm" style="color: #EF4444;" onclick="PixelCraftAdmin.deleteTemplate('${t.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.warn('Failed to load templates in admin:', e);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #EF4444; padding: 2rem;">Error: ${e.message}</td></tr>`;
        }
    },

    toggleCreateTemplateForm(show = null) {
        const card = document.getElementById('card-create-template');
        if (!card) return;
        if (show === null) {
            card.style.display = card.style.display === 'none' ? 'block' : 'none';
        } else {
            card.style.display = show ? 'block' : 'none';
        }
        if (card.style.display === 'block') {
            document.getElementById('tpl-title')?.focus();
        }
    },

    async saveTemplate() {
        try {
            const title = document.getElementById('tpl-title').value.trim();
            const tool_id = document.getElementById('tpl-tool').value;
            const category = document.getElementById('tpl-category').value;
            const format = document.getElementById('tpl-format').value;
            const tier = document.getElementById('tpl-tier').value;
            const thumbnail_url = document.getElementById('tpl-thumb').value.trim();
            const configRaw = document.getElementById('tpl-config').value.trim();

            let config = {};
            if (configRaw) {
                try {
                    config = JSON.parse(configRaw);
                } catch {
                    throw new Error('Config JSON is invalid. Please check syntax.');
                }
            }

            await PixelCraftAPI.admin.createTemplate({
                title,
                tool_id,
                category,
                format,
                tier,
                thumbnail_url,
                config,
                is_active: true
            });

            PixelCraftUX.showToast(`Template "${title}" published!`, 'success');
            document.getElementById('form-create-template')?.reset();
            this.toggleCreateTemplateForm(false);
            this.loadTemplates();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    async toggleTemplateStatus(id, currentActive) {
        try {
            await PixelCraftAPI.admin.updateTemplate(id, { is_active: !currentActive });
            PixelCraftUX.showToast(`Template ${!currentActive ? 'published' : 'unpublished'}.`, 'info');
            this.loadTemplates();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    async deleteTemplate(id) {
        if (!confirm('Are you sure you want to delete this template from the marketplace?')) return;
        try {
            await PixelCraftAPI.admin.deleteTemplate(id);
            PixelCraftUX.showToast('Template deleted.', 'success');
            this.loadTemplates();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    // -------------------------------------------------------------
    // COMMUNITY & ROADMAP MODERATION
    // -------------------------------------------------------------
    async loadFeatureRequests() {
        const tbody = document.getElementById('admin-feedback-tbody');
        if (!tbody) return;

        try {
            const res = await PixelCraftAPI.community.featureRequests();
            const requests = res.requests || [];

            if (requests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No community feature requests submitted yet.</td></tr>';
                return;
            }

            tbody.innerHTML = requests.map(r => `
                <tr>
                    <td style="max-width: 320px;">
                        <div style="font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem;">${PixelCraftUX.escapeHtml ? PixelCraftUX.escapeHtml(r.title) : r.title}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${PixelCraftUX.escapeHtml ? PixelCraftUX.escapeHtml(r.description) : r.description}</div>
                    </td>
                    <td><span class="badge" style="text-transform: capitalize;">${r.category}</span></td>
                    <td>
                        <span style="font-weight: 700; color: var(--primary-color);"><i class="fa-solid fa-arrow-up"></i> ${r.votes_count || 0}</span>
                    </td>
                    <td>
                        <select class="form-control" style="font-size: 0.8rem; padding: 0.3rem 0.5rem; width: 130px;" onchange="PixelCraftAdmin.updateFeatureRequestStatus('${r.id}', this.value)">
                            <option value="open" ${r.status === 'open' ? 'selected' : ''}>Open</option>
                            <option value="under_review" ${r.status === 'under_review' ? 'selected' : ''}>Under Review</option>
                            <option value="planned" ${r.status === 'planned' ? 'selected' : ''}>Planned</option>
                            <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-ghost btn-sm" style="color: #EF4444;" onclick="PixelCraftAdmin.deleteFeatureRequest('${r.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            console.warn('Failed to load community feedback:', e);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #EF4444; padding: 2rem;">Error: ${e.message}</td></tr>`;
        }
    },

    async updateFeatureRequestStatus(id, status) {
        try {
            await PixelCraftAPI.admin.updateFeatureRequest(id, status);
            PixelCraftUX.showToast(`Request status updated to ${status}.`, 'success');
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
            this.loadFeatureRequests();
        }
    },

    async deleteFeatureRequest(id) {
        if (!confirm('Are you sure you want to remove this feature request?')) return;
        try {
            await PixelCraftAPI.admin.deleteFeatureRequest(id);
            PixelCraftUX.showToast('Feature request removed.', 'success');
            this.loadFeatureRequests();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    async publishChangelog() {
        try {
            const version = document.getElementById('cl-version').value.trim();
            const title = document.getElementById('cl-title').value.trim();
            const addedRaw = document.getElementById('cl-added').value.trim();
            const improvedRaw = document.getElementById('cl-improved').value.trim();
            const fixedRaw = document.getElementById('cl-fixed').value.trim();

            const parseLines = (raw) => raw ? raw.split('\n').map(s => s.trim()).filter(Boolean) : [];

            await PixelCraftAPI.community.addChangelog({
                version,
                title,
                added: parseLines(addedRaw),
                improved: parseLines(improvedRaw),
                fixed: parseLines(fixedRaw)
            });

            PixelCraftUX.showToast(`Changelog ${version} published to community!`, 'success');
            document.getElementById('form-publish-changelog')?.reset();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    // -------------------------------------------------------------
    // IN-APP NOTIFICATION BROADCAST
    // -------------------------------------------------------------
    async sendBroadcastNotification() {
        try {
            const title = document.getElementById('bc-title').value.trim();
            const type = document.getElementById('bc-type').value;
            const link_url = document.getElementById('bc-link').value.trim();
            const message = document.getElementById('bc-msg').value.trim();

            if (!confirm(`Broadcast notification "${title}" to all users?`)) return;

            const res = await PixelCraftAPI.admin.broadcastNotification({
                title,
                type,
                link_url,
                message
            });

            PixelCraftUX.showToast(res.message || 'Broadcast delivered successfully!', 'success');
            document.getElementById('form-broadcast-notif')?.reset();
        } catch (err) {
            PixelCraftUX.showToast(err.message, 'error');
        }
    }
};

window.PixelCraftAdmin = PixelCraftAdmin;
