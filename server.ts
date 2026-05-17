import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
const PORT = 3000;

// Database Setup
const db = new Database('polytechnic.db');
db.pragma('journal_mode = WAL');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    photo_path TEXT,
    signature_path TEXT,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'approved',
    is_downloaded INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Database Migrations
function migrate() {
  const ensureColumn = (table: string, column: string, definition: string) => {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      if (!columns.some(c => c.name === column)) {
        console.log(`Adding column ${column} to table ${table}...`);
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`✅ Successfully added column ${column}`);
      }
    } catch (e: any) {
      console.error(`❌ Migration error for ${table}.${column}:`, e.message);
    }
  };

  // Add columns to admins
  ensureColumn('admins', 'email', 'TEXT');

  // Add columns to students
  ensureColumn('students', 'father_name', 'TEXT');
  ensureColumn('students', 'mother_name', 'TEXT');
  ensureColumn('students', 'guardian_mobile', 'TEXT');
  ensureColumn('students', 'village', 'TEXT');
  ensureColumn('students', 'post_office', 'TEXT');
  ensureColumn('students', 'upazilla', 'TEXT');
  ensureColumn('students', 'district', 'TEXT');
  ensureColumn('students', 'valid_upto', 'TEXT');
  ensureColumn('students', 'is_downloaded', 'INTEGER DEFAULT 0');

  // Add unique index for admin email to handle uniqueness safely
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_email ON admins(email)`);
  } catch (e) {}

  // Ensure default admin has an email
  try {
    const admin = db.prepare("SELECT * FROM admins WHERE username = 'admin'").get() as any;
    if (admin && (!admin.email || admin.email === '')) {
      db.prepare("UPDATE admins SET email = 'admin@gmail.com' WHERE username = 'admin'").run();
    }
  } catch (e) {}

  // Ensure all students have approved status
  try {
    db.prepare("UPDATE students SET status = 'approved'").run();
  } catch (e) {}
}

migrate();

// Insert default settings if not exists
const defaultSettings = [
  { key: 'id_card_template', value: 'classic' },
  { key: 'show_hologram', value: 'true' },
  { key: 'expiry_years', value: '4' },
  { key: 'principal_signature_path', value: '' },
  { key: 'registrar_signature_path', value: '' },
  { key: 'custom_template_front_path', value: '' },
  { key: 'custom_template_back_path', value: '' },
  { key: 'field_positions', value: JSON.stringify({
    front: {
      logo: { x: 210, y: 15, w: 60, h: 60, visible: true },
      institute_name: { x: 25, y: 85, w: 430, visible: true },
      id_title: { x: 130, y: 115, w: 220, visible: true },
      photo: { x: 140, y: 145, w: 200, h: 220, visible: true },
      name: { x: 240, y: 380, visible: true },
      technology: { x: 240, y: 420, visible: true },
      roll: { x: 240, y: 450, visible: true },
      shift: { x: 240, y: 480, visible: true },
      semester: { x: 240, y: 510, visible: true },
      session: { x: 240, y: 545, visible: true },
      registrar_sign: { x: 60, y: 580, w: 150, h: 40, visible: true },
      principal_sign: { x: 320, y: 580, w: 150, h: 40, visible: true }
    },
    back: {
      institute_name: { x: 10, y: 10, w: 460, visible: true },
      valid_upto: { x: 120, y: 60, w: 240, visible: true },
      personal_details_header: { x: 160, y: 100, visible: true },
      fathers_name: { x: 40, y: 140, visible: true },
      mothers_name: { x: 40, y: 170, visible: true },
      blood_group: { x: 40, y: 200, visible: true },
      guardian_mobile: { x: 40, y: 230, visible: true },
      student_mobile: { x: 40, y: 260, visible: true },
      address: { x: 40, y: 290, visible: true },
      return_instructions: { x: 40, y: 350, w: 400, h: 100, visible: true },
      vertical_code: { x: 20, y: 300, visible: true }
    }
  }) },
  { key: 'id_card_instructions', value: JSON.stringify([
    'কার্ডটি অবশ্যই সবসময় সাথে রাখতে হবে এবং চাইলে প্রদর্শন করতে হবে।',
    'অনুমতি ব্যতিত কার্ডটি অন্য কাউকে হস্তান্তর করা দণ্ডনীয় অপরাধ।',
    'কার্ডটি হারিয়ে গেলে অবিলম্বে কর্তৃপক্ষকে অবহিত করতে হবে।',
    'কার্ডটিতে কাটাকাটি বা ঘষামাজা করা নিষিদ্ধ।'
  ]) },
  { key: 'college_address', value: 'শেরপুর পলিটেকনিক ইনস্টিটিউট, শেরপুর সদর, শেরপুর।' }
];

defaultSettings.forEach(s => {
  const exists = db.prepare('SELECT count(*) as count FROM settings WHERE key = ?').get(s.key) as { count: number };
  if (exists.count === 0) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(s.key, s.value);
  }
});

// Insert default admin if not exists
const adminCount = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
if (adminCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, email, password, full_name) VALUES (?, ?, ?, ?)')
    .run('admin', 'admin@gmail.com', hashedPassword, 'Super Admin');
}

async function startServer() {
  const app = express();
  
  // Basic Health Check for infrastructure
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  const upload = multer({ storage });

  // --- Auth API ---

  // Admin Login
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email) as any;
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, role: 'admin' } });
  });

  // Student Signup
  app.post('/api/student/signup', upload.fields([{ name: 'photo', maxCount: 1 }]), (req: any, res: Response) => {
    try {
      const data = req.body;
      const files = req.files;
      
      const hashedPassword = bcrypt.hashSync(data.password, 10);
      const photoPath = files.photo ? `/uploads/${files.photo[0].filename}` : null;

      const stmt = db.prepare(`
        INSERT INTO students (
          full_name_bn, full_name_en, roll_number, reg_number, session, technology, 
          semester, shift, blood_group, mobile, email, dob, address, 
          father_name, mother_name, guardian_mobile,
          village, post_office, upazilla, district, valid_upto,
          photo_path, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        data.full_name_bn, data.full_name_en, data.roll_number, data.reg_number, data.session, data.technology,
        data.semester, data.shift, data.blood_group, data.mobile, data.email, data.dob, data.address,
        data.father_name, data.mother_name, data.guardian_mobile,
        data.village, data.post_office, data.upazilla, data.district, data.valid_upto,
        photoPath, hashedPassword
      );

      res.status(201).json({ message: 'নিবন্ধন সফল হয়েছে। আপনি এখন লগইন করতে পারবেন।' });
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Roll, Reg or Email already exists.' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Student Login
  app.post('/api/student/login', (req, res) => {
    const { roll_number, password } = req.body;
    const student = db.prepare('SELECT * FROM students WHERE roll_number = ?').get(roll_number) as any;
    if (!student || !bcrypt.compareSync(password, student.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: student.id, role: 'student' }, JWT_SECRET, { expiresIn: '1d' });
    delete student.password;
    res.json({ token, user: { ...student, role: 'student' } });
  });

  // Update Student Profile
  app.patch('/api/student/profile/:id', upload.fields([{ name: 'photo', maxCount: 1 }]), (req: any, res: Response) => {
    try {
      const { id } = req.params;
      console.log(`Updating profile for user ID: ${id}`);
      const data = req.body || {};
      const files = (req.files as any) || {};

      // Prepare fields to update
      const updates: string[] = [];
      const values: any[] = [];

      const allowedFields = [
        'full_name_bn', 'full_name_en', 'session', 'technology', 
        'semester', 'shift', 'blood_group', 'mobile', 'email', 'dob', 'address',
        'father_name', 'mother_name', 'guardian_mobile',
        'village', 'post_office', 'upazilla', 'district', 'valid_upto'
      ];

      allowedFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          updates.push(`${field} = ?`);
          values.push(data[field]);
        }
      });

      if (files.photo && files.photo[0]) {
        updates.push(`photo_path = ?`);
        values.push(`/uploads/${files.photo[0].filename}`);
      }

      if (data.password) {
        updates.push(`password = ?`);
        values.push(bcrypt.hashSync(data.password, 10));
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      db.prepare(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`).run(...values);

      const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
      delete updatedStudent.password;
      res.json({ message: 'প্রোফাইল আপডেট সফল হয়েছে', user: { ...updatedStudent, role: 'student' } });
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'ইমেইল ইতিমধ্যে ব্যবহার করা হয়েছে।' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // --- Admin Logic ---
  
  app.get('/api/settings', (req, res) => {
    const rows = db.prepare('SELECT * FROM settings').all() as any[];
    const settings: any = {};
    rows.forEach(r => {
      let val: any = r.value;
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      if (!isNaN(val) && val !== '') val = Number(val);
      settings[r.key] = val;
    });
    res.json(settings);
  });

  app.post('/api/admin/settings', upload.fields([
    { name: 'principal_signature', maxCount: 1 },
    { name: 'registrar_signature', maxCount: 1 },
    { name: 'custom_template_front', maxCount: 1 },
    { name: 'custom_template_back', maxCount: 1 }
  ]), (req: any, res: Response) => {
    const data = req.body;
    const files = req.files as any;

    try {
      const updates = { ...data };
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

      const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      Object.entries(updates).forEach(([key, value]) => {
        stmt.run(key, String(value));
      });

      res.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/students', (req, res) => {
    const students = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
    res.json(students);
  });

  app.patch('/api/admin/students/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE students SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Status updated' });
  });

  app.delete('/api/admin/students/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    res.json({ message: 'Student deleted' });
  });

  app.patch('/api/admin/students/:id/downloaded', (req, res) => {
    const { id } = req.params;
    db.prepare('UPDATE students SET is_downloaded = 1 WHERE id = ?').run(id);
    res.json({ message: 'Marked as downloaded' });
  });

  app.get('/api/admin/stats', (req, res) => {
    const total = db.prepare('SELECT count(*) as count FROM students').get() as any;
    const pending = db.prepare("SELECT count(*) as count FROM students WHERE status = 'pending'").get() as any;
    const approved = db.prepare("SELECT count(*) as count FROM students WHERE status = 'approved'").get() as any;
    const printed = db.prepare("SELECT count(*) as count FROM students WHERE is_downloaded = 1").get() as any;
    res.json({
      total: total.count,
      pending: pending.count,
      approved: approved.count,
      printed: printed.count
    });
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
