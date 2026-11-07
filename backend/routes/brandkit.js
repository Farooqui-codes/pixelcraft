/**
 * PixelCraft Brand Kit Router
 * Enables users to store corporate logos, brand palettes, typography,
 * and contact credentials for automated reuse across Invoices, Quotations,
 * Business Cards, and Social Media creators.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// 1. GET USER BRAND KIT
router.get('/', authenticate, async (req, res) => {
    try {
        let kit = await db.findOne('brand_kits', { user_id: req.user.id });
        if (!kit) {
            // Default blank brand kit
            kit = {
                brand_name: req.user.business_name || req.user.full_name || '',
                logo_data: null,
                primary_color: '#7957FF',
                secondary_color: '#35B9FF',
                accent_color: '#101426',
                font_family: 'Inter',
                business_email: req.user.email || '',
                business_phone: '',
                business_address: '',
                website: '',
                social_handle: ''
            };
        }

        const userPlan = req.user.plan || 'free';

        return res.json({
            success: true,
            hasBrandKitAccess: userPlan !== 'free',
            brandKit: kit,
            permissions: {
                canUploadLogo: userPlan !== 'free',
                canUseCustomFonts: userPlan !== 'free',
                tier: userPlan
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve brand kit.' });
    }
});

// 2. SAVE OR UPDATE BRAND KIT
router.put('/', authenticate, async (req, res) => {
    try {
        const {
            brand_name,
            logo_data,
            primary_color,
            secondary_color,
            accent_color,
            font_family,
            business_email,
            business_phone,
            business_address,
            website,
            social_handle
        } = req.body;

        const userPlan = req.user.plan || 'free';

        // Gated capabilities: logo upload for Pro/Business
        let finalLogo = logo_data;
        if (userPlan === 'free' && logo_data && logo_data.length > 200000) {
            finalLogo = null; // Free plan has logo size restrictions
        }

        const payload = {
            brand_name: (brand_name || '').trim(),
            logo_data: finalLogo || null,
            primary_color: primary_color || '#7957FF',
            secondary_color: secondary_color || '#35B9FF',
            accent_color: accent_color || '#101426',
            font_family: font_family || 'Inter',
            business_email: (business_email || '').trim(),
            business_phone: (business_phone || '').trim(),
            business_address: (business_address || '').trim(),
            website: (website || '').trim(),
            social_handle: (social_handle || '').trim()
        };

        const existing = await db.findOne('brand_kits', { user_id: req.user.id });
        if (existing) {
            await db.update('brand_kits', { id: existing.id }, payload);
        } else {
            await db.insert('brand_kits', {
                user_id: req.user.id,
                ...payload
            });
        }

        // Also update profile business name if provided
        if (payload.brand_name) {
            await db.update('profiles', { id: req.user.id }, { business_name: payload.brand_name });
        }

        return res.json({
            success: true,
            message: 'Brand Kit updated and saved successfully!',
            brandKit: payload
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to save brand kit: ' + err.message });
    }
});

module.exports = router;
