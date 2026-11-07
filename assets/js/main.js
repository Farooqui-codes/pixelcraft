/**
 * PixelCraft Main Client Script
 * Handles global interactions, navigation active states, search triggers.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Highlight active nav links
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.endsWith(href) || (href !== '/' && currentPath.includes(href)))) {
            link.classList.add('active');
        }
    });

    // Populate search bars if present
    const toolSearchInput = document.getElementById('global-tool-search');
    if (toolSearchInput) {
        toolSearchInput.addEventListener('click', () => {
            if (window.PixelCraftPalette) {
                PixelCraftPalette.open();
            }
        });
    }
});

