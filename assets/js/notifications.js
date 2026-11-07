/**
 * PixelCraft In-App Notification Center
 * Powers bell icon badge, dropdown notifications list, real-time toasts,
 * mark-as-read actions, and user preference controls.
 */

const PixelCraftNotifications = {
    notifications: [],
    unreadCount: 0,
    isOpen: false,

    async init() {
        if (!PixelCraftAuth || !PixelCraftAuth.isLoggedIn()) return;
        this.renderBellIcon();
        await this.fetchNotifications();
    },

    renderBellIcon() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions || document.getElementById('notif-center-wrap')) return;

        const wrap = document.createElement('div');
        wrap.id = 'notif-center-wrap';
        wrap.style.position = 'relative';
        wrap.style.display = 'inline-block';

        wrap.innerHTML = `
            <button class="btn-icon" id="btn-toggle-notifs" title="Notifications" aria-label="Notifications" style="position: relative;">
                <i class="fa-solid fa-bell"></i>
                <span id="notif-badge-pill" class="badge" style="display: none; position: absolute; top: -4px; right: -4px; background: #EF4444; color: #FFF; font-size: 0.65rem; padding: 2px 5px; border-radius: 999px; min-width: 18px;">0</span>
            </button>
            <div id="notif-dropdown-pane" class="card" style="display: none; position: absolute; top: calc(100% + 10px); right: 0; width: 340px; max-height: 440px; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid var(--border-strong); overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.95rem;"><i class="fa-solid fa-bell" style="color: var(--accent-purple);"></i> Notifications</strong>
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="btn-mark-all-notifs" class="btn btn-ghost btn-sm" style="font-size: 0.75rem; padding: 2px 6px;">Mark all read</button>
                    </div>
                </div>
                <div id="notif-list-container" style="flex: 1; overflow-y: auto; max-height: 350px; padding: 0.5rem 0;">
                    <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 1rem; font-size: 0.85rem;">Loading notifications...</div>
                </div>
            </div>
        `;

        navActions.insertBefore(wrap, navActions.firstChild);

        const toggleBtn = wrap.querySelector('#btn-toggle-notifs');
        const pane = wrap.querySelector('#notif-dropdown-pane');
        const markAllBtn = wrap.querySelector('#btn-mark-all-notifs');

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            this.isOpen = !this.isOpen;
            pane.style.display = this.isOpen ? 'flex' : 'none';
        };

        markAllBtn.onclick = async (e) => {
            e.stopPropagation();
            await this.markAllRead();
        };

        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) {
                this.isOpen = false;
                pane.style.display = 'none';
            }
        });
    },

    async fetchNotifications() {
        try {
            const res = await PixelCraftAPI.notifications.list();
            this.notifications = res.notifications || [];
            this.unreadCount = res.unreadCount || 0;
            this.updateBadge();
            this.renderList();
        } catch (err) {
            console.warn('Failed to fetch notifications:', err);
        }
    },

    updateBadge() {
        const badge = document.getElementById('notif-badge-pill');
        if (!badge) return;
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    },

    renderList() {
        const container = document.getElementById('notif-list-container');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-size: 0.85rem;">
                    <i class="fa-regular fa-bell-slash" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                    No notifications yet.
                </div>
            `;
            return;
        }

        container.innerHTML = this.notifications.map(n => {
            const timeAgo = this.formatTime(n.created_at);
            const isUnread = !n.is_read;
            const bg = isUnread ? 'background: rgba(121, 87, 255, 0.08);' : '';
            const dot = isUnread ? '<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-purple); display: inline-block;"></span>' : '';

            return `
                <div class="notif-item" onclick="PixelCraftNotifications.handleNotifClick('${n.id}', '${n.link_url || ''}')" style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.15s ease; ${bg}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                        <strong style="font-size: 0.85rem; color: var(--text-primary);">${n.title}</strong>
                        <div style="display: flex; align-items: center; gap: 0.35rem;">
                            <span style="font-size: 0.7rem; color: var(--text-muted);">${timeAgo}</span>
                            ${dot}
                        </div>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0 0 0; line-height: 1.35;">${n.message}</p>
                </div>
            `;
        }).join('');
    },

    async handleNotifClick(id, link) {
        try {
            await PixelCraftAPI.notifications.markRead(id);
            const notif = this.notifications.find(n => n.id === id);
            if (notif) notif.is_read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateBadge();
            this.renderList();

            if (link && link !== 'null' && link !== 'undefined') {
                window.location.href = link;
            }
        } catch (e) {
            console.error(e);
        }
    },

    async markAllRead() {
        try {
            await PixelCraftAPI.notifications.markAllRead();
            this.notifications.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateBadge();
            this.renderList();
            PixelCraftUX.showToast('All notifications marked as read.', 'info');
        } catch (e) {
            PixelCraftUX.showToast(e.message, 'error');
        }
    },

    formatTime(isoString) {
        if (!isoString) return '';
        const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PixelCraftNotifications.init();
});

window.PixelCraftNotifications = PixelCraftNotifications;

