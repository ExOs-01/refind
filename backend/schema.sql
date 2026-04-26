-- ============================================================
-- ReFind Database Schema
-- Run this entire file in your Supabase SQL Editor
-- Supabase Dashboard > SQL Editor > New Query > Paste > Run
-- ============================================================

-- 1. CATEGORY table
CREATE TABLE IF NOT EXISTS category (
  category_id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE
);

-- Seed categories
INSERT INTO category (category_name) VALUES
  ('Electronics'),
  ('Bags & Wallets'),
  ('Keys'),
  ('Clothing'),
  ('ID Cards'),
  ('Books'),
  ('Other')
ON CONFLICT DO NOTHING;

-- 2. USER table (separate from Supabase auth.users)
CREATE TABLE IF NOT EXISTS "user" (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone_number TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ITEM table
CREATE TABLE IF NOT EXISTS item (
  item_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'resolved')),
  location_found TEXT,
  date_reported DATE NOT NULL,
  photo_url TEXT,
  category_id INTEGER REFERENCES category(category_id) ON DELETE SET NULL,
  posted_by UUID REFERENCES "user"(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. POST table (tracks when and who posted)
CREATE TABLE IF NOT EXISTS post (
  post_id SERIAL PRIMARY KEY,
  post_date DATE DEFAULT CURRENT_DATE,
  post_time TIME DEFAULT CURRENT_TIME,
  user_id UUID REFERENCES "user"(user_id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES item(item_id) ON DELETE CASCADE
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE item ENABLE ROW LEVEL SECURITY;
ALTER TABLE post ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;

-- Everyone can read items and categories
CREATE POLICY "items_read_all" ON item FOR SELECT USING (true);
CREATE POLICY "category_read_all" ON category FOR SELECT USING (true);
CREATE POLICY "post_read_all" ON post FOR SELECT USING (true);

-- Only authenticated users (via service key in backend) can insert/update
CREATE POLICY "items_insert_authenticated" ON item FOR INSERT WITH CHECK (true);
CREATE POLICY "items_update_authenticated" ON item FOR UPDATE USING (true);
CREATE POLICY "items_delete_admin" ON item FOR DELETE USING (true);
CREATE POLICY "post_insert_authenticated" ON post FOR INSERT WITH CHECK (true);
CREATE POLICY "user_insert" ON "user" FOR INSERT WITH CHECK (true);
CREATE POLICY "user_read_own" ON "user" FOR SELECT USING (true);

-- ============================================================
-- Storage bucket for photos
-- Run this too to create the photos bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'item-photos');

CREATE POLICY "photos_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'item-photos');
