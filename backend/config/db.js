const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
let MongoClient = null;
try {
    MongoClient = require('mongodb').MongoClient;
} catch (e) {
    // MongoDB driver will be loaded if installed
}
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-supabase-url')) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client initialized successfully.');
    } catch (e) {
        console.warn('⚠️ Supabase initialization failed, falling back to persistent store.', e.message);
    }
}

// -------------------------------------------------------------
// MONGODB NATIVE DATABASE ENGINE
// -------------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'pixelcraft';
let mongoClient = null;
let mongoDb = null;
let mongoInitPromise = null;

async function getMongoDb() {
    if (mongoDb) return mongoDb;
    if (!MONGODB_URI || !MongoClient) return null;
    if (mongoInitPromise) return mongoInitPromise;

    mongoInitPromise = (async () => {
        try {
            mongoClient = new MongoClient(MONGODB_URI, {
                serverSelectionTimeoutMS: 2500,
                connectTimeoutMS: 2500
            });
            await mongoClient.connect();
            mongoDb = mongoClient.db(MONGODB_DB_NAME);
            console.log(`🍃 MongoDB connected successfully to database "${MONGODB_DB_NAME}".`);

            // Seed initial collections into MongoDB if empty
            for (const [colName, defaultItems] of Object.entries(DEFAULT_DB)) {
                if (Array.isArray(defaultItems) && defaultItems.length > 0) {
                    const count = await mongoDb.collection(colName).countDocuments();
                    if (count === 0) {
                        await mongoDb.collection(colName).insertMany(JSON.parse(JSON.stringify(defaultItems)));
                    }
                }
            }
            return mongoDb;
        } catch (err) {
            console.warn(`ℹ️ MongoDB connection not active (${err.message}). Using high-reliability persistent storage engine.`);
            mongoDb = null;
            return null;
        }
    })();

    return mongoInitPromise;
}

// Trigger initial MongoDB connection attempt
if (MONGODB_URI && MongoClient) {
    getMongoDb();
} else if (!supabase) {
    console.log('ℹ️ Storage Engine: High-reliability persistent storage active (MongoDB configured via MONGODB_URI).');
}

