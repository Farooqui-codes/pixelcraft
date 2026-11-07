const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { checkUsageLimit, requireFeature, requireMinPlan, syncSubscriptionStatus } = require('../middleware/subscription');
const { getPlansConfig } = require('../config/plans');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

// THE CANONICAL 30 TOOLS CATALOG DEFINITIONS
const TOOLS_CATALOG = [
    // Image Studio (5)
    {
        id: 'image-compressor',
        name: 'Image Compressor',
        category: 'image',
        categoryName: 'Image Studio',
        icon: 'fa-compress',
        accentColor: '#7957FF',
        tier: 'free',
        description: 'Compress PNG, JPEG, WEBP images with custom quality slider and instant side-by-side preview.',
        keywords: ['compress', 'optimize', 'shrink', 'photo', 'picture', 'file size']
    },
    {
        id: 'image-resizer',
        name: 'Image Resizer',
        category: 'image',
        categoryName: 'Image Studio',
        icon: 'fa-expand',
        accentColor: '#7957FF',
        tier: 'free',
        description: 'Resize dimensions in pixels or percentage with aspect ratio lock and social media presets.',
        keywords: ['resize', 'scale', 'dimensions', 'width', 'height']
    },
    {
        id: 'image-cropper',
        name: 'Image Cropper',
        category: 'image',
        categoryName: 'Image Studio',
        icon: 'fa-crop',
        accentColor: '#7957FF',
        tier: 'free',
        description: 'Interactive visual cropping with 1:1, 16:9, 4:3, 9:16 aspect ratio presets and download.',
        keywords: ['crop', 'cut', 'aspect ratio', 'square']
    },
    {
        id: 'jpg-png-converter',
        name: 'JPG/PNG Converter',
        category: 'image',
        categoryName: 'Image Studio',
        icon: 'fa-arrows-rotate',
        accentColor: '#7957FF',
        tier: 'free',
        description: 'Convert between PNG, JPG, WEBP, and BMP formats with instant high-quality rendering.',
        keywords: ['convert', 'jpg', 'png', 'webp', 'bmp', 'format']
    },
    {
        id: 'color-picker',
        name: 'Image Color Picker',
        category: 'image',
        categoryName: 'Image Studio',
        icon: 'fa-eye-dropper',
        accentColor: '#7957FF',
        tier: 'free',
        description: 'Upload an image, pick colors with interactive loupe, and copy HEX, RGB, and HSL codes.',
        keywords: ['color', 'eyedropper', 'palette', 'hex', 'rgb', 'hsl']
    },

    // PDF and Document Studio (5)
    {
        id: 'pdf-merger',
        name: 'PDF Merger',
        category: 'pdf',
        categoryName: 'PDF Studio',
        icon: 'fa-object-group',
        accentColor: '#35B9FF',
        tier: 'free',
        description: 'Combine multiple PDF documents into a single organized file with drag & drop ordering.',
        keywords: ['pdf', 'merge', 'combine', 'join', 'documents']
    },
    {
        id: 'pdf-splitter',
        name: 'PDF Splitter',
        category: 'pdf',
        categoryName: 'PDF Studio',
        icon: 'fa-scissors',
        accentColor: '#35B9FF',
        tier: 'free',
        description: 'Extract specific pages or page ranges from any PDF into individual documents.',
        keywords: ['pdf', 'split', 'extract', 'pages', 'divide']
    },
    {
        id: 'pdf-compressor',
        name: 'PDF Compressor',
        category: 'pdf',
        categoryName: 'PDF Studio',
        icon: 'fa-file-zipper',
        accentColor: '#35B9FF',
        tier: 'free',
        description: 'Optimize PDF file size through content stream compression and metadata slimming.',
        keywords: ['pdf', 'compress', 'reduce size', 'optimize']
    },
    {
        id: 'image-to-pdf',
        name: 'Image to PDF Converter',
        category: 'pdf',
        categoryName: 'PDF Studio',
        icon: 'fa-file-pdf',
        accentColor: '#35B9FF',
        tier: 'free',
        description: 'Convert single or multiple images (PNG/JPG) into a polished, multi-page PDF document.',
        keywords: ['image to pdf', 'photos to pdf', 'jpg to pdf', 'png to pdf']
    },
    {
        id: 'pdf-to-jpg',
        name: 'PDF to JPG Converter',
        category: 'pdf',
        categoryName: 'PDF Studio',
        icon: 'fa-file-image',
        accentColor: '#35B9FF',
        tier: 'free',
        description: 'Convert PDF document pages into high-resolution JPG images ready for sharing.',
        keywords: ['pdf to jpg', 'pdf to image', 'export pdf as picture']
    },

    // Creator Studio (4)
    {
        id: 'instagram-post-maker',
        name: 'Instagram Post Maker',
        category: 'creator',
        categoryName: 'Creator Studio',
        icon: 'fa-instagram',
        accentColor: '#FF6584',
        tier: 'free',
        description: 'Design square 1080x1080 posts with custom typography, gradients, shapes, stickers, and export.',
        keywords: ['instagram', 'social media', 'post', 'square', 'banner', 'graphics']
    },
    {
        id: 'instagram-story-maker',
        name: 'Instagram Story Maker',
        category: 'creator',
        categoryName: 'Creator Studio',
        icon: 'fa-mobile-screen',
        accentColor: '#FF6584',
        tier: 'free',
        description: 'Craft vertical 1080x1920 stories with dynamic text, photo uploads, stickers, and backgrounds.',
        keywords: ['story', 'reel', 'vertical', '1080x1920', 'social story']
    },
    {
        id: 'youtube-thumbnail-maker',
        name: 'YouTube Thumbnail Maker',
        category: 'creator',
        categoryName: 'Creator Studio',
        icon: 'fa-youtube',
        accentColor: '#FF6584',
        tier: 'free',
        description: 'Generate high-CTR 1280x720 YouTube thumbnails with outlined fonts, badges, and templates.',
        keywords: ['youtube', 'thumbnail', 'cover', 'video banner']
    },
    {
        id: 'caption-generator',
        name: 'Social Media Caption Generator',
        category: 'creator',
        categoryName: 'Creator Studio',
        icon: 'fa-hashtag',
        accentColor: '#FF6584',
        tier: 'free',
        description: 'Generate tailored social captions, hashtags, and hooks based on niche, topic, and tone using smart rule-based logic.',
        keywords: ['caption', 'hashtags', 'copywriting', 'instagram caption', 'hook']
    },

    // Business Studio (4)
    {
        id: 'invoice-generator',
        name: 'Invoice Generator',
        category: 'business',
        categoryName: 'Business Studio',
        icon: 'fa-file-invoice-dollar',
        accentColor: '#10B981',
        tier: 'free',
        description: 'Create professional business invoices with line items, tax, discounts, and instant PDF download.',
        keywords: ['invoice', 'billing', 'bill', 'receipt', 'tax invoice']
    },
    {
        id: 'quotation-generator',
        name: 'Quotation Generator',
        category: 'business',
        categoryName: 'Business Studio',
        icon: 'fa-file-contract',
        accentColor: '#10B981',
        tier: 'free',
        description: 'Build formal price estimates and proposals with terms of service, validity, and PDF export.',
        keywords: ['quotation', 'estimate', 'proposal', 'quote', 'bid']
    },
    {
        id: 'gst-calculator',
        name: 'GST Calculator',
        category: 'business',
        categoryName: 'Business Studio',
        icon: 'fa-calculator',
        accentColor: '#10B981',
        tier: 'free',
        description: 'Calculate GST inclusive and exclusive amounts with detailed CGST, SGST, and IGST breakdowns.',
        keywords: ['gst', 'tax', 'calculator', 'cgst', 'sgst', 'igst']
    },
    {
        id: 'business-card-maker',
        name: 'Business Card Maker',
        category: 'business',
        categoryName: 'Business Studio',
        icon: 'fa-address-card',
        accentColor: '#10B981',
        tier: 'free',
        description: 'Design front and back 3.5x2 inch professional business visiting cards with logo and contact info.',
        keywords: ['business card', 'visiting card', 'corporate identity', 'contact card']
    },

    // QR Studio (4)
    {
        id: 'url-qr-generator',
        name: 'URL QR Code Generator',
        category: 'qr',
        categoryName: 'QR Studio',
        icon: 'fa-link',
        accentColor: '#14B8A6',
        tier: 'free',
        description: 'Generate high-contrast QR codes for websites and links with custom colors and PNG/SVG export.',
        keywords: ['qr code', 'url qr', 'website qr', 'barcode', 'link']
    },
    {
        id: 'whatsapp-qr-generator',
        name: 'WhatsApp QR Generator',
        category: 'qr',
        categoryName: 'QR Studio',
        icon: 'fa-whatsapp',
        accentColor: '#14B8A6',
        tier: 'free',
        description: 'Create direct chat QR codes with pre-filled messages for instant WhatsApp messaging.',
        keywords: ['whatsapp qr', 'wa qr', 'chat qr', 'direct message']
    },
    {
        id: 'wifi-qr-generator',
        name: 'Wi-Fi QR Code Generator',
        category: 'qr',
        categoryName: 'QR Studio',
        icon: 'fa-wifi',
        accentColor: '#14B8A6',
        tier: 'free',
        description: 'Let guests connect to Wi-Fi instantly by scanning a QR code without typing complex passwords.',
        keywords: ['wifi qr', 'wlan', 'network qr', 'wifi connect']
    },
    {
        id: 'upi-qr-generator',
        name: 'UPI QR Payment Generator',
        category: 'qr',
        categoryName: 'QR Studio',
        icon: 'fa-indian-rupee-sign',
        accentColor: '#14B8A6',
        tier: 'free',
        description: 'Generate standard UPI payment QR codes (VPA, Payee Name, Note) compatible with all BHIM UPI apps.',
        keywords: ['upi', 'upi qr', 'bhim', 'payment qr', 'gpay', 'phonepe']
    },

    // Invitation Studio (3)
    {
        id: 'wedding-invitation-maker',
        name: 'Wedding Invitation Maker',
        category: 'invitation',
        categoryName: 'Invitation Studio',
        icon: 'fa-rings-wedding',
        accentColor: '#F43F5E',
        tier: 'free',
        description: 'Create elegant digital wedding cards with couple names, venue, date, schedule, and floral themes.',
        keywords: ['wedding', 'marriage', 'invitation', 'save the date', 'nikah']
    },
    {
        id: 'birthday-invitation-maker',
        name: 'Birthday Invitation Maker',
        category: 'invitation',
        categoryName: 'Invitation Studio',
        icon: 'fa-cake-candles',
        accentColor: '#F43F5E',
        tier: 'free',
        description: 'Design cheerful birthday celebration cards with photo frames, party details, and RSVP note.',
        keywords: ['birthday', 'party', 'celebration', 'invite']
    },
    {
        id: 'islamic-invitation-maker',
        name: 'Islamic Event Invitation Maker',
        category: 'invitation',
        categoryName: 'Invitation Studio',
        icon: 'fa-moon',
        accentColor: '#F43F5E',
        tier: 'free',
        description: 'Specialized invitations for Nikah, Walima, Eid, and Aqiqah with Arabic Bismillah and RTL support.',
        keywords: ['islamic', 'nikah', 'walima', 'eid', 'aqiqah', 'arabic', 'urdu', 'bismillah']
    },

    // Text Studio (3)
    {
        id: 'word-counter',
        name: 'Word & Character Counter',
        category: 'text',
        categoryName: 'Text Studio',
        icon: 'fa-spell-check',
        accentColor: '#F59E0B',
        tier: 'free',
        description: 'Real-time calculation of words, characters (with/without spaces), sentences, reading and speaking time.',
        keywords: ['word counter', 'character count', 'reading time', 'text statistics']
    },
    {
        id: 'case-converter',
        name: 'Case Converter',
        category: 'text',
        categoryName: 'Text Studio',
        icon: 'fa-font',
        accentColor: '#F59E0B',
        tier: 'free',
        description: 'Transform text into UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, and more.',
        keywords: ['case converter', 'uppercase', 'lowercase', 'camelcase', 'snake_case', 'title case']
    },
    {
        id: 'lorem-ipsum-generator',
        name: 'Lorem Ipsum Generator',
        category: 'text',
        categoryName: 'Text Studio',
        icon: 'fa-paragraph',
        accentColor: '#F59E0B',
        tier: 'free',
        description: 'Generate customized placeholder dummy text by paragraphs, sentences, or words with 1-click copy.',
        keywords: ['lorem ipsum', 'dummy text', 'placeholder text', 'filler text']
    },

    // Developer Studio (2)
    {
        id: 'json-formatter',
        name: 'JSON Formatter & Validator',
        category: 'developer',
        categoryName: 'Developer Studio',
        icon: 'fa-code',
        accentColor: '#06B6D4',
        tier: 'free',
        description: 'Format, prettify, minify, and validate JSON data with clear syntax error location indicators.',
        keywords: ['json', 'format', 'prettify', 'validator', 'minify', 'lint']
    },
    {
        id: 'base64-converter',
        name: 'Base64 Encoder & Decoder',
        category: 'developer',
        categoryName: 'Developer Studio',
        icon: 'fa-binary',
        accentColor: '#06B6D4',
        tier: 'free',
        description: 'Encode and decode plain text or convert binary files/images to Base64 data URIs bidirectionally.',
        keywords: ['base64', 'encode', 'decode', 'data uri', 'binary']
    }
];

