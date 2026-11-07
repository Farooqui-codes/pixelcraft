/**
 * PixelCraft Brand Kit Client Studio
 * Centralizes corporate branding assets (Logos, Color Palettes, Typography,
 * and Social Handles) with 1-click injection into tools.
 */

const PixelCraftBrandKit = {
    data: null,
    permissions: null,

    async load() {
        if (!PixelCraftAuth || !PixelCraftAuth.isLoggedIn()) return null;
        try {
            const res = await PixelCraftAPI.brandKit.get();
            this.data = res.brandKit || {};
            this.permissions = res.permissions || {};
            return this.data;
        } catch (err) {
            console.warn('Failed to load brand kit:', err);
            return null;
        }
    },

    async save(brandData) {
        try {
            const res = await PixelCraftAPI.brandKit.update(brandData);
            this.data = res.brandKit;
            PixelCraftUX.showToast('Brand Kit updated successfully!', 'success');
            return res.brandKit;
        } catch (err) {
            PixelCraftUX.showToast(err.message || 'Failed to save brand kit.', 'error');
            throw err;
        }
    },

    // Inject into Invoice / Quotation / Business Tools
    attachApplyButton(container, toolId, callback) {
        if (!container) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-secondary btn-sm';
        btn.style.width = '100%';
        btn.style.marginBottom = '0.75rem';
        btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" style="color: var(--accent-purple);"></i> Apply Brand Kit`;

        btn.onclick = async () => {
            if (!PixelCraftAuth.isLoggedIn()) {
                PixelCraftUX.showToast('Please log in to apply your saved Brand Kit.', 'info');
                return;
            }

            if (!this.data) {
                await this.load();
            }

            if (!this.data || !this.data.brand_name) {
                PixelCraftUX.showToast('No Brand Kit found. Set up your Brand Kit in Workspace or Settings.', 'warning');
                return;
            }

            callback(this.data);
            PixelCraftUX.showToast(`Applied "${this.data.brand_name}" branding!`, 'success');
        };

        container.insertBefore(btn, container.firstChild);
    }
};

window.PixelCraftBrandKit = PixelCraftBrandKit;

