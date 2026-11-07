/**
 * PixelCraft Internationalization & RTL Engine (i18n)
 * Supports English (en), Hindi (hi), and Urdu (ur) with full RTL bidirectional support.
 * Preserves technical filenames, code, and user canvas text.
 */

const PixelCraftI18n = {
    currentLang: 'en',
    translations: {
        en: {
            nav_tools: 'All Tools',
            nav_workspace: 'Workspace',
            nav_pricing: 'Pricing',
            nav_marketplace: 'Templates',
            nav_community: 'Community',
            nav_login: 'Sign In',
            nav_signup: 'Get Started Free',
            hero_title: 'Create. Convert. Design. Simplify.',
            hero_subtitle: 'The all-in-one creative productivity suite for creators, developers, businesses, and designers. 30 powerful tools in one unified workspace.',
            search_placeholder: 'Search 30 tools (e.g., PDF Merge, Instagram Post, QR Code)...',
            badge_all_tools: '30 PRODUCTION TOOLS',
            btn_explore_tools: 'Explore Studio Tools',
            btn_upgrade_pro: 'Upgrade to Pro',
            btn_save: 'Save Changes',
            btn_cancel: 'Cancel',
            btn_download: 'Download',
            btn_preview: 'Preview',
            btn_apply_brand: 'Apply Brand Kit',
            modal_upgrade_title: 'Unlock Premium Feature',
            modal_upgrade_desc: 'Upgrade your workspace to access advanced studio tools, higher daily limits, and unlimited saved projects.',
            footer_tagline: 'Create. Convert. Design. Simplify.',
            footer_copyright: '© 2026 PixelCraft Inc. All rights reserved.',
            brand_kit_title: 'Brand Kit Studio',
            brand_kit_desc: 'Save your brand assets once and reuse them across all creative and business documents.',
            notifications_title: 'Notifications',
            no_notifications: 'No new notifications right now.',
            pwa_install_prompt: 'Install PixelCraft App for faster desktop and offline access.',
            pwa_install_btn: 'Install App'
        },
        hi: {
            nav_tools: 'सभी टूल्स',
            nav_workspace: 'कार्यस्थान',
            nav_pricing: 'मूल्य निर्धारण',
            nav_marketplace: 'टेम्पलेट्स',
            nav_community: 'समुदाय',
            nav_login: 'साइन इन करें',
            nav_signup: 'निःशुल्क शुरू करें',
            hero_title: 'बनाएं। बदलें। डिजाइन करें। सरल बनाएं।',
            hero_subtitle: 'क्रिएटर्स, डेवलपर्स, व्यवसायों और डिजाइनरों के लिए ऑल-इन-वन उत्पादकता सुइट। एक ही एकीकृत कार्यस्थान में 30 शक्तिशाली टूल्स।',
            search_placeholder: '30 टूल्स खोजें (उदा. PDF मर्ज, इंस्टाग्राम पोस्ट, QR कोड)...',
            badge_all_tools: '30 प्रोडक्शन टूल्स',
            btn_explore_tools: 'स्टूडियो टूल्स देखें',
            btn_upgrade_pro: 'प्रो में अपग्रेड करें',
            btn_save: 'परिवर्तन सहेजें',
            btn_cancel: 'रद्द करें',
            btn_download: 'डाउनलोड करें',
            btn_preview: 'पूर्वावलोकन',
            btn_apply_brand: 'ब्रांड किट लागू करें',
            modal_upgrade_title: 'प्रीमियम सुविधा अनलॉक करें',
            modal_upgrade_desc: 'उन्नत स्टूडियो टूल्स, उच्च दैनिक सीमा और असीमित परियोजनाओं के लिए अपग्रेड करें।',
            footer_tagline: 'बनाएं। बदलें। डिजाइन करें। सरल बनाएं।',
            footer_copyright: '© 2026 पिक्सेलक्राफ्ट इंक। सर्वाधिकार सुरक्षित।',
            brand_kit_title: 'ब्रांड किट स्टूडियो',
            brand_kit_desc: 'अपनी ब्रांड संपत्तियों को एक बार सहेजें और सभी दस्तावेज़ों में पुन: उपयोग करें।',
            notifications_title: 'सूचनाएं',
            no_notifications: 'अभी कोई नई सूचना नहीं है।',
            pwa_install_prompt: 'तेज़ डेस्कटॉप और ऑफलाइन उपयोग के लिए पिक्सेलक्राफ्ट ऐप इंस्टॉल करें।',
            pwa_install_btn: 'ऐप इंस्टॉल करें'
        },
        ur: {
            nav_tools: 'تمام ٹولز',
            nav_workspace: 'ورک اسپیس',
            nav_pricing: 'قیمتیں',
            nav_marketplace: 'ٹیمپلیٹس',
            nav_community: 'کمیونٹی',
            nav_login: 'سائن ان',
            nav_signup: 'مفت شروع کریں',
            hero_title: 'تخلیق کریں۔ تبدیل کریں۔ ڈیزائن کریں۔ آسان بنائیں۔',
            hero_subtitle: 'تخلیق کاروں، ڈویلپرز، کاروباری اداروں اور ڈیزائنرز کے لیے مکمل تخلیقی سوٹ۔ ایک ہی پلیٹ فارم پر 30 طاقتور ٹولز۔',
            search_placeholder: '30 ٹولز تلاش کریں (مثلاً پی ڈی ایف ضم، انسٹاگرام پوسٹ، کیو آر کوڈ)...',
            badge_all_tools: '30 فعال ٹولز',
            btn_explore_tools: 'اسٹوڈیو ٹولز دیکھیں',
            btn_upgrade_pro: 'پرو اپ گریڈ کریں',
            btn_save: 'محفوظ کریں',
            btn_cancel: 'منسوخ کریں',
            btn_download: 'ڈاؤنلوڈ',
            btn_preview: 'پیش نظارہ',
            btn_apply_brand: 'برانڈ کٹ لاگو کریں',
            modal_upgrade_title: 'پریمیم فیچر کھولیں',
            modal_upgrade_desc: 'جدید اسٹوڈیو ٹولز اور لامحدود پروجیکٹس کے لیے پرو پلان پر اپ گریڈ کریں۔',
            footer_tagline: 'تخلیق کریں۔ تبدیل کریں۔ ڈیزائن کریں۔ آسان بنائیں۔',
            footer_copyright: '© 2026 پکسل کرافٹ انکارپوریشن۔ جملہ حقوق محفوظ ہیں۔',
            brand_kit_title: 'برانڈ کٹ اسٹوڈیو',
            brand_kit_desc: 'اپنے برانڈ لوگو، رنگ اور فونٹس محفوظ کریں اور ہر ڈیزائن میں استعمال کریں۔',
            notifications_title: 'اطلاعات',
            no_notifications: 'اس وقت کوئی نئی اطلاع نہیں ہے۔',
            pwa_install_prompt: 'آف لائن اور تیز رسائی کے لیے پکسل کرافٹ ایپ انسٹال کریں۔',
            pwa_install_btn: 'ایپ انسٹال کریں'
        }
    },

    init() {
        const saved = localStorage.getItem('pixelcraft_lang') || 'en';
        this.setLanguage(saved, false);
        this.bindSelectors();
    },

    setLanguage(lang, reloadText = true) {
        if (!this.translations[lang]) lang = 'en';
        this.currentLang = lang;
        localStorage.setItem('pixelcraft_lang', lang);

        const htmlEl = document.documentElement;
        htmlEl.setAttribute('lang', lang);

        if (lang === 'ur') {
            htmlEl.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl-layout');
        } else {
            htmlEl.setAttribute('dir', 'ltr');
            document.body.classList.remove('rtl-layout');
        }

        if (reloadText) {
            this.translatePage();
        }

        // Update selector elements if present
        document.querySelectorAll('.lang-select').forEach(sel => {
            sel.value = lang;
        });
    },

    t(key) {
        const langDict = this.translations[this.currentLang] || this.translations.en;
        return langDict[key] || this.translations.en[key] || key;
    },

    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });
    },

    bindSelectors() {
        document.querySelectorAll('.lang-select').forEach(sel => {
            sel.value = this.currentLang;
            sel.onchange = (e) => {
                this.setLanguage(e.target.value, true);
            };
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PixelCraftI18n.init();
});

window.PixelCraftI18n = PixelCraftI18n;