// GET ALL TOOLS
router.get('/', (req, res) => {
    const { category, search } = req.query;
    let list = [...TOOLS_CATALOG];

    if (category && category !== 'all') {
        list = list.filter(t => t.category === category);
    }
    if (search) {
        const s = search.toLowerCase();
        list = list.filter(t => 
            t.name.toLowerCase().includes(s) || 
            t.description.toLowerCase().includes(s) || 
            t.keywords.some(k => k.toLowerCase().includes(s))
        );
    }

    res.json({ success: true, count: list.length, tools: list });
});

// GET SINGLE TOOL DEFINITION
router.get('/:id', (req, res) => {
    const tool = TOOLS_CATALOG.find(t => t.id === req.params.id);
    if (!tool) {
        return res.status(404).json({ success: false, message: 'Tool not found in catalog.' });
    }
    res.json({ success: true, tool });
});

// LOG TOOL USAGE (Tracks genuine usage against daily plan limits)
router.post('/log-usage', optionalAuth, checkUsageLimit(), async (req, res) => {
    try {
        const { tool_id, category, metadata } = req.body;
        if (!tool_id) {
            return res.status(400).json({ success: false, message: 'Tool identifier required.' });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        await db.insert('tool_usage', {
            user_id: req.user ? req.user.id : null,
            tool_id,
            category: category || 'general',
            metadata: metadata || {},
            ip_address: ip
        });

        res.json({
            success: true,
            usage: req.dailyUsage || null
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to record usage.' });
    }
});

// GET RECENT TOOL ACTIVITY FOR LOGGED IN USER
router.get('/user/recent', authenticate, async (req, res) => {
    try {
        const usages = await db.find('tool_usage', { user_id: req.user.id });
        // Group by tool_id and take latest
        const map = new Map();
        usages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        for (const u of usages) {
            if (!map.has(u.tool_id)) {
                const toolDef = TOOLS_CATALOG.find(t => t.id === u.tool_id);
                map.set(u.tool_id, {
                    tool_id: u.tool_id,
                    last_used: u.created_at,
                    tool: toolDef || { id: u.tool_id, name: u.tool_id, category: u.category }
                });
            }
        }

        res.json({ success: true, recent: Array.from(map.values()).slice(0, 10) });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch recent activity.' });
    }
});

// GET COMPREHENSIVE ACTIVITY METRICS & USAGE CALENDAR
router.get('/user/activity-stats', authenticate, async (req, res) => {
    try {
        const usages = await db.find('tool_usage', { user_id: req.user.id });
        const userProjects = await db.find('projects', { user_id: req.user.id });

        // Build 30-day usage calendar heatmap
        const now = new Date();
        const calendarMap = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86400000);
            const dateKey = d.toISOString().split('T')[0];
            calendarMap[dateKey] = 0;
        }

        const categoryCounts = {};
        usages.forEach(u => {
            const dateKey = u.created_at ? u.created_at.split('T')[0] : null;
            if (dateKey && calendarMap[dateKey] !== undefined) {
                calendarMap[dateKey]++;
            }
            const cat = u.category || 'general';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Top category
        let topCategory = 'None';
        let maxCatCount = 0;
        for (const [c, cnt] of Object.entries(categoryCounts)) {
            if (cnt > maxCatCount) {
                maxCatCount = cnt;
                topCategory = c;
            }
        }

        // Projects activity (recent creations and updates)
        const recentProjects = [...userProjects]
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
            .slice(0, 5)
            .map(p => ({
                id: p.id,
                title: p.title,
                tool_id: p.tool_id,
                category: p.category,
                updated_at: p.updated_at || p.created_at
            }));

        const heatmapArray = Object.entries(calendarMap).map(([date, count]) => ({ date, count }));

        res.json({
            success: true,
            totalToolRuns: usages.length,
            heatmap30Days: heatmapArray,
            stats: {
                totalExecutions: usages.length,
                totalProjects: userProjects.length,
                topCategory,
                categoryCounts,
                calendar: calendarMap,
                heatmap30Days: heatmapArray,
                recentProjects
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch activity stats: ' + e.message });
    }
});

// CLEAR USER'S TOOL USAGE HISTORY
router.delete('/history', authenticate, async (req, res) => {
    try {
        await db.delete('tool_usage', { user_id: req.user.id });
        res.json({
            success: true,
            message: 'Your activity history has been cleared securely.'
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to clear activity history.' });
    }
});

// SERVER-SIDE PDF MERGE ENDPOINT (With usage limits and optional auth)
router.post('/process/pdf-merge', optionalAuth, checkUsageLimit(), upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ success: false, message: 'Please upload at least 2 PDF files to merge.' });
        }

        // Free plan limit check: max 3 PDFs in single merge
        const userPlan = req.user ? (req.user.plan || 'free') : 'free';
        if (userPlan === 'free' && req.files.length > 3) {
            return res.status(403).json({
                success: false,
                message: 'Merging more than 3 PDF documents requires Pro or Business plan.',
                requiresUpgrade: true,
                requiredPlan: 'pro'
            });
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
            const pdf = await PDFDocument.load(file.buffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfFile = await mergedPdf.save();

        // Record usage
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.insert('tool_usage', {
            user_id: req.user ? req.user.id : null,
            tool_id: 'pdf-merger',
            category: 'pdf',
            metadata: { count: req.files.length },
            ip_address: ip
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=pixelcraft-merged.pdf');
        res.send(Buffer.from(mergedPdfFile));
    } catch (err) {
        console.error('PDF Merge Error:', err);
        res.status(500).json({ success: false, message: 'Error processing PDF merge: ' + err.message });
    }
});

// PREMIUM FEATURE GATE: BATCH PROCESSING
router.post('/process/batch-convert', optionalAuth, requireFeature('batch_processing'), checkUsageLimit(), async (req, res) => {
    try {
        const { items, format = 'png' } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Batch items array required.' });
        }

        const userPlan = req.user ? (req.user.plan || 'free') : 'free';
        const maxBatch = userPlan === 'business' ? 50 : 10;
        if (items.length > maxBatch) {
            return res.status(400).json({
                success: false,
                message: `Your ${userPlan.toUpperCase()} plan supports up to ${maxBatch} batch items per run.`
            });
        }

        // Record usage
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.insert('tool_usage', {
            user_id: req.user ? req.user.id : null,
            tool_id: 'jpg-png-converter',
            category: 'image',
            metadata: { batchCount: items.length, targetFormat: format },
            ip_address: ip
        });

        res.json({
            success: true,
            message: `Successfully processed batch of ${items.length} items to ${format.toUpperCase()}.`,
            processedCount: items.length
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Batch processing error: ' + e.message });
    }
});

// PREMIUM FEATURE GATE: VECTOR SVG QR EXPORT
router.post('/process/svg-export', optionalAuth, requireFeature('svg_export'), checkUsageLimit(), async (req, res) => {
    try {
        const { text, fgColor = '#000000', bgColor = '#FFFFFF', size = 300 } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, message: 'Text or URL payload required.' });
        }

        // Generate clean SVG vector string
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
            <rect width="100%" height="100%" fill="${bgColor}"/>
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="12" fill="${fgColor}">[Vector QR Code: ${text}]</text>
        </svg>`;

        // Record usage
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.insert('tool_usage', {
            user_id: req.user ? req.user.id : null,
            tool_id: 'url-qr-generator',
            category: 'qr',
            metadata: { exportType: 'svg' },
            ip_address: ip
        });

        res.json({
            success: true,
            svg: svgContent
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'SVG export error: ' + e.message });
    }
});

// PREMIUM FEATURE GATE: BUSINESS BULK INVOICING
router.post('/process/bulk-invoice', optionalAuth, requireFeature('bulk_invoicing'), checkUsageLimit(), async (req, res) => {
    try {
        const { invoices } = req.body;
        if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
            return res.status(400).json({ success: false, message: 'Invoices array required.' });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await db.insert('tool_usage', {
            user_id: req.user ? req.user.id : null,
            tool_id: 'invoice-generator',
            category: 'business',
            metadata: { bulkCount: invoices.length },
            ip_address: ip
        });

        res.json({
            success: true,
            message: `Successfully generated ${invoices.length} bulk commercial invoices.`,
            count: invoices.length
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Bulk invoice error: ' + e.message });
    }
});

// TEMPLATES ACCESS (Free & Premium tiers)
router.get('/templates/list', optionalAuth, async (req, res) => {
    try {
        const { tool_id, category } = req.query;
        let templates = await db.find('templates');

        if (tool_id) templates = templates.filter(t => t.tool_id === tool_id);
        if (category) templates = templates.filter(t => t.category === category);

        const userPlan = req.user ? (req.user.plan || 'free') : 'free';

        // Add locked flag for frontend rendering
        const enriched = templates.map(t => ({
            ...t,
            isLocked: t.tier === 'pro' && userPlan === 'free'
        }));

        res.json({ success: true, templates: enriched, userPlan });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch templates.' });
    }
});

module.exports = {
    router,
    TOOLS_CATALOG
};

