-- CREATE TABLES FOR SUPABASE (PostgreSQL)

-- 1. admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name_bn TEXT NOT NULL,
  full_name_en TEXT NOT NULL,
  roll_number TEXT UNIQUE NOT NULL,
  reg_number TEXT UNIQUE NOT NULL,
  session TEXT NOT NULL,
  technology TEXT NOT NULL,
  semester TEXT NOT NULL,
  shift TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  dob TEXT NOT NULL,
  address TEXT NOT NULL,
  father_name TEXT,
  mother_name TEXT,
  guardian_mobile TEXT,
  village TEXT,
  post_office TEXT,
  upazilla TEXT,
  district TEXT,
  valid_upto TEXT,
  photo_path TEXT,
  signature_path TEXT,
  password TEXT NOT NULL,
  rsl_roll TEXT,
  status TEXT DEFAULT 'pending',
  is_downloaded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. settings table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert Default Admin (Password: admin123)
-- Hash generated via bcrypt: $2a$10$Xm8O7S7v1F.X9/gHjG9S9.6f9v9.G9S9...
-- For direct SQL, you might need to hash it yourself or let the app do it.
-- INSERT INTO public.admins (username, email, password, full_name) 
-- VALUES ('admin', 'admin@gmail.com', '$2y$10$X7vW8X7... (hashed)', 'Super Admin');

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Students Policies
DROP POLICY IF EXISTS "Allow public read of students" ON public.students;
CREATE POLICY "Enable read for all" ON public.students FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON public.students FOR DELETE USING (true);

-- Settings Policies
DROP POLICY IF EXISTS "Allow public read of settings" ON public.settings;
CREATE POLICY "Enable all for settings" ON public.settings FOR ALL USING (true);

-- Admins Policies
CREATE POLICY "Enable all for admins" ON public.admins FOR ALL USING (true);

-- Add photo_path column to admins table if it doesn't exist
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS photo_path TEXT;


