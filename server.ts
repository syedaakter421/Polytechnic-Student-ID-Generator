import dotenv from 'dotenv';
dotenv.config();

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
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('⚠️ WARNING: JWT_SECRET environment variable is missing.');
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ CRITICAL ERROR: JWT_SECRET MUST be set in production environment. Exiting.');
      process.exit(1);
    }
    return 'fallback_secret_for_dev_only_1234567890';
  }
  return secret;
})();
const PORT = 3000;

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Security & Auth Middlewares ---
function authenticateToken(req: any, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'টোকেন পাওয়া যায়নি (Unauthorized)' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'অবৈধ টোকেন (Forbidden)' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req: any, res: Response, next: any) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'অ্যাডমিন অ্যাক্সেস প্রয়োজন' });
  }
  next();
}

function requireStudentOrAdmin(req: any, res: Response, next: any) {
  const { id } = req.params;
  if (req.user?.role === 'admin') {
    return next();
  }
  if (req.user?.role === 'student' && req.user?.id === id) {
    return next();
  }
  return res.status(403).json({ error: 'প্রোফাইল পরিবর্তনের অনুমতি নেই' });
}

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
await seedAdmin();

const app = express();

// Basic Health Check for infrastructure
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper function to download images safely using Node https module with custom user agents (and follow redirects)
function downloadImageWithHttps(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    };
    
    https.get(url, requestOptions, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Recursively follow redirect
        downloadImageWithHttps(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Server returned status code ${res.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Proxy endpoint to immediately serve highly accurate offline vector SVG of the Government Seal of Bangladesh.
// This completely avoids any external network requests, preventing Wikimedia 400/403 blocks in Cloud Run / Render environments.
app.get('/api/govt-seal', (req, res) => {
  const sealSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="140" height="140">
    <circle cx="50" cy="50" r="48" fill="#006a4e" stroke="#f2a900" stroke-width="2.5" />
    <circle cx="50" cy="50" r="26" fill="#f42a41" />
    <circle cx="50" cy="50" r="21" fill="none" stroke="#f2a900" stroke-width="1.2" stroke-dasharray="3 1.5" />
    <path d="M 50,30 Q 51.5,33 54.5,35 Q 55.5,36 58.5,38 Q 59.5,40 56.5,43 Q 56.5,45 53.5,46 Q 53.5,48 54.5,51 Q 53.5,52 49.5,53 Q 48.5,54 47.5,59 Q 45.5,60 43.5,62 Q 42.5,63 45.5,65 Q 44.5,67 Q 41.5,68 38.5,65 Q 37.5,66 39.5,70 37.5,71 Q 35.5,71 36.5,68 35.5,67 Q 36.5,64 41.5,60 Q 42.5,59 41.5,56 43.5,55 Q 44.5,54 43.5,49 Q 42.5,47 45.5,43 Q 45.5,41 43.5,40 Q 43.5,38 Q 44.5,36 48.5,36 Z" fill="#f2a900" />
    <defs>
      <path id="textPathTop" d="M 12,50 A 38,38 0 0,1 88,50" fill="none" />
      <path id="textPathBottom" d="M 88,50 A 38,38 0 0,1 12,50" fill="none" />
    </defs>
    <text fill="#ffffff" font-size="7.8" font-weight="bold" font-family="sans-serif">
      <textPath href="#textPathTop" startOffset="50%" text-anchor="middle">গণপ্রজাতন্ত্রী বাংলাদেশ</textPath>
    </text>
    <text fill="#ffffff" font-size="8.5" font-weight="black" font-family="sans-serif">
      <textPath href="#textPathBottom" startOffset="50%" text-anchor="middle">সরকার</textPath>
    </text>
    <g fill="#ffffff" transform="translate(13, 44) scale(0.6)">
      <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
    </g>
    <g fill="#ffffff" transform="translate(13, 56) scale(0.6)">
      <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
    </g>
    <g fill="#ffffff" transform="translate(75, 44) scale(0.6)">
      <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
    </g>
    <g fill="#ffffff" transform="translate(75, 56) scale(0.6)">
      <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
    </g>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(Buffer.from(sealSvg));
});

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
  
  const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error('শুধুমাত্র ছবি আপলোড করা যাবে (.jpg, .jpeg, .png, .gif, .webp)'));
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // --- Auth API ---

  // Admin Login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Let's attempt Supabase look up
      const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
      
      if (!error && admin) {
        if (bcrypt.compareSync(password, admin.password)) {
          const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
          return res.json({ 
            token, 
            user: { 
              id: admin.id, 
              username: admin.username, 
              email: admin.email, 
              full_name: admin.full_name, 
              role: 'admin' 
            } 
          });
        }
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Admin Profile (including password)
  app.patch('/api/admin/profile', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id, full_name, password } = req.body;
      if (!id) return res.status(400).json({ error: 'Admin ID required' });

      const updates: any = {};
      if (full_name) updates.full_name = full_name;
      if (password) updates.password = bcrypt.hashSync(password, 10);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: updatedAdmin, error } = await supabase
        .from('admins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

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
      
      let photoPath = null;
      if (files && files.photo && files.photo[0]) {
        try {
          const fileContent = fs.readFileSync(files.photo[0].path);
          const base64String = fileContent.toString('base64');
          const mimeType = files.photo[0].mimetype;
          photoPath = `data:${mimeType};base64,${base64String}`;
          // Clean up the temporary uploaded file
          fs.unlinkSync(files.photo[0].path);
        } catch (fileErr) {
          console.error('Error encoding photo to base64 during signup:', fileErr);
        }
      }

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
  app.patch('/api/student/profile/:id', authenticateToken, requireStudentOrAdmin, upload.fields([{ name: 'photo', maxCount: 1 }]), async (req: any, res: Response) => {
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
        try {
          const fileContent = fs.readFileSync(files.photo[0].path);
          const base64String = fileContent.toString('base64');
          const mimeType = files.photo[0].mimetype;
          updates.photo_path = `data:${mimeType};base64,${base64String}`;
          // Clean up the temporary uploaded file
          fs.unlinkSync(files.photo[0].path);
        } catch (fileErr) {
          console.error('Error encoding photo to base64 during profile update:', fileErr);
        }
      }

      if (data.password) {
        updates.password = bcrypt.hashSync(data.password, 10);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: updatedStudent, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      delete updatedStudent.password;
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

  app.post('/api/admin/settings', authenticateToken, requireAdmin, upload.fields([
    { name: 'principal_signature', maxCount: 1 },
    { name: 'registrar_signature', maxCount: 1 },
    { name: 'custom_template_front', maxCount: 1 },
    { name: 'custom_template_back', maxCount: 1 },
    { name: 'id_card_logo', maxCount: 1 }
  ]), async (req: any, res: Response) => {
    const data = req.body;
    const files = req.files as any;

    try {
      const updates: any = { ...data };
      
      const processBase64SettingFile = (fileField: any) => {
        if (fileField && fileField[0]) {
          try {
            const fileContent = fs.readFileSync(fileField[0].path);
            const base64String = fileContent.toString('base64');
            const mimeType = fileField[0].mimetype;
            const dataUrl = `data:${mimeType};base64,${base64String}`;
            // Clean up file from local storage
            fs.unlinkSync(fileField[0].path);
            return dataUrl;
          } catch (fileErr) {
            console.error(`Error encoding setting file to base64:`, fileErr);
          }
        }
        return null;
      };

      if (files.id_card_logo) {
        const url = processBase64SettingFile(files.id_card_logo);
        if (url) updates.id_card_logo_path = url;
      }
      if (files.principal_signature) {
        const url = processBase64SettingFile(files.principal_signature);
        if (url) updates.principal_signature_path = url;
      }
      if (files.registrar_signature) {
        const url = processBase64SettingFile(files.registrar_signature);
        if (url) updates.registrar_signature_path = url;
      }
      if (files.custom_template_front) {
        const url = processBase64SettingFile(files.custom_template_front);
        if (url) updates.custom_template_front_path = url;
      }
      if (files.custom_template_back) {
        const url = processBase64SettingFile(files.custom_template_back);
        if (url) updates.custom_template_back_path = url;
      }

      for (const [key, value] of Object.entries(updates)) {
        await supabase.from('settings').upsert({ key, value: String(value) });
      }

      res.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { data: students, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(students);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/students/:id/status', authenticateToken, requireAdmin, async (req, res) => {
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

  app.delete('/api/admin/students/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      res.json({ message: 'Student deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/students/:id/downloaded', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('students').update({ is_downloaded: 1 }).eq('id', id);
      if (error) throw error;
      res.json({ message: 'Marked as downloaded' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
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

  // Global Error Handler Definition
  const globalErrorHandler = (err: any, req: Request, res: Response, next: any) => {
    console.error('Global Server Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  };

  // --- Vite Middleware & Listening Configuration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use(globalErrorHandler);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.use(globalErrorHandler);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