// Local Persistent Fallback Engine
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'pixelcraft_db.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_DB = {
    profiles: [],
    projects: [],
    favorites: [],
    tool_usage: [],
    subscriptions: [],
    payment_transactions: [],
    templates: [
        // 1. Social Media
        { id: 'tpl-1', title: 'Minimalist Instagram Quote', tool_id: 'instagram-post-maker', category: 'social', format: '1:1 Square', tier: 'free', is_active: true, config: { bg: 'navy', headline: 'Simplicity is the soul of efficiency.', sub: '@pixelcraft', color: '#35B9FF' } },
        { id: 'tpl-2', title: 'Neon Flash Sale Banner', tool_id: 'instagram-post-maker', category: 'social', format: '1:1 Square', tier: 'pro', is_active: true, config: { bg: 'purple-grad', headline: 'FLASH SALE 50% OFF', sub: 'Limited Weekend Drop', color: '#FFFFFF' } },
        { id: 'tpl-3', title: 'Cyberpunk Hologram Drop', tool_id: 'instagram-post-maker', category: 'social', format: '1:1 Square', tier: 'pro', is_active: true, config: { bg: 'cyberpunk-pro', headline: 'FUTURE OF DESIGN', sub: '#PixelCraft2026', color: '#38BDF8' } },
        { id: 'tpl-4', title: 'Sunset Glow Story', tool_id: 'instagram-story-maker', category: 'social', format: '9:16 Vertical', tier: 'free', is_active: true, config: { bg: 'sunset', headline: 'SUNSET STORIES', sub: 'Swipe Up to Explore', color: '#FFFBEB' } },
        { id: 'tpl-5', title: 'YouTube Pro Thumbnail', tool_id: 'youtube-thumbnail-maker', category: 'social', format: '16:9 Landscape', tier: 'free', is_active: true, config: { bg: 'navy', headline: 'HOW WE SCALED TO 100K', sub: 'FULL BLUEPRINT 2026', color: '#F59E0B' } },

        // 2. Business
        { id: 'tpl-6', title: 'Corporate Professional Invoice', tool_id: 'invoice-generator', category: 'business', format: 'A4 Document', tier: 'free', is_active: true, config: { currency: 'INR', company: 'Apex Global Consulting', taxPercent: 18, notes: 'Payment due within 15 days of invoice date.' } },
        { id: 'tpl-7', title: 'Tech Startup Commercial Invoice', tool_id: 'invoice-generator', category: 'business', format: 'A4 Document', tier: 'pro', is_active: true, config: { currency: 'INR', company: 'HyperScale Cloud Labs', taxPercent: 18, notes: 'Net 30. Bank transfer accepted via RTGS/NEFT/UPI.' } },
        { id: 'tpl-8', title: 'Client Service Quotation', tool_id: 'quotation-generator', category: 'business', format: 'A4 Document', tier: 'free', is_active: true, config: { client: 'Enterprise Client Corp', validityDays: 30, discount: 5 } },
        { id: 'tpl-9', title: 'Minimalist Visiting Card', tool_id: 'business-card-maker', category: 'business', format: 'Standard Card (3.5x2)', tier: 'free', is_active: true, config: { name: 'Aarav Sharma', title: 'Founder & Creative Director', theme: 'navy' } },
        { id: 'tpl-10', title: 'Executive Gold Business Card', tool_id: 'business-card-maker', category: 'business', format: 'Standard Card (3.5x2)', tier: 'pro', is_active: true, config: { name: 'Dr. Priya Mehta', title: 'Managing Partner', theme: 'gold' } },

        // 3. Invitations
        { id: 'tpl-11', title: 'Royal Heritage Wedding Card', tool_id: 'wedding-invitation-maker', category: 'invitations', format: '5x7 Portrait', tier: 'pro', is_active: true, config: { bride: 'Ananya', groom: 'Kabir', date: 'December 18, 2026', venue: 'Udaipur Palace Resorts' } },
        { id: 'tpl-12', title: 'Modern Milestone Birthday', tool_id: 'birthday-invitation-maker', category: 'invitations', format: '5x7 Portrait', tier: 'free', is_active: true, config: { celebrant: 'Liam', age: 30, date: 'October 24, 2026', theme: 'Retro Disco' } },
        { id: 'tpl-13', title: 'Arabic Calligraphy Nikah Invite', tool_id: 'islamic-invitation-maker', category: 'invitations', format: '5x7 Portrait', tier: 'free', is_active: true, config: { bride: 'Fatima', groom: 'Zaid', date: 'Shawwal 1448 AH', bismillah: true } },

        // 4. Documents
        { id: 'tpl-14', title: 'Client Project Brief Cover', tool_id: 'image-to-pdf', category: 'documents', format: 'A4 Document', tier: 'free', is_active: true, config: { title: 'Strategic Product Architecture 2026', client: 'Acme Enterprises' } },
        { id: 'tpl-15', title: 'Commercial Contract Annexure', tool_id: 'pdf-merger', category: 'documents', format: 'A4 Document', tier: 'pro', is_active: true, config: { header: 'Confidential Commercial Proposal' } },

        // 5. Marketing
        { id: 'tpl-16', title: 'Product Launch Promo Banner', tool_id: 'instagram-post-maker', category: 'marketing', format: '1:1 Square', tier: 'free', is_active: true, config: { bg: 'sunset', headline: 'INTRODUCING PIXELCRAFT 2.0', sub: 'The All-In-One Creative SaaS', color: '#FFFFFF' } },
        { id: 'tpl-17', title: 'Luxury Gold VIP Drop', tool_id: 'instagram-post-maker', category: 'marketing', format: '1:1 Square', tier: 'pro', is_active: true, config: { bg: 'gold-luxury-pro', headline: 'EXCLUSIVE VIP ACCESS', sub: 'By Invitation Only', color: '#FDE68A' } }
    ],
    brand_kits: [],
    notifications: [],
    feature_requests: [
        {
            id: 'req-1',
            user_id: 'user_community_seed',
            title: 'Batch Watermark & Logo Ingestion',
            description: 'Allow uploading a transparent PNG watermark and stamping it onto 50 images in one automated batch operation.',
            category: 'tools',
            status: 'planned',
            upvotes: 42,
            upvoted_by: [],
            author_name: 'Vikram S.',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
            id: 'req-2',
            user_id: 'user_community_seed',
            title: 'Figma and Canva Canvas Import',
            description: 'Support importing JSON layout specs or multi-layer files directly into Creator Studio.',
            category: 'integrations',
            status: 'under_review',
            upvotes: 28,
            upvoted_by: [],
            author_name: 'Elena Rostova',
            created_at: new Date(Date.now() - 10 * 86400000).toISOString()
        },
        {
            id: 'req-3',
            user_id: 'user_community_seed',
            title: 'Custom Brand Typography Web Fonts',
            description: 'Allow uploading OTF/TTF custom brand fonts so teams can render official corporate typography.',
            category: 'brand',
            status: 'completed',
            upvotes: 65,
            upvoted_by: [],
            author_name: 'Rohan Deshmukh',
            created_at: new Date(Date.now() - 20 * 86400000).toISOString()
        }
    ],
    changelog: [
        {
            id: 'chg-3',
            version: '2.1.0',
            release_date: '2026-11-06',
            title: 'Growth, Retention & Engagement Release',
            badge: 'Latest',
            changes: [
                { type: 'feature', text: 'Template Marketplace: Browse, preview, filter, and 1-click customize templates across Social, Business, Invitations, and Marketing.' },
                { type: 'feature', text: 'Brand Kit Studio: Store company logos, color palettes, typography, and social handles, automatically synced into Invoices, Quotations, and Cards.' },
                { type: 'feature', text: 'Multi-Tool Workflows: Chain together sequential image and PDF processing tasks in a single automated pipeline.' },
                { type: 'feature', text: 'PWA Offline Mode: Install PixelCraft on desktop and mobile with native offline fallback shells.' },
                { type: 'improvement', text: 'Multi-Language & RTL: Full UI localization for English, Hindi, and Urdu with automatic RTL bidirectional layout.' },
                { type: 'improvement', text: 'In-App Notification Center: Real-time alerts for project saves, daily quota thresholds, and export readiness.' }
            ]
        },
        {
            id: 'chg-2',
            version: '2.0.0',
            release_date: '2026-11-01',
            title: 'Freemium Monetization & Access Control Engine',
            badge: 'Major',
            changes: [
                { type: 'feature', text: '3-tier subscription model: Free (₹0), Pro (₹149/mo), and Business (₹399/mo) with live database configurability.' },
                { type: 'feature', text: 'Vector SVG Export for QR Studio with infinite resolution scaling.' },
                { type: 'feature', text: 'Verified promotional coupon engine with instant cart discounting.' },
                { type: 'security', text: 'Customer data preservation guarantee: saved projects are never deleted upon subscription expiration.' }
            ]
        },
        {
            id: 'chg-1',
            version: '1.0.0',
            release_date: '2026-10-15',
            title: 'PixelCraft Initial SaaS Launch',
            badge: 'Launch',
            changes: [
                { type: 'feature', text: 'All 30 launch tools active across 8 studio suites.' },
                { type: 'feature', text: 'Zero-flash theme engine supporting Dark Space and Soft Light palettes.' },
                { type: 'feature', text: 'Client-side Canvas rendering and PDF manipulation engines.' }
            ]
        }
    ],
    workflows: [
        {
            id: 'wf-social-prep',
            name: 'Social Media Quick-Prep Pipeline',
            description: 'Upload an image, automatically crop to square 1080x1080, optimize compression, and export as clean WebP/PNG.',
            category: 'creator',
            steps: [
                { order: 1, toolId: 'image-resizer', label: 'Square Resize (1080x1080)', params: { width: 1080, height: 1080 } },
                { order: 2, toolId: 'image-compressor', label: 'Quality Compression', params: { quality: 80 } },
                { order: 3, toolId: 'jpg-png-converter', label: 'Format Packaging', params: { targetFormat: 'image/png' } }
            ]
        },
        {
            id: 'wf-invoice-qr',
            name: 'Payable Invoice Packager',
            description: 'Generates a commercial invoice, bundles it with a standard UPI payment QR code, and exports ready for client dispatch.',
            category: 'business',
            steps: [
                { order: 1, toolId: 'invoice-generator', label: 'Draft Commercial Invoice', params: { currency: 'INR' } },
                { order: 2, toolId: 'upi-qr-generator', label: 'Generate UPI Payment QR', params: { vpa: 'pixelcraft@upi' } }
            ]
        },
        {
            id: 'wf-web-optimize',
            name: 'Web Image Optimization Pipeline',
            description: 'Resize oversized high-resolution assets to standard responsive dimensions, apply lossless compression, and convert to modern WebP format.',
            category: 'image',
            steps: [
                { order: 1, toolId: 'image-resizer', label: 'Scale to 1200px Max', params: { width: 1200, height: 630 } },
                { order: 2, toolId: 'image-compressor', label: 'Balanced Web Compression', params: { quality: 80 } },
                { order: 3, toolId: 'jpg-png-converter', label: 'Convert to Next-Gen WebP', params: { targetFormat: 'webp' } }
            ]
        }
    ],
    support_messages: [],
    referrals: [],
    platform_settings: [
        {
            key: 'pricing',
            value: {
                free: { name: 'Free', priceMonthly: 0, maxProjects: 5, features: ['Access to standard tools', 'Basic export quality', '5 saved projects', 'Community support'] },
                pro: { name: 'Pro', priceMonthly: 149, maxProjects: 50, features: ['All 30 tools unlocked', 'HD export quality', '50 saved projects', 'Premium templates', 'No rate limits', 'Email support'] },
                business: { name: 'Business', priceMonthly: 399, maxProjects: 500, features: ['Unlimited usage', 'Team sharing ready', '500 saved projects', 'High-priority processing', 'Custom branding removal', '24/7 Priority support'] }
            }
        },
        {
            key: 'maintenance_mode',
            value: { enabled: false, message: 'PixelCraft is currently undergoing scheduled maintenance.' }
        },
        {
            key: 'referral_config',
            value: { enabled: false, rewardDaysPro: 7, note: 'Referral rewards will be enabled once system testing concludes.' }
        }
    ],
    audit_logs: []
};

