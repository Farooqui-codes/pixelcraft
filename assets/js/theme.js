/**
 * PixelCraft Theme Manager
 * Supports Dark (default) and Light mode with localStorage persistence.
 */

(function () {
    const THEME_KEY = 'pixelcraft_theme';

    function getPreferredTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) return saved;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);

        // Update toggle icons on page
        const icons = document.querySelectorAll('.theme-toggle-icon');
        icons.forEach(icon => {
            if (theme === 'light') {
                icon.className = 'fa-solid fa-moon theme-toggle-icon';
            } else {
                icon.className = 'fa-solid fa-sun theme-toggle-icon';
            }
        });
    }

    // Initialize immediately
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);

    window.PixelCraftTheme = {
        getTheme: () => document.documentElement.getAttribute('data-theme') || 'dark',
        toggle: () => {
            const current = window.PixelCraftTheme.getTheme();
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            return next;
        },
        setTheme: applyTheme
    };

    document.addEventListener('DOMContentLoaded', () => {
        const toggles = document.querySelectorAll('.theme-toggle-btn');
        toggles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.PixelCraftTheme.toggle();
            });
        });
        applyTheme(window.PixelCraftTheme.getTheme());
    });
})();

