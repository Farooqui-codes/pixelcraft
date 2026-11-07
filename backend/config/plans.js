/**
 * PixelCraft Freemium SaaS Monetization & Plan Configuration
 * Defines plan tiers, limits, feature matrices, and coupons.
 * Fully configurable via platform_settings in the database.
 */

const DEFAULT_PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        priceMonthly: 0,
        currency: 'INR',
        dailyOperationsLimit: 10,
        monthlyOperationsLimit: 200,
        maxProjects: 5,
        maxFileSizeMB: 10,
        maxBatchCount: 1,
        storageMB: 20,
        
        features: [
            'standard_tools',
            'basic_templates',
            'standard_export',
            'guest_access',
            'client_processing'
        ],
        description: 'Ideal for casual edits, guests, and testing out the platform.'
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 149,
        currency: 'INR',
        dailyOperationsLimit: 100,
        monthlyOperationsLimit: 2500,
        maxProjects: 50,
        maxFileSizeMB: 50,
        maxBatchCount: 10,
        storageMB: 500,
        features: [
            'standard_tools',
            'all_30_tools',
            'basic_templates',
            'premium_templates',
            'batch_processing',
            'svg_export',
            'custom_watermark',
            'high_res_export',
            'priority_processing',
            'email_support'
        ],
        description: 'Unlocks full power for daily creators, YouTubers, and freelancers.'
    },
    business: {
        id: 'business',
        name: 'Business',
        priceMonthly: 399,
        currency: 'INR',
        dailyOperationsLimit: 1000,
        monthlyOperationsLimit: 25000,
        maxProjects: 500,
        maxFileSizeMB: 200,
        maxBatchCount: 50,
        storageMB: 5000,
        features: [
            'standard_tools',
            'all_30_tools',
            'basic_templates',
            'premium_templates',
            'batch_processing',
            'svg_export',
            'custom_watermark',
            'high_res_export',
            'priority_processing',
            'team_workspace',
            'bulk_invoicing',
            'priority_support',
            'usage_reports'
        ],
        description: 'Maximum capacity, commercial invoices, team workspaces, and zero friction.'
    }
};

const FEATURE_CATALOG = {
    all_30_tools: {
        name: 'All 30 Studio Tools',
        desc: 'Unlocks all creative, PDF, business, QR, invitation, and developer tools.',
        minPlan: 'pro'
    },
    premium_templates: {
        name: 'Premium Design Templates',
        desc: 'Access curated high-converting Instagram, YouTube, and Invitation templates.',
        minPlan: 'pro'
    },
    batch_processing: {
        name: 'Batch File Processing',
        desc: 'Process up to 10 files (Pro) or 50 files (Business) simultaneously.',
        minPlan: 'pro'
    },
    svg_export: {
        name: 'Vector SVG Export',
        desc: 'Export scalable vector graphics for QR codes and logos without loss of resolution.',
        minPlan: 'pro'
    },
    high_res_export: {
        name: '4K Ultra HD Export',
        desc: 'Export canvas designs and converted files in full 4K print-ready resolution.',
        minPlan: 'pro'
    },
    custom_watermark: {
        name: 'Branding & Watermark Removal',
        desc: 'Remove PixelCraft watermark badges from generated graphics and documents.',
        minPlan: 'pro'
    },
    team_workspace: {
        name: 'Team Workspace & Collaboration',
        desc: 'Invite team members to shared projects with viewer and editor permissions.',
        minPlan: 'business'
    },
    bulk_invoicing: {
        name: 'Bulk Invoice & Quotation Engine',
        desc: 'Import CSV/JSON data to generate hundreds of PDF invoices in a single click.',
        minPlan: 'business'
    },
    usage_reports: {
        name: 'Business Usage Analytics',
        desc: 'Download CSV audit reports detailing daily team usage and tool executions.',
        minPlan: 'business'
    }
};

const DEFAULT_COUPONS = [
    { code: 'LAUNCH50', discountPercent: 50, validUntil: '2027-12-31', maxUses: 1000, uses: 0, description: '50% off launch discount' },
    { code: 'SAVE20', discountPercent: 20, validUntil: '2027-12-31', maxUses: 500, uses: 0, description: '20% off any subscription' },
    { code: 'PROTRIAL', discountPercent: 100, validUntil: '2027-12-31', maxUses: 100, uses: 0, description: '100% off first month trial' }
];

async function getPlansConfig(db) {
    try {
        const setting = await db.findOne('platform_settings', { key: 'plans_config' });
        if (setting && setting.value && setting.value.pro && setting.value.pro.features && setting.value.pro.features.includes('svg_export')) {
            return setting.value;
        }
        // Check legacy pricing key
        const legacy = await db.findOne('platform_settings', { key: 'pricing' });
        if (legacy && legacy.value) {
            // Merge with default limits, always preserving valid machine feature keys
            return {
                free: { ...DEFAULT_PLANS.free, ...legacy.value.free, features: DEFAULT_PLANS.free.features, displayFeatures: legacy.value.free.features },
                pro: { ...DEFAULT_PLANS.pro, ...legacy.value.pro, features: DEFAULT_PLANS.pro.features, displayFeatures: legacy.value.pro.features },
                business: { ...DEFAULT_PLANS.business, ...legacy.value.business, features: DEFAULT_PLANS.business.features, displayFeatures: legacy.value.business.features }
            };
        }
    } catch (e) {
        console.warn('Error reading plans config from database, using defaults:', e.message);
    }
    return DEFAULT_PLANS;
}

async function getCouponsConfig(db) {
    try {
        const setting = await db.findOne('platform_settings', { key: 'coupons' });
        if (setting && setting.value && Array.isArray(setting.value)) {
            return setting.value;
        }
    } catch (e) {
        console.warn('Error reading coupons from database:', e.message);
    }
    return DEFAULT_COUPONS;
}

module.exports = {
    DEFAULT_PLANS,
    FEATURE_CATALOG,
    DEFAULT_COUPONS,
    getPlansConfig,
    getCouponsConfig
};
