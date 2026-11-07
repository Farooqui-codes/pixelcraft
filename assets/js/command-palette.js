/**
 * PixelCraft Global Search & Command Palette (Ctrl+K / Cmd+K)
 * Universal keyboard-driven navigation across all 30 tools, categories, pages,
 * quick actions, and authenticated saved projects.
 */

(function () {
    let backdrop = null;
    let input = null;
    let list = null;
    let clearBtn = null;
    let selectedIndex = 0;
    let currentResults = [];
    let asyncProjects = [];

    const QUICK_PAGES = [
        { name: 'All 30 Tools Catalog', url: '/tools.html', icon: 'fa-toolbox', category: 'Pages' },
        { name: 'User Workspace', url: '/workspace.html', icon: 'fa-house-laptop', category: 'Pages' },
        { name: 'My Saved Projects', url: '/projects.html', icon: 'fa-folder-open', category: 'Pages' },
        { name: 'Favorite Tools', url: '/favorites.html', icon: 'fa-star', category: 'Pages' },
        { name: 'Recent Tool Activity', url: '/activity.html', icon: 'fa-clock-rotate-left', category: 'Pages' },
        { name: 'Pricing & Plans', url: '/pricing.html', icon: 'fa-tags', category: 'Pages' },
        { name: 'User Profile', url: '/profile.html', icon: 'fa-user-gear', category: 'Pages' },
        { name: 'Account Settings', url: '/settings.html', icon: 'fa-sliders', category: 'Pages' },
        { name: 'About PixelCraft', url: '/about.html', icon: 'fa-circle-info', category: 'Pages' },
        { name: 'Contact & Support', url: '/contact.html', icon: 'fa-envelope', category: 'Pages' },
        { name: 'Help Centre & FAQs', url: '/help.html', icon: 'fa-circle-question', category: 'Pages' },
        { name: 'Referral Program', url: '/referral.html', icon: 'fa-gift', category: 'Pages' }
    ];

    const STUDIO_CATEGORIES = [
        { name: 'Image Studio (5 Tools)', url: '/category.html?cat=image', icon: 'fa-image', color: 'var(--accent-image)', desc: 'Compress, resize, crop, convert & sample' },
        { name: 'PDF Studio (5 Tools)', url: '/category.html?cat=pdf', icon: 'fa-file-pdf', color: 'var(--accent-pdf)', desc: 'Merge, split, compress & convert PDFs' },
        { name: 'Creator Studio (4 Tools)', url: '/category.html?cat=creator', icon: 'fa-wand-magic-sparkles', color: 'var(--accent-creator)', desc: 'Instagram, YouTube graphics & captions' },
        { name: 'Business Studio (4 Tools)', url: '/category.html?cat=business', icon: 'fa-briefcase', color: 'var(--accent-business)', desc: 'Invoices, quotations, GST & visiting cards' },
        { name: 'QR Studio (4 Tools)', url: '/category.html?cat=qr', icon: 'fa-qrcode', color: 'var(--accent-qr)', desc: 'URL, WhatsApp, Wi-Fi & UPI QR codes' },
        { name: 'Invitation Studio (3 Tools)', url: '/category.html?cat=invitation', icon: 'fa-envelope-open-text', color: 'var(--accent-invitation)', desc: 'Wedding, Birthday & Islamic cards' },
        { name: 'Text Studio (3 Tools)', url: '/category.html?cat=text', icon: 'fa-font', color: 'var(--accent-text)', desc: 'Word count, casing & dummy text' },
        { name: 'Developer Studio (2 Tools)', url: '/category.html?cat=developer', icon: 'fa-code', color: 'var(--accent-developer)', desc: 'JSON formatting & Base64 encoder' }
    ];

    function createPaletteDOM() {
        backdrop = document.createElement('div');
        backdrop.className = 'cmd-palette-backdrop';
        backdrop.innerHTML = `
            <div class="cmd-palette-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">
                <div class="cmd-search-wrap">
                    <i class="fa-solid fa-magnifying-glass" style="color: var(--text-muted); font-size: 1.1rem;"></i>
                    <input type="text" class="cmd-search-input" placeholder="Type a tool name, studio, page or command..." autocomplete="off" spellcheck="false">
                    <button type="button" class="btn-ghost cmd-clear-btn" style="display: none; padding: 2px 6px; font-size: 0.9rem;" title="Clear search"><i class="fa-solid fa-xmark"></i></button>
                    <kbd class="cmd-shortcut-badge">ESC to close</kbd>
                </div>
                <ul class="cmd-results-list" role="listbox"></ul>
                <div class="cmd-footer">
                    <span><kbd class="cmd-shortcut-badge">↑</kbd> <kbd class="cmd-shortcut-badge">↓</kbd> to navigate</span>
                    <span><kbd class="cmd-shortcut-badge">↵</kbd> to select</span>
                    <span><kbd class="cmd-shortcut-badge">ESC</kbd> to close</span>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);

        input = backdrop.querySelector('.cmd-search-input');
        list = backdrop.querySelector('.cmd-results-list');
        clearBtn = backdrop.querySelector('.cmd-clear-btn');

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closePalette();
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            selectedIndex = 0;
            renderResults('');
            input.focus();
        });

        const debouncedSearch = PixelCraftUX.debounce((val) => {
            selectedIndex = 0;
            renderResults(val);
            if (val && PixelCraftAuth && PixelCraftAuth.isLoggedIn()) {
                fetchUserProjects(val);
            }
        }, 180);

        input.addEventListener('input', (e) => {
            const val = e.target.value.trim().toLowerCase();
            clearBtn.style.display = val ? 'inline-flex' : 'none';
            debouncedSearch(val);
        });

        input.addEventListener('keydown', handleKeyNav);
    }

    async function fetchUserProjects(query) {
        try {
            const res = await PixelCraftAPI.projects.list(`search=${encodeURIComponent(query)}&limit=4`);
            if (res.success && res.projects) {
                asyncProjects = res.projects;
                renderResults(query);
            }
        } catch (e) {
            // Ignore background search errors
        }
    }

    function openPalette() {
        if (!backdrop) createPaletteDOM();
        backdrop.classList.add('active');
        input.value = '';
        clearBtn.style.display = 'none';
        selectedIndex = 0;
        asyncProjects = [];
        renderResults('');
        setTimeout(() => input.focus(), 60);
    }

    function closePalette() {
        if (backdrop) backdrop.classList.remove('active');
    }

    function getCatalog() {
        return window.PIXELCRAFT_TOOLS || [];
    }

    function highlightMatch(text, query) {
        if (!query || !text) return text;
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        return `${before}<mark style="background: rgba(121, 87, 255, 0.35); color: inherit; padding: 0 2px; border-radius: 2px;">${match}</mark>${after}`;
    }

    function renderResults(query) {
        list.innerHTML = '';
        const tools = getCatalog();

        let matchedTools = tools;
        let matchedCategories = STUDIO_CATEGORIES;
        let matchedPages = QUICK_PAGES;

        if (query) {
            matchedTools = tools.filter(t => 
                t.name.toLowerCase().includes(query) || 
                t.categoryName.toLowerCase().includes(query) ||
                (t.keywords && t.keywords.some(k => k.toLowerCase().includes(query)))
            );

            matchedCategories = STUDIO_CATEGORIES.filter(c => 
                c.name.toLowerCase().includes(query) || 
                c.desc.toLowerCase().includes(query)
            );

            matchedPages = QUICK_PAGES.filter(p => p.name.toLowerCase().includes(query));
        }

        currentResults = [];

        // 1. Studio Categories
        if (matchedCategories.length > 0) {
            const groupTitle = document.createElement('li');
            groupTitle.className = 'cmd-result-group-title';
            groupTitle.textContent = 'Studios';
            list.appendChild(groupTitle);

            matchedCategories.slice(0, 3).forEach(cat => {
                currentResults.push({ type: 'category', data: cat });
            });
        }

        // 2. Tools
        if (matchedTools.length > 0) {
            const groupTitle = document.createElement('li');
            groupTitle.className = 'cmd-result-group-title';
            groupTitle.textContent = 'Tools';
            list.appendChild(groupTitle);

            matchedTools.slice(0, 8).forEach(tool => {
                currentResults.push({ type: 'tool', data: tool });
            });
        }

        // 3. User Saved Projects (if any match query)
        if (asyncProjects.length > 0 && query) {
            const groupTitle = document.createElement('li');
            groupTitle.className = 'cmd-result-group-title';
            groupTitle.textContent = 'My Saved Projects';
            list.appendChild(groupTitle);

            asyncProjects.forEach(proj => {
                currentResults.push({ type: 'project', data: proj });
            });
        }

        // 4. Quick Actions
        const actions = [];
        if (!query || 'theme dark light mode toggle'.includes(query)) {
            actions.push({
                name: `Toggle Theme (${window.PixelCraftTheme ? (window.PixelCraftTheme.getTheme() === 'dark' ? 'Switch to Light' : 'Switch to Dark') : 'Toggle Theme'})`,
                icon: 'fa-circle-half-stroke',
                action: () => { window.PixelCraftTheme && window.PixelCraftTheme.toggle(); }
            });
        }
        if (PixelCraftAuth && PixelCraftAuth.isLoggedIn()) {
            if (!query || 'logout signout exit'.includes(query)) {
                actions.push({
                    name: 'Log Out of PixelCraft',
                    icon: 'fa-arrow-right-from-bracket',
                    action: () => { PixelCraftAuth.logout(); }
                });
            }
        } else {
            if (!query || 'login signin'.includes(query)) {
                actions.push({
                    name: 'Log in to Account',
                    icon: 'fa-arrow-right-to-bracket',
                    action: () => { window.location.href = '/login.html'; }
                });
            }
        }

        if (actions.length > 0) {
            const groupTitle = document.createElement('li');
            groupTitle.className = 'cmd-result-group-title';
            groupTitle.textContent = 'Quick Actions';
            list.appendChild(groupTitle);

            actions.forEach(act => {
                currentResults.push({ type: 'action', data: act });
            });
        }

        // 5. Navigation Pages
        if (matchedPages.length > 0) {
            const groupTitle = document.createElement('li');
            groupTitle.className = 'cmd-result-group-title';
            groupTitle.textContent = 'Pages';
            list.appendChild(groupTitle);

            matchedPages.slice(0, 5).forEach(page => {
                currentResults.push({ type: 'page', data: page });
            });
        }

        if (currentResults.length === 0) {
            list.innerHTML = `
                <li style="padding: 2.5rem 1.5rem; text-align: center; color: var(--text-muted);">
                    <i class="fa-solid fa-face-meh" style="font-size: 2rem; margin-bottom: 0.75rem; display: block; color: var(--text-muted);"></i>
                    <strong>No matching tools or pages found for "${query}"</strong>
                    <p style="font-size: 0.85rem; margin-top: 0.25rem;">Try searching by studio name (e.g., "pdf", "image", "qr") or tool action (e.g., "compress", "resize", "invoice").</p>
                </li>
            `;
            return;
        }

        let itemIndex = 0;
        currentResults.forEach((res) => {
            const li = document.createElement('li');
            li.className = `cmd-result-item ${itemIndex === selectedIndex ? 'focused' : ''}`;
            li.dataset.index = itemIndex;

            if (res.type === 'tool') {
                const t = res.data;
                li.innerHTML = `
                    <div class="cmd-item-left">
                        <div class="cmd-item-icon" style="color: ${t.accentColor};">
                            <i class="fa-solid ${t.icon}"></i>
                        </div>
                        <div>
                            <div class="cmd-item-name">${highlightMatch(t.name, query)}</div>
                            <div class="cmd-item-desc">${t.categoryName}</div>
                        </div>
                    </div>
                    <span class="badge" style="background: rgba(121, 87, 255, 0.12); color: ${t.accentColor}; font-size: 0.7rem;">LAUNCH</span>
                `;
                li.addEventListener('click', () => {
                    window.location.href = `/tool.html?id=${t.id}`;
                    closePalette();
                });
            } else if (res.type === 'category') {
                const c = res.data;
                li.innerHTML = `
                    <div class="cmd-item-left">
                        <div class="cmd-item-icon" style="color: ${c.color};">
                            <i class="fa-solid ${c.icon}"></i>
                        </div>
                        <div>
                            <div class="cmd-item-name">${highlightMatch(c.name, query)}</div>
                            <div class="cmd-item-desc">${c.desc}</div>
                        </div>
                    </div>
                    <i class="fa-solid fa-arrow-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
                `;
                li.addEventListener('click', () => {
                    window.location.href = c.url;
                    closePalette();
                });
            } else if (res.type === 'project') {
                const p = res.data;
                li.innerHTML = `
                    <div class="cmd-item-left">
                        <div class="cmd-item-icon" style="color: #10B981;">
                            <i class="fa-solid fa-folder"></i>
                        </div>
                        <div>
                            <div class="cmd-item-name">${highlightMatch(p.title, query)}</div>
                            <div class="cmd-item-desc">Project • ${p.category}</div>
                        </div>
                    </div>
                    <span class="badge badge-free" style="font-size: 0.7rem;">OPEN</span>
                `;
                li.addEventListener('click', () => {
                    window.location.href = `/tool.html?id=${p.tool_id}&project_id=${p.id}`;
                    closePalette();
                });
            } else if (res.type === 'action') {
                const a = res.data;
                li.innerHTML = `
                    <div class="cmd-item-left">
                        <div class="cmd-item-icon" style="color: var(--brand-purple);">
                            <i class="fa-solid ${a.icon}"></i>
                        </div>
                        <div class="cmd-item-name">${highlightMatch(a.name, query)}</div>
                    </div>
                    <kbd class="cmd-shortcut-badge">↵ RUN</kbd>
                `;
                li.addEventListener('click', () => {
                    a.action();
                    closePalette();
                });
            } else {
                const p = res.data;
                li.innerHTML = `
                    <div class="cmd-item-left">
                        <div class="cmd-item-icon" style="color: var(--brand-blue);">
                            <i class="fa-solid ${p.icon}"></i>
                        </div>
                        <div class="cmd-item-name">${highlightMatch(p.name, query)}</div>
                    </div>
                    <i class="fa-solid fa-arrow-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
                `;
                li.addEventListener('click', () => {
                    window.location.href = p.url;
                    closePalette();
                });
            }

            list.appendChild(li);
            itemIndex++;
        });

        // Scroll focused into view
        const focusedEl = list.querySelector('.cmd-result-item.focused');
        if (focusedEl) focusedEl.scrollIntoView({ block: 'nearest' });
    }

    function handleKeyNav(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentResults.length > 0) {
                selectedIndex = (selectedIndex + 1) % currentResults.length;
                updateFocus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentResults.length > 0) {
                selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
                updateFocus();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentResults[selectedIndex]) {
                const target = currentResults[selectedIndex];
                if (target.type === 'tool') {
                    window.location.href = `/tool.html?id=${target.data.id}`;
                } else if (target.type === 'category') {
                    window.location.href = target.data.url;
                } else if (target.type === 'project') {
                    window.location.href = `/tool.html?id=${target.data.tool_id}&project_id=${target.data.id}`;
                } else if (target.type === 'action') {
                    target.data.action();
                } else {
                    window.location.href = target.data.url;
                }
                closePalette();
            }
        } else if (e.key === 'Escape') {
            closePalette();
        }
    }

    function updateFocus() {
        const items = list.querySelectorAll('.cmd-result-item');
        items.forEach((item, idx) => {
            if (idx === selectedIndex) {
                item.classList.add('focused');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('focused');
            }
        });
    }

    // Global keyboard listener for Ctrl+K and Cmd+K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (backdrop && backdrop.classList.contains('active')) {
                closePalette();
            } else {
                openPalette();
            }
        }
    });

    window.PixelCraftPalette = { open: openPalette, close: closePalette };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.open-cmd-palette').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openPalette();
            });
        });
    });
})();
