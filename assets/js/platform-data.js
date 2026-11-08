/**
 * ====================================================================
 * PIXELCRAFT PLATFORM DATA & SINGLE SOURCE OF TRUTH
 * Centralized catalog of all 30 tools, 8 studios, and platform metrics.
 * Ensures counts, titles, icons, and routes never fall out of sync.
 * ====================================================================
 */

(function () {
    'use strict';

    const PIXELCRAFT_STUDIOS = [
        {
            id: 'image',
            name: 'Image Studio',
            count: 5,
            icon: 'fa-image',
            color: 'var(--accent-image)',
            accentHex: '#8B5CF6',
            bgAlpha: 'rgba(139, 92, 246, 0.15)',
            tagline: 'Compress, resize, convert, crop & sample'
        },
        {
            id: 'pdf',
            name: 'PDF Studio',
            count: 5,
            icon: 'fa-file-pdf',
            color: 'var(--accent-pdf)',
            accentHex: '#38BDF8',
            bgAlpha: 'rgba(56, 189, 248, 0.15)',
            tagline: 'Merge, split, compress & convert PDFs'
        },
        {
            id: 'creator',
            name: 'Creator Studio',
            count: 4,
            icon: 'fa-wand-magic-sparkles',
            color: 'var(--accent-creator)',
            accentHex: '#F43F5E',
            bgAlpha: 'rgba(244, 63, 94, 0.15)',
            tagline: 'Instagram, YouTube graphics & captions'
        },
        {
            id: 'business',
            name: 'Business Studio',
            count: 4,
            icon: 'fa-briefcase',
            color: 'var(--accent-business)',
            accentHex: '#10B981',
            bgAlpha: 'rgba(16, 185, 129, 0.15)',
            tagline: 'Invoices, quotations, GST & visiting cards'
        },
        {
            id: 'qr',
            name: 'QR Studio',
            count: 4,
            icon: 'fa-qrcode',
            color: 'var(--accent-qr)',
            accentHex: '#14B8A6',
            bgAlpha: 'rgba(20, 184, 166, 0.15)',
            tagline: 'URL, WhatsApp, Wi-Fi & UPI dynamic QR codes'
        },
        {
            id: 'invitation',
            name: 'Invitation Studio',
            count: 3,
            icon: 'fa-envelope-open-text',
            color: 'var(--accent-invitation)',
            accentHex: '#FB7185',
            bgAlpha: 'rgba(251, 113, 133, 0.15)',
            tagline: 'Digital wedding, birthday & Islamic cards'
        },
        {
            id: 'text',
            name: 'Text Studio',
            count: 3,
            icon: 'fa-font',
            color: 'var(--accent-text)',
            accentHex: '#F59E0B',
            bgAlpha: 'rgba(245, 158, 11, 0.15)',
            tagline: 'Word counter, case converter & dummy text'
        },
        {
            id: 'developer',
            name: 'Developer Studio',
            count: 2,
            icon: 'fa-code',
            color: 'var(--accent-developer)',
            accentHex: '#06B6D4',
            bgAlpha: 'rgba(6, 182, 212, 0.15)',
            tagline: 'JSON validator, formatter & Base64 encoder'
        }
    ];

    const METRICS = {
        totalTools: 30,
        totalStudios: 8,
        totalTemplates: 17,
        version: '2.5.0',
        deployment: 'Cloudflare Workers (Edge Global)',
        privacy: '100% Client-Side In-Browser Execution'
    };

    window.PIXELCRAFT_STUDIOS = PIXELCRAFT_STUDIOS;
    window.PIXELCRAFT_METRICS = METRICS;

    /**
     * Auto-sync dynamic platform metrics across DOM
     */
    function syncPlatformMetrics() {
        // Sync studio count
        document.querySelectorAll('.pc-metric-studios').forEach(el => {
            el.textContent = METRICS.totalStudios;
        });

        // Sync tools count
        document.querySelectorAll('.pc-metric-tools').forEach(el => {
            el.textContent = METRICS.totalTools;
        });

        // Sync templates count
        document.querySelectorAll('.pc-metric-templates').forEach(el => {
            el.textContent = `${METRICS.totalTemplates}+`;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncPlatformMetrics);
    } else {
        syncPlatformMetrics();
    }
})();
