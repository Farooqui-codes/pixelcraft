-- ====================================================================
-- SEED DATA FOR PIXELCRAFT
-- ====================================================================

-- Platform Settings
INSERT INTO platform_settings (key, value, description) VALUES
('pricing', '{
    "free": {"name": "Free", "priceMonthly": 0, "maxProjects": 5, "features": ["Access to standard tools", "Basic export quality", "5 saved projects", "Community support"]},
    "pro": {"name": "Pro", "priceMonthly": 149, "maxProjects": 50, "features": ["All 30 tools unlocked", "HD export quality", "50 saved projects", "Premium templates", "No rate limits", "Email support"]},
    "business": {"name": "Business", "priceMonthly": 399, "maxProjects": 500, "features": ["Unlimited usage", "Team sharing ready", "500 saved projects", "High-priority processing", "Custom branding removal", "24/7 Priority support"]}
}'::jsonb, 'Current subscription plans pricing and limits'),
('maintenance_mode', '{"enabled": false, "message": "PixelCraft is currently undergoing scheduled maintenance. We will be back shortly!"}'::jsonb, 'Global platform maintenance toggle'),
('referral_config', '{"enabled": false, "rewardDaysPro": 7, "note": "Referral program is currently in preview mode and rewards are not active."}'::jsonb, 'Referral system configuration');

-- Sample Initial Templates for Creator & Invitation Studios
INSERT INTO templates (title, tool_id, category, tier, config) VALUES
('Minimalist Instagram Quote', 'instagram-post', 'creator', 'free', '{"bg": "#101426", "text": "Craft your vision with precision.", "textColor": "#35B9FF", "fontSize": 38, "fontFamily": "Plus Jakarta Sans"}'),
('Neon Sale Banner', 'instagram-post', 'creator', 'pro', '{"bg": "linear-gradient(135deg, #7957FF, #FF6584)", "text": "FLASH SALE 50% OFF", "textColor": "#FFFFFF", "fontSize": 48, "fontFamily": "Inter"}'),
('YouTube Gaming Thumbnail', 'youtube-thumbnail', 'creator', 'free', '{"bg": "#1e1b4b", "text": "UNSTOPPABLE GAMEPLAY!", "textColor": "#FBBF24", "fontSize": 52, "badge": "EPISODE 01"}'),
('Corporate Business Invoice', 'invoice-generator', 'business', 'free', '{"template": "modern", "accentColor": "#10B981"}'),
('Royal Gold Wedding Card', 'wedding-invitation', 'invitation', 'pro', '{"bg": "#101426", "textColor": "#F59E0B", "fontFamily": "serif", "ornament": "golden-arch"}'),
('Arabic Calligraphy Nikah Invite', 'islamic-invitation', 'invitation', 'free', '{"bg": "#064e3b", "textColor": "#FDE68A", "bismillah": true, "rtl": true}');

