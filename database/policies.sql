-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. PROJECTS POLICIES (Strict User Isolation)
CREATE POLICY "Users can view own projects or public projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- 3. FAVORITES POLICIES
CREATE POLICY "Users can view own favorites" 
ON favorites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" 
ON favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
ON favorites FOR DELETE 
USING (auth.uid() = user_id);

-- 4. TEMPLATES POLICIES
CREATE POLICY "Everyone can read active templates" 
ON templates FOR SELECT 
USING (is_active = true);

-- 5. SUPPORT MESSAGES
CREATE POLICY "Users can insert support messages" 
ON support_messages FOR INSERT 
WITH CHECK (true);

-- 6. ADMIN FULL ACCESS POLICIES (Checked via profile role)
CREATE POLICY "Admins have full access to profiles" 
ON profiles FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins have full access to projects" 
ON projects FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins have full access to tool_usage" 
ON tool_usage FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins have full access to support_messages" 
ON support_messages FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins have full access to platform_settings" 
ON platform_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

