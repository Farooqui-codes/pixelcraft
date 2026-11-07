/**
 * PixelCraft User Workspace Controller
 * Real user projects, favorites, recent tools, tier indicators, and bulk actions.
 */

const PixelCraftWorkspace = {
    async init() {
        if (!PixelCraftAuth.requireAuth()) return;

        await this.loadStats();
        await this.loadRecentActivity();
        await this.loadFavorites();
        await this.loadProjects();
    },

    async loadStats() {
        const statsEl = document.getElementById('workspace-stats');
        if (!statsEl) return;

        try {
            const usageRes = await PixelCraftAPI.subscriptions.usage();
            const subRes = await PixelCraftAPI.subscriptions.current();
            const { plan, dailyOperations, projects, storage } = usageRes;
            const sub = subRes.subscription || {};

            let subNotice = '';
            if (plan !== 'free' && sub.current_period_end) {
                const expiryDate = new Date(sub.current_period_end).toLocaleDateString();
                if (sub.cancel_at_period_end) {
                    subNotice = `<span style="font-size: 0.8rem; color: #F59E0B;"><i class="fa-solid fa-clock"></i> Access until ${expiryDate} (Renewal canceled)</span>`;
                } else {
                    subNotice = `<span style="font-size: 0.8rem; color: #10B981;"><i class="fa-solid fa-rotate"></i> Renews on ${expiryDate}</span>`;
                }
            } else {
                subNotice = `<span style="font-size: 0.8rem; color: var(--text-muted);">Starter Free Tier</span>`;
            }

            statsEl.innerHTML = `
                <div class="stats-counter-grid" style="margin-bottom: 1.5rem;">
                    <div class="stat-counter-tile">
                        <div class="stat-counter-val" style="color: var(--brand-purple);">${dailyOperations.used} / ${dailyOperations.limit}</div>
                        <div class="stat-counter-lbl">Daily Operations Used</div>
                        <small style="color: var(--text-muted); font-size: 0.72rem; margin-top: 4px;">${dailyOperations.remaining} actions left today</small>
                    </div>
                    <div class="stat-counter-tile">
                        <div class="stat-counter-val" style="color: #35B9FF;">${projects.used} / ${projects.limit}</div>
                        <div class="stat-counter-lbl">Saved Cloud Projects</div>
                        <small style="color: var(--text-muted); font-size: 0.72rem; margin-top: 4px;">${projects.remaining} slots remaining</small>
                    </div>
                    <div class="stat-counter-tile">
                        <div class="stat-counter-val" style="color: #10B981;">${storage.usedMB} / ${storage.limitMB} MB</div>
                        <div class="stat-counter-lbl">Cloud Storage Capacity</div>
                        <small style="color: var(--text-muted); font-size: 0.72rem; margin-top: 4px;">${storage.remainingMB} MB available</small>
                    </div>
                    <div class="stat-counter-tile">
                        <div class="stat-counter-val text-gradient" style="text-transform: uppercase;">${plan}</div>
                        <div class="stat-counter-lbl">Current Subscription</div>
                        <div style="margin-top: 4px;">${subNotice}</div>
                    </div>
                </div>

                <!-- SUBSCRIPTION QUICK ACTIONS -->
                <div class="card" style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; border-color: var(--border-subtle);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span class="badge ${plan === 'business' ? 'badge-business' : plan === 'pro' ? 'badge-pro' : 'badge-free'}">${plan.toUpperCase()}</span>
                        <div>
                            <strong>Subscription & Billing Management</strong>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">Manage your active tier, payment invoices, and billing lifecycle.</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="btn btn-secondary btn-sm" onclick="PixelCraftWorkspace.openInvoicesModal()"><i class="fa-solid fa-receipt"></i> Payment History</button>
                        ${plan === 'free' ? `
                            <a href="/pricing.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-bolt"></i> Upgrade to Pro</a>
                        ` : `
                            <button class="btn btn-secondary btn-sm" onclick="PixelCraftWorkspace.openManageSubscriptionModal()"><i class="fa-solid fa-gear"></i> Manage Plan</button>
                        `}
                    </div>
                </div>
            `;
        } catch (e) {
            console.warn('Could not fetch workspace stats:', e);
        }
    },

    async loadActivityStats() {
        const statsWrap = document.getElementById('activity-stats-summary');
        const calWrap = document.getElementById('activity-calendar-heatmap');
        const projWrap = document.getElementById('activity-recent-projects');
        if (!statsWrap && !calWrap) return;

        try {
            const res = await PixelCraftAPI.tools.activityStats();
            const { stats } = res;

            if (statsWrap && stats) {
                statsWrap.innerHTML = `
                    <div class="stats-counter-grid" style="margin-bottom: 2rem;">
                        <div class="stat-counter-tile">
                            <div class="stat-counter-val" style="color: var(--accent-purple);">${stats.totalExecutions || 0}</div>
                            <div class="stat-counter-lbl">Total Tool Runs</div>
                        </div>
                        <div class="stat-counter-tile">
                            <div class="stat-counter-val" style="color: var(--brand-blue);">${stats.totalProjects || 0}</div>
                            <div class="stat-counter-lbl">Saved Projects</div>
                        </div>
                        <div class="stat-counter-tile">
                            <div class="stat-counter-val" style="color: #10B981; text-transform: capitalize;">${stats.topCategory || 'General'}</div>
                            <div class="stat-counter-lbl">Top Studio</div>
                        </div>
                    </div>
                `;
            }

            if (calWrap && stats && stats.calendar) {
                const dates = Object.entries(stats.calendar);
                calWrap.innerHTML = `
                    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
                        <h4 style="font-size: 1.05rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-calendar-days" style="color: var(--accent-purple);"></i> 30-Day Activity Heatmap</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">Daily tool operations recorded on your account over the last 30 days.</p>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            ${dates.map(([date, count]) => {
                                let bg = 'rgba(255, 255, 255, 0.05)';
                                if (count > 5) bg = '#7957FF';
                                else if (count > 2) bg = '#35B9FF';
                                else if (count > 0) bg = '#10B981';
                                return `<div title="${date}: ${count} operations" style="width: 18px; height: 18px; border-radius: 3px; background: ${bg}; cursor: pointer; transition: transform 0.15s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='none'"></div>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            if (projWrap && stats && stats.recentProjects) {
                if (stats.recentProjects.length === 0) {
                    projWrap.innerHTML = `<div class="card" style="padding: 1.5rem; color: var(--text-muted); text-align: center;">No project edits recorded yet.</div>`;
                } else {
                    projWrap.innerHTML = `
                        <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
                            <h4 style="font-size: 1.05rem; margin-bottom: 1rem;"><i class="fa-solid fa-file-pen" style="color: var(--brand-blue);"></i> Recently Edited Projects</h4>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${stats.recentProjects.map(p => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
                                        <div>
                                            <strong>${p.title}</strong>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(p.updated_at).toLocaleString()}</div>
                                        </div>
                                        <a href="/tool.html?id=${p.tool_id}&project_id=${p.id}" class="btn btn-secondary btn-sm"><i class="fa-solid fa-pen-to-square"></i> Resume</a>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.warn('Failed to load activity stats:', err);
        }
    },

    async clearHistory() {
        const confirmed = confirm('Are you sure you want to clear your tool activity history? Saved projects and subscriptions will not be affected.');
        if (confirmed) {
            try {
                await PixelCraftAPI.tools.clearHistory();
                PixelCraftUX.showToast('Activity history cleared securely.', 'success');
                this.loadRecentActivity();
                this.loadActivityStats();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    async loadRecentActivity() {
        const container = document.getElementById('recent-tools-grid');
        if (!container) return;

        try {
            const res = await PixelCraftAPI.tools.recentActivity();
            if (!res.recent || res.recent.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 2rem;">
                        <i class="fa-solid fa-clock-rotate-left empty-state-icon"></i>
                        <p>No recent tool activity recorded yet. Launch any of our 30 tools to get started!</p>
                        <a href="/tools.html" class="btn btn-secondary btn-sm" style="margin-top: 0.75rem;">Explore Tools</a>
                    </div>
                `;
                return;
            }

            container.innerHTML = res.recent.slice(0, 4).map(item => `
                <div class="card card-interactive" onclick="window.location.href='/tool.html?id=${item.tool_id}'">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                        <div style="width: 38px; height: 38px; border-radius: var(--radius-sm); background: rgba(121, 87, 255, 0.1); color: var(--brand-purple); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                            <i class="fa-solid ${item.tool.icon || 'fa-wrench'}"></i>
                        </div>
                        <div>
                            <strong style="font-size: 0.95rem;">${item.tool.name}</strong>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(item.last_used).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <span class="badge cat-${item.tool.category || 'image'}">${item.tool.categoryName || 'Studio'}</span>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = `<p style="color: var(--text-muted);">Failed to load recent activity.</p>`;
        }
    },

    async loadFavorites() {
        const container = document.getElementById('favorite-tools-grid');
        if (!container) return;

        try {
            const res = await PixelCraftAPI.favorites.list();
            const favoriteIds = res.favorites || [];
            if (favoriteIds.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 2rem;">
                        <i class="fa-solid fa-star empty-state-icon"></i>
                        <p>You haven't bookmarked any favorite tools yet. Click the star icon on any tool card!</p>
                    </div>
                `;
                return;
            }

            const tools = (window.PIXELCRAFT_TOOLS || []).filter(t => favoriteIds.includes(t.id));
            container.innerHTML = tools.map(t => `
                <div class="card card-interactive" onclick="window.location.href='/tool.html?id=${t.id}'">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <i class="fa-solid ${t.icon}" style="font-size: 1.4rem; color: ${t.accentColor};"></i>
                        <button class="btn-ghost" style="padding: 2px 6px; color: #F59E0B;" onclick="event.stopPropagation(); PixelCraftWorkspace.toggleFavorite('${t.id}', this);"><i class="fa-solid fa-star"></i></button>
                    </div>
                    <strong>${t.name}</strong>
                    <p style="font-size: 0.8rem; margin-top: 0.35rem;">${t.description.substring(0, 60)}...</p>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = `<p style="color: var(--text-muted);">Failed to load favorites.</p>`;
        }
    },

    async toggleFavorite(toolId, btnEl) {
        // Optimistic UI update
        const isStar = btnEl.querySelector('i').classList.contains('fa-solid');
        btnEl.innerHTML = isStar ? '<i class="fa-regular fa-star"></i>' : '<i class="fa-solid fa-star"></i>';

        try {
            const res = await PixelCraftAPI.favorites.toggle(toolId);
            PixelCraftUX.showToast(res.message, 'success');
        } catch (err) {
            // Rollback optimistic update
            btnEl.innerHTML = isStar ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
            PixelCraftUX.showToast(err.message, 'error');
        }
    },

    async loadProjects(category = 'all', search = '') {
        const container = document.getElementById('projects-list-container');
        if (!container) return;

        PixelCraftUX.renderSkeletons(container, 3, 'card');

        try {
            const query = `category=${category}&search=${encodeURIComponent(search)}`;
            const res = await PixelCraftAPI.projects.list(query);
            const projects = res.projects || [];

            if (projects.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 3rem;">
                        <i class="fa-solid fa-folder-open empty-state-icon"></i>
                        <h4>No Saved Projects Found</h4>
                        <p>Create and save designs, invoices, and invites in any tool to access them here anytime.</p>
                        <a href="/tools.html" class="btn btn-primary" style="margin-top: 1rem;">Start Creating</a>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${projects.map(p => `
                        <div class="card" style="display: flex; flex-direction: column; overflow: hidden; padding: 0;">
                            <div style="height: 140px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                ${p.thumbnail_data ? `<img src="${p.thumbnail_data}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid fa-file-code" style="font-size: 2.5rem; color: var(--text-muted);"></i>`}
                            </div>
                            <div style="padding: 1.25rem; flex: 1; display: flex; flex-direction: column;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                                    <strong style="font-size: 1.05rem;">${p.title}</strong>
                                    <span class="badge cat-${p.category}">${p.category}</span>
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                                    Updated ${new Date(p.updated_at).toLocaleDateString()} • v${p.version || 1}
                                </div>
                                <div style="margin-top: auto; display: flex; gap: 0.4rem; flex-wrap: wrap;">
                                    <a href="/tool.html?id=${p.tool_id}&project_id=${p.id}" class="btn btn-primary btn-sm" style="flex: 1;"><i class="fa-solid fa-pen-to-square"></i> Open</a>
                                    <button class="btn btn-secondary btn-sm" title="Rename" onclick="PixelCraftWorkspace.renameProject('${p.id}', '${p.title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-i-cursor"></i></button>
                                    <button class="btn btn-secondary btn-sm" title="Duplicate" onclick="PixelCraftWorkspace.duplicateProject('${p.id}')"><i class="fa-solid fa-clone"></i></button>
                                    <button class="btn btn-secondary btn-sm" title="${p.is_public ? 'Public Link' : 'Share Link'}" onclick="PixelCraftWorkspace.shareProject('${p.id}', ${!!p.is_public})"><i class="fa-solid ${p.is_public ? 'fa-globe' : 'fa-share-nodes'}"></i></button>
                                    <button class="btn btn-ghost btn-sm" title="Delete" style="color: #EF4444;" onclick="PixelCraftWorkspace.deleteProject('${p.id}', '${p.title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            container.innerHTML = `<p style="color: #EF4444;">Failed to load projects: ${e.message}</p>`;
        }
    },

    async duplicateProject(id) {
        try {
            await PixelCraftAPI.projects.duplicate(id);
            PixelCraftUX.showToast('Project duplicated successfully!', 'success');
            this.loadProjects();
        } catch (err) {
            if (err.data && err.data.requiresUpgrade) {
                PixelCraftUX.showUpgradeModal('Additional Project Storage');
            } else {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    async deleteProject(id, title) {
        const confirmed = await PixelCraftUX.confirmDestructive({
            title: 'Delete Project?',
            message: `Are you sure you want to permanently delete "${title}"? This cannot be undone.`
        });

        if (confirmed) {
            try {
                await PixelCraftAPI.projects.delete(id);
                PixelCraftUX.showToast('Project deleted.', 'success');
                this.loadProjects();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    async renameProject(id, currentTitle) {
        const newTitle = prompt('Rename project:', currentTitle);
        if (newTitle && newTitle.trim() && newTitle.trim() !== currentTitle) {
            try {
                await PixelCraftAPI.projects.update(id, { title: newTitle.trim() });
                PixelCraftUX.showToast('Project renamed!', 'success');
                this.loadProjects();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    async shareProject(id, isPublic) {
        const action = isPublic ? 'Disable Public Sharing' : 'Enable Public Sharing';
        const confirmed = confirm(`${action} for this project? Anyone with the shareable link will be able to view it.`);
        if (confirmed) {
            try {
                await PixelCraftAPI.projects.update(id, { is_public: !isPublic });
                const shareUrl = `${window.location.origin}/tool.html?id=view&publicId=${id}`;
                if (!isPublic) {
                    await navigator.clipboard.writeText(shareUrl).catch(() => {});
                    PixelCraftUX.showToast('Public shareable link copied to clipboard!', 'success');
                } else {
                    PixelCraftUX.showToast('Project is now private.', 'info');
                }
                this.loadProjects();
            } catch (err) {
                PixelCraftUX.showToast(err.message, 'error');
            }
        }
    },

    async openBrandKitModal() {
        let kit = await PixelCraftBrandKit.load();
        if (!kit) kit = {};

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.innerHTML = `
            <div class="modal-dialog" style="max-width: 580px;">
                <div class="modal-header">
                    <h4><i class="fa-solid fa-palette" style="color: var(--accent-purple);"></i> Brand Kit Studio</h4>
                    <button class="btn-icon" id="brandkit-modal-close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body" style="padding: 1.5rem; max-height: 80vh; overflow-y: auto;">
                    <form id="brandkit-form">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Brand / Business Name</label>
                            <input type="text" id="bk-name" class="form-control" value="${kit.brand_name || ''}" placeholder="e.g. Acme Studio" required>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Primary Color</label>
                                <input type="color" id="bk-primary" class="form-control" value="${kit.primary_color || '#7957FF'}" style="height: 40px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Secondary</label>
                                <input type="color" id="bk-secondary" class="form-control" value="${kit.secondary_color || '#35B9FF'}" style="height: 40px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Accent</label>
                                <input type="color" id="bk-accent" class="form-control" value="${kit.accent_color || '#101426'}" style="height: 40px;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Brand Typography Font</label>
                            <select id="bk-font" class="form-control">
                                <option value="Inter" ${kit.font_family === 'Inter' ? 'selected' : ''}>Inter (Modern Clean)</option>
                                <option value="Plus Jakarta Sans" ${kit.font_family === 'Plus Jakarta Sans' ? 'selected' : ''}>Plus Jakarta Sans (Tech/SaaS)</option>
                                <option value="Playfair Display" ${kit.font_family === 'Playfair Display' ? 'selected' : ''}>Playfair Display (Luxury Serif)</option>
                                <option value="Space Grotesk" ${kit.font_family === 'Space Grotesk' ? 'selected' : ''}>Space Grotesk (Creative)</option>
                            </select>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Business Email</label>
                                <input type="email" id="bk-email" class="form-control" value="${kit.business_email || ''}" placeholder="contact@brand.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Business Phone</label>
                                <input type="text" id="bk-phone" class="form-control" value="${kit.business_phone || ''}" placeholder="+91 98765 43210">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Address / Tax Location</label>
                            <input type="text" id="bk-address" class="form-control" value="${kit.business_address || ''}" placeholder="Mumbai, Maharashtra, India">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
                            <div class="form-group">
                                <label class="form-label">Website</label>
                                <input type="url" id="bk-website" class="form-control" value="${kit.website || ''}" placeholder="https://mybrand.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Social Handle</label>
                                <input type="text" id="bk-social" class="form-control" value="${kit.social_handle || ''}" placeholder="@mybrand">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            <i class="fa-solid fa-floppy-disk"></i> Save Brand Kit
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#brandkit-modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.querySelector('#brandkit-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                await PixelCraftBrandKit.save({
                    brand_name: modal.querySelector('#bk-name').value,
                    primary_color: modal.querySelector('#bk-primary').value,
                    secondary_color: modal.querySelector('#bk-secondary').value,
                    accent_color: modal.querySelector('#bk-accent').value,
                    font_family: modal.querySelector('#bk-font').value,
                    business_email: modal.querySelector('#bk-email').value,
                    business_phone: modal.querySelector('#bk-phone').value,
                    business_address: modal.querySelector('#bk-address').value,
                    website: modal.querySelector('#bk-website').value,
                    social_handle: modal.querySelector('#bk-social').value
                });
                modal.remove();
            } catch (err) {}
        };
    },

    async openManageSubscriptionModal() {
        try {
            const subRes = await PixelCraftAPI.subscriptions.current();
            const { plan, subscription } = subRes;

            const modal = document.createElement('div');
            modal.className = 'modal-backdrop active';
            modal.innerHTML = `
                <div class="modal-dialog" style="max-width: 500px;">
                    <div class="modal-header">
                        <h4>Manage Subscription</h4>
                        <button class="btn-icon" id="sub-modal-close"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body" style="padding: 1.5rem;">
                        <div style="background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 1.25rem; margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <strong style="font-size: 1.1rem;">Plan: ${plan.toUpperCase()}</strong>
                                <span class="badge ${plan === 'business' ? 'badge-business' : 'badge-pro'}">${subscription.status ? subscription.status.toUpperCase() : 'ACTIVE'}</span>
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                ${subscription.current_period_end ? `Period Ends: ${new Date(subscription.current_period_end).toLocaleDateString()}` : 'Monthly Subscription'}
                            </div>
                            <div style="font-size: 0.85rem; color: ${subscription.cancel_at_period_end ? '#F59E0B' : '#10B981'};">
                                ${subscription.cancel_at_period_end ? '⚠️ Auto-renewal is currently canceled. Access remains active until period end.' : '✓ Auto-renewal is active.'}
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${plan === 'pro' ? `
                                <a href="/pricing.html?plan=business" class="btn btn-primary"><i class="fa-solid fa-arrow-up"></i> Upgrade to Business (₹399/mo)</a>
                            ` : ''}

                            ${subscription.cancel_at_period_end ? `
                                <button class="btn btn-secondary" id="btn-reactivate-sub"><i class="fa-solid fa-rotate-right"></i> Reactivate Auto-Renewal</button>
                            ` : `
                                <button class="btn btn-ghost" id="btn-cancel-sub" style="color: #EF4444;"><i class="fa-solid fa-ban"></i> Cancel Auto-Renewal</button>
                            `}
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#sub-modal-close').onclick = () => modal.remove();

            const cancelBtn = modal.querySelector('#btn-cancel-sub');
            if (cancelBtn) {
                cancelBtn.onclick = async () => {
                    const confirmed = await PixelCraftUX.confirmDestructive({
                        title: 'Cancel Auto-Renewal?',
                        message: 'Your subscription will remain active until the end of the current billing cycle. All your saved projects and files will be permanently preserved and never deleted.',
                        confirmText: 'Confirm Cancellation',
                        cancelText: 'Keep Subscription'
                    });

                    if (confirmed) {
                        try {
                            const res = await PixelCraftAPI.subscriptions.cancel();
                            PixelCraftUX.showToast(res.message, 'success');
                            modal.remove();
                            PixelCraftWorkspace.loadStats();
                        } catch (err) {
                            PixelCraftUX.showToast(err.message, 'error');
                        }
                    }
                };
            }

            const reactivateBtn = modal.querySelector('#btn-reactivate-sub');
            if (reactivateBtn) {
                reactivateBtn.onclick = async () => {
                    try {
                        const res = await PixelCraftAPI.subscriptions.reactivate();
                        PixelCraftUX.showToast(res.message, 'success');
                        modal.remove();
                        PixelCraftWorkspace.loadStats();
                    } catch (err) {
                        PixelCraftUX.showToast(err.message, 'error');
                    }
                };
            }
        } catch (e) {
            PixelCraftUX.showToast('Failed to load subscription details: ' + e.message, 'error');
        }
    },

    async openInvoicesModal() {
        try {
            const res = await PixelCraftAPI.subscriptions.invoices();
            const invoices = res.invoices || [];

            const modal = document.createElement('div');
            modal.className = 'modal-backdrop active';
            modal.innerHTML = `
                <div class="modal-dialog" style="max-width: 650px;">
                    <div class="modal-header">
                        <h4><i class="fa-solid fa-receipt"></i> Payment History & Invoices</h4>
                        <button class="btn-icon" id="invoices-close-btn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body" style="padding: 1.5rem; max-height: 480px; overflow-y: auto;">
                        ${invoices.length === 0 ? `
                            <div class="empty-state" style="padding: 2rem;">
                                <i class="fa-solid fa-file-invoice empty-state-icon"></i>
                                <p>No billing invoices recorded yet.</p>
                            </div>
                        ` : `
                            <table class="data-table" style="font-size: 0.85rem;">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Invoice #</th>
                                        <th>Plan</th>
                                        <th>Amount</th>
                                        <th>Receipt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${invoices.map(inv => `
                                        <tr>
                                            <td>${new Date(inv.date).toLocaleDateString()}</td>
                                            <td><code>${inv.invoiceNum}</code></td>
                                            <td><span class="badge ${inv.plan === 'business' ? 'badge-business' : 'badge-pro'}">${inv.plan.toUpperCase()}</span></td>
                                            <td>₹${parseFloat(inv.amount).toFixed(2)}</td>
                                            <td>
                                                <button class="btn btn-secondary btn-sm" onclick="PixelCraftWorkspace.viewReceipt('${inv.orderId}')">
                                                    <i class="fa-solid fa-download"></i> View
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#invoices-close-btn').onclick = () => modal.remove();
        } catch (e) {
            PixelCraftUX.showToast('Failed to load invoices: ' + e.message, 'error');
        }
    },

    async viewReceipt(orderId) {
        try {
            const res = await PixelCraftAPI.subscriptions.receipt(orderId);
            const r = res.receipt;

            const modal = document.createElement('div');
            modal.className = 'modal-backdrop active';
            modal.innerHTML = `
                <div class="modal-dialog" style="max-width: 540px;">
                    <div class="modal-header">
                        <h4>Tax Invoice & Receipt</h4>
                        <button class="btn-icon" onclick="this.closest('.modal-backdrop').remove()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body" style="padding: 1.75rem; font-size: 0.9rem;" id="receipt-print-area">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
                            <div>
                                <img src="/assets/logos/logo.svg" alt="PixelCraft" style="height: 32px; margin-bottom: 0.5rem;">
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${r.seller.name}<br>${r.seller.address}<br>Tax ID: ${r.seller.taxId}</div>
                            </div>
                            <div style="text-align: right;">
                                <strong style="font-size: 1.1rem; color: var(--brand-purple);">${r.invoiceNum}</strong>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(r.date).toLocaleDateString()}</div>
                                <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; margin-top: 4px;">PAID</span>
                            </div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <small style="color: var(--text-muted); font-weight: 600;">BILLED TO:</small>
                            <div style="font-weight: 700;">${r.customerName}</div>
                            <div>${r.customerEmail}</div>
                            ${r.companyName ? `<div>${r.companyName}</div>` : ''}
                        </div>

                        <div style="background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 1rem; margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>PixelCraft ${r.planName} Plan (Monthly)</span>
                                <span>₹${r.baseAmount}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">
                                <span>Integrated GST (18%)</span>
                                <span>₹${r.taxAmount}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.15rem; border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
                                <span>Total Paid</span>
                                <span>₹${parseFloat(r.amount).toFixed(2)}</span>
                            </div>
                        </div>

                        <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Receipt</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (e) {
            PixelCraftUX.showToast('Could not load receipt: ' + e.message, 'error');
        }
    }
};

window.PixelCraftWorkspace = PixelCraftWorkspace;