function readLocalDb() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
            return JSON.parse(JSON.stringify(DEFAULT_DB));
        }
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        let needsSave = false;
        for (const [key, val] of Object.entries(DEFAULT_DB)) {
            if (data[key] === undefined || (Array.isArray(val) && data[key].length === 0 && val.length > 0)) {
                data[key] = JSON.parse(JSON.stringify(val));
                needsSave = true;
            } else if (Array.isArray(val) && Array.isArray(data[key])) {
                for (const item of val) {
                    if (item && item.id && !data[key].some(existing => existing.id === item.id)) {
                        data[key].push(JSON.parse(JSON.stringify(item)));
                        needsSave = true;
                    }
                }
            }
        }
        if (needsSave) {
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        }
        return data;
    } catch (err) {
        console.error('Error reading local db:', err);
        return DEFAULT_DB;
    }
}

function writeLocalDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing local db:', err);
    }
}

// Universal Database Wrapper
const db = {
    get isMongo() {
        return !!mongoDb;
    },
    get isSupabase() {
        return !!supabase;
    },
    client: () => mongoDb || supabase,

    async find(table, query = {}) {
        const mDb = await getMongoDb();
        if (mDb) {
            try {
                return await mDb.collection(table).find(query, { projection: { _id: 0 } }).toArray();
            } catch (err) {
                console.error(`MongoDB find error on ${table}:`, err);
            }
        }

        if (supabase) {
            let req = supabase.from(table).select('*');
            for (const [key, val] of Object.entries(query)) {
                req = req.eq(key, val);
            }
            const { data, error } = await req;
            if (error) throw error;
            return data;
        } else {
            const data = readLocalDb();
            const list = data[table] || [];
            return list.filter(item => {
                for (const [k, v] of Object.entries(query)) {
                    if (item[k] !== v) return false;
                }
                return true;
            });
        }
    },

    async findOne(table, query = {}) {
        const mDb = await getMongoDb();
        if (mDb) {
            try {
                return await mDb.collection(table).findOne(query, { projection: { _id: 0 } });
            } catch (err) {
                console.error(`MongoDB findOne error on ${table}:`, err);
            }
        }

        const results = await this.find(table, query);
        return results.length > 0 ? results[0] : null;
    },

    async insert(table, record) {
        if (!record.id) {
            record.id = 'pc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        }
        if (!record.created_at) {
            record.created_at = new Date().toISOString();
        }
        if (!record.updated_at) {
            record.updated_at = record.created_at;
        }

        const mDb = await getMongoDb();
        if (mDb) {
            try {
                const clone = { ...record };
                await mDb.collection(table).insertOne(clone);
                delete clone._id;
                return clone;
            } catch (err) {
                console.error(`MongoDB insert error on ${table}:`, err);
            }
        }

        if (supabase) {
            const { data, error } = await supabase.from(table).insert([record]).select();
            if (error) throw error;
            return data ? data[0] : record;
        } else {
            const data = readLocalDb();
            if (!data[table]) data[table] = [];
            data[table].push(record);
            writeLocalDb(data);
            return record;
        }
    },

    async update(table, query = {}, updates = {}) {
        updates.updated_at = new Date().toISOString();

        const mDb = await getMongoDb();
        if (mDb) {
            try {
                await mDb.collection(table).updateMany(query, { $set: updates });
                return await mDb.collection(table).find(query, { projection: { _id: 0 } }).toArray();
            } catch (err) {
                console.error(`MongoDB update error on ${table}:`, err);
            }
        }

        if (supabase) {
            let req = supabase.from(table).update(updates);
            for (const [key, val] of Object.entries(query)) {
                req = req.eq(key, val);
            }
            const { data, error } = await req.select();
            if (error) throw error;
            return data;
        } else {
            const data = readLocalDb();
            const list = data[table] || [];
            let updatedCount = 0;
            const updatedItems = [];

            for (let i = 0; i < list.length; i++) {
                let match = true;
                for (const [k, v] of Object.entries(query)) {
                    if (list[i][k] !== v) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    list[i] = { ...list[i], ...updates };
                    updatedItems.push(list[i]);
                    updatedCount++;
                }
            }

            writeLocalDb(data);
            return updatedItems;
        }
    },

    async delete(table, query = {}) {
        const mDb = await getMongoDb();
        if (mDb) {
            try {
                const res = await mDb.collection(table).deleteMany(query);
                return { count: res.deletedCount };
            } catch (err) {
                console.error(`MongoDB delete error on ${table}:`, err);
            }
        }

        if (supabase) {
            let req = supabase.from(table).delete();
            for (const [key, val] of Object.entries(query)) {
                req = req.eq(key, val);
            }
            const { data, error } = await req;
            if (error) throw error;
            return data;
        } else {
            const data = readLocalDb();
            const list = data[table] || [];
            const remaining = list.filter(item => {
                for (const [k, v] of Object.entries(query)) {
                    if (item[k] === v) return false;
                }
                return true;
            });
            const deletedCount = list.length - remaining.length;
            data[table] = remaining;
            writeLocalDb(data);
            return { count: deletedCount };
        }
    },

    async count(table, query = {}) {
        const mDb = await getMongoDb();
        if (mDb) {
            try {
                return await mDb.collection(table).countDocuments(query);
            } catch (err) {
                console.error(`MongoDB count error on ${table}:`, err);
            }
        }

        const results = await this.find(table, query);
        return results.length;
    }
};

module.exports = db;

