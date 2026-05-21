import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
const PORT = 3000;

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ensure default admin exists in Supabase
async function seedAdmin() {
  try {
    console.log('Ensuring default admin exists...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    // We use upsert with onConflict on username or email
    // This ensures if admin@gmail.com exists, its password is reset to admin123
    const { error } = await supabase.from('admins').upsert({
      username: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      full_name: 'Super Admin'
    }, { onConflict: 'email' });

    if (error) {
      console.error('Error seeding admin:', error.message);
    } else {
      console.log('✅ Default admin ensured: admin@gmail.com / admin123');
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
}

// --- Express App Setup ---
async function startServer() {
  await seedAdmin();
  const app = express();
  
  // Basic Health Check for infrastructure
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(cors());
  app.use(express.json());
  
  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  // Storage Config
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });
  const upload = multer({ storage });

  // --- Auth API ---

  // Admin Login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
      
      if (error || !admin || !bcrypt.compareSync(password, admin.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, role: 'admin' } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Admin Profile (including password)
  app.patch('/api/admin/profile', async (req, res) => {
    try {
      const { id, full_name, password } = req.body;
      if (!id) return res.status(400).json({ error: 'Admin ID required' });

      const updates: any = {};
      if (full_name) updates.full_name = full_name;
      if (password) updates.password = bcrypt.hashSync(password, 10);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: updatedAdmins, error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!updatedAdmins || updatedAdmins.length === 0) {
        return res.status(404).json({ error: 'অ্যাডমিন প্রোফাইল পাওয়া যায়নি বা আপডেট করা সম্ভব হয়নি।' });
      }

      const updatedAdmin = updatedAdmins[0];

      res.json({ 
        message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে', 
        user: { 
          id: updatedAdmin.id, 
          username: updatedAdmin.username, 
          email: updatedAdmin.email, 
          full_name: updatedAdmin.full_name, 
          role: 'admin' 
        } 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Student Signup
  app.post('/api/student/signup', upload.fields([{ name: 'photo', maxCount: 1 }]), async (req: any, res: Response) => {
    try {
      const data = req.body;
      const files = req.files;
      
      const hashedPassword = bcrypt.hashSync(data.password, 10);
      const photoPath = files.photo ? `/uploads/${files.photo[0].filename}` : null;

      const { error } = await supabase.from('students').insert([{
        full_name_bn: data.full_name_bn,
        full_name_en: data.full_name_en,
        roll_number: data.roll_number,
        reg_number: data.reg_number,
        session: data.session,
        technology: data.technology,
        semester: data.semester,
        shift: data.shift,
        blood_group: data.blood_group,
        mobile: data.mobile,
        email: data.email,
        dob: data.dob,
        address: data.address,
        father_name: data.father_name,
        mother_name: data.mother_name,
        guardian_mobile: data.guardian_mobile,
        village: data.village,
        post_office: data.post_office,
        upazilla: data.upazilla,
        district: data.district,
        valid_upto: data.valid_upto,
        photo_path: photoPath,
        password: hashedPassword
      }]);

      if (error) throw error;

      res.status(201).json({ message: 'নিবন্ধন সফল হয়েছে। আপনি এখন লগইন করতে পারবেন।' });
    } catch (error: any) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ error: 'Roll, Reg or Email already exists.' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Student Login
  app.post('/api/student/login', async (req, res) => {
    try {
      const { roll_number, password } = req.body;
      const { data: student, error } = await supabase.from('students').select('*').eq('roll_number', roll_number).single();
      
      if (error || !student || !bcrypt.compareSync(password, student.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: student.id, role: 'student' }, JWT_SECRET, { expiresIn: '1d' });
      delete student.password;
      res.json({ token, user: { ...student, role: 'student' } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Student Profile
  app.patch('/api/student/profile/:id', upload.fields([{ name: 'photo', maxCount: 1 }]), async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body || {};
      const files = (req.files as any) || {};

      const updates: any = {};
      const allowedFields = [
        'full_name_bn', 'full_name_en', 'session', 'technology', 
        'semester', 'shift', 'blood_group', 'mobile', 'email', 'dob', 'address',
        'father_name', 'mother_name', 'guardian_mobile',
        'village', 'post_office', 'upazilla', 'district', 'valid_upto'
      ];

      allowedFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          updates[field] = data[field];
        }
      });

      if (files.photo && files.photo[0]) {
        updates.photo_path = `/uploads/${files.photo[0].filename}`;
      }

      if (data.password) {
        updates.password = bcrypt.hashSync(data.password, 10);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: updatedStudents, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!updatedStudents || updatedStudents.length === 0) {
        return res.status(404).json({ error: 'প্রোফাইল পাওয়া যায়নি বা আপডেট করার পারমিশন নেই।' });
      }

      const updatedStudent = updatedStudents[0];
      if (updatedStudent) {
        delete updatedStudent.password;
      }
      res.json({ message: 'প্রোফাইল আপডেট সফল হয়েছে', user: { ...updatedStudent, role: 'student' } });
    } catch (error: any) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return res.status(400).json({ error: 'ইমেইল ইতিমধ্যে ব্যবহার করা হয়েছে।' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // --- Admin Logic ---
  
  app.get('/api/settings', async (req, res) => {
    try {
      const { data: rows, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const settings: any = {};
      rows.forEach(r => {
        let val: any = r.value;
        if (val === 'true') val = true;
        if (val === 'false') val = false;
        if (!isNaN(val) && val !== '') val = Number(val);
        settings[r.key] = val;
      });
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/settings', upload.fields([
    { name: 'principal_signature', maxCount: 1 },
    { name: 'registrar_signature', maxCount: 1 },
    { name: 'custom_template_front', maxCount: 1 },
    { name: 'custom_template_back', maxCount: 1 }
  ]), async (req: any, res: Response) => {
    const data = req.body;
    const files = req.files as any;

    try {
      const updates: any = { ...data };
      if (files.principal_signature) {
        updates.principal_signature_path = `/uploads/${files.principal_signature[0].filename}`;
      }
      if (files.registrar_signature) {
        updates.registrar_signature_path = `/uploads/${files.registrar_signature[0].filename}`;
      }
      if (files.custom_template_front) {
        updates.custom_template_front_path = `/uploads/${files.custom_template_front[0].filename}`;
      }
      if (files.custom_template_back) {
        updates.custom_template_back_path = `/uploads/${files.custom_template_back[0].filename}`;
      }

      for (const [key, value] of Object.entries(updates)) {
        await supabase.from('settings').upsert({ key, value: String(value) });
      }

      res.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/students', async (req, res) => {
    try {
      const { data: students, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(students);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/students/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { error } = await supabase.from('students').update({ status }).eq('id', id);
      if (error) throw error;
      res.json({ message: 'Status updated' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/students/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      res.json({ message: 'Student deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/students/:id/downloaded', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('students').update({ is_downloaded: 1 }).eq('id', id);
      if (error) throw error;
      res.json({ message: 'Marked as downloaded' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/stats', async (req, res) => {
    try {
      const { count: total, error: e1 } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: pending, error: e2 } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: approved, error: e3 } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      const { count: printed, error: e4 } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_downloaded', 1);

      if (e1 || e2 || e3 || e4) throw e1 || e2 || e3 || e4;

      res.json({
        total: total || 0,
        pending: pending || 0,
        approved: approved || 0,
        printed: printed || 0
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Global Server Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
