import React, { useState, useEffect, useRef } from 'react';
import { User, Student, SystemSettings } from '../../types';
import { LogOut, LayoutDashboard, Users, FileText, Settings, Search, Check, X, Trash2, Printer, Eye, EyeOff, Download, User as UserIcon, Menu, AlertTriangle, Loader2 } from 'lucide-react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import IDCard from '../IDCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { safeFetch } from '../../lib/fetchUtils';
import { saveAs } from 'file-saver';
import { toPng, toBlob } from 'html-to-image';
import Footer from '../Footer';

const convertToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }
    if (url.startsWith('data:')) {
      resolve(url);
      return;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.warn(`Fetch base64 conversion failed for ${url}, trying canvas fallback:`, err);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          } catch (e) {
            console.error('Canvas image conversion failed:', e);
          }
          resolve(url);
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
  });
};

const isExpired = (validUpto: string | undefined): boolean => {
  if (!validUpto) return false;
  const cleanStr = validUpto.trim().toLowerCase();
  if (!cleanStr) return false;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Try parsing directly as date
  const parsedTime = Date.parse(validUpto);
  if (!isNaN(parsedTime)) {
    return new Date(parsedTime) < currentDate;
  }

  // Handle year-only or month-year formats
  const yearMatch = cleanStr.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const months = [
      ['january', 'jan', '01', '1'],
      ['february', 'feb', '02', '2'],
      ['march', 'mar', '03', '3'],
      ['april', 'apr', '04', '4'],
      ['may', '05', '5'],
      ['june', 'jun', '06', '6'],
      ['july', 'jul', '07', '7'],
      ['august', 'aug', '08', '8'],
      ['september', 'sep', '09', '9'],
      ['october', 'oct', '10'],
      ['november', 'nov', '11'],
      ['december', 'dec', '12']
    ];

    let foundMonthIndex = -1;
    for (let i = 0; i < months.length; i++) {
      for (const alias of months[i]) {
        const regex = new RegExp(`\\b${alias}\\b`);
        if (regex.test(cleanStr)) {
          foundMonthIndex = i;
          break;
        }
      }
      if (foundMonthIndex !== -1) break;
    }

    if (foundMonthIndex !== -1) {
      if (year < currentYear) return true;
      if (year > currentYear) return false;
      return foundMonthIndex < currentMonth;
    } else {
      // Year only
      return year < currentYear;
    }
  }

  return false;
};

export default function AdminDashboard({ user, onLogout }: { user: User, onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Student List', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
    { to: '/admin/profile', label: 'Profile Settings', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen admin-page flex bg-slate-50 relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col p-4 shadow-xl z-[70] transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-200 shadow-sm overflow-hidden">
               <img src="/images/logo.png" className="w-full h-full object-contain" alt="Logo" />
             </div>
             <div>
               <h2 className="font-black text-slate-800 text-sm font-bengali leading-none">এডমিন প্যানেল</h2>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Admin Panel</p>
             </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-4 px-3">System Control</div>
          
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link 
                key={link.to}
                to={link.to} 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-gov-green text-white shadow-lg shadow-gov-green/20' : 'text-slate-600 hover:bg-gov-green/5 hover:text-gov-green'}`}
              >
                <Icon size={18} /> {link.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gov-red hover:bg-gov-red/5 transition-all text-sm font-bold">
              <LogOut size={18} /> Logout Session
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white h-auto py-4 border-b border-slate-200 px-4 md:px-8 flex items-center justify-between gap-4 shadow-sm sticky top-0 z-50">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setSidebarOpen(true)}
               className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-gov-green hover:text-white transition-all shadow-sm"
             >
               <Menu size={20} />
             </button>
             <h1 className="text-[11px] xs:text-xs sm:text-sm md:text-lg lg:text-xl font-black text-slate-800 font-bengali leading-tight">
               বাংলাদেশ কারিগরি শিক্ষা বোর্ড - <span className="text-gov-green">সেন্ট্রাল ডাটাবেস</span>
             </h1>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-black text-slate-800 block">{user.full_name}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">SHERPUR GOVT. POLYTECHNIC INSTITUTE</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-slate-200 rounded-xl md:rounded-2xl flex items-center justify-center p-1 shadow-md">
                   <img src="/images/logo.png" className="w-full h-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 md:p-2.5 bg-red-50 text-red-600 rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm group border border-red-100 hidden xs:block"
                  title="Sign Out"
                >
                  <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
           </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 flex-1 bg-slate-50">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/students" element={<StudentManagement />} />
            <Route path="/settings" element={<SettingsManagement />} />
            <Route path="/profile" element={<AdminProfile user={user} />} />
            <Route path="*" element={<div className="p-10 md:p-20 text-center text-slate-400 font-bengali bg-white rounded-3xl border border-dashed border-slate-200">সেকশনটি শীঘ্রই আপডেট করা হবে।</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function AdminProfile({ user }: { user: User }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'পাসওয়ার্ড মেলেনি।' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const payload: any = { id: user.id, full_name: formData.full_name };
      if (formData.password) payload.password = formData.password;

      const data = await safeFetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (formData.password) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }

      setStatus({ type: 'success', message: data.message });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
      // Update local storage user if needed or reload
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...u, full_name: formData.full_name }));
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gov-green/10 text-gov-green rounded-2xl flex items-center justify-center">
            <UserIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black font-bengali text-slate-800">প্রোফাইল সেটিংস</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Update Admin Profile & Password</p>
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 font-bengali text-sm border ${
            status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {status.type === 'success' ? <Check size={18} /> : <X size={18} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
            <input 
              required
              type="text"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gov-green/20 transition-all font-medium"
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password (Optional)</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Leave blank to keep current password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gov-green/20 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gov-green/20 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gov-green text-white rounded-2xl font-black text-lg hover:bg-gov-green-dark transition-all shadow-xl shadow-gov-green/10 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? 'প্রসেসিং...' : 'আপডেট করুন'}
            <Check size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}

function SettingsManagement() {
  const [settings, setSettings] = useState<any>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchSettings = () => {
    safeFetch('/api/settings')
      .then(setSettings)
      .catch(err => console.error('Settings fetch error:', err));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [name]: url }));
    }
  };

  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  const updatePosition = (key: string, field: string, value: any) => {
    const newPositions = JSON.parse(settings.field_positions);
    newPositions[activeSide][key][field] = value;
    setSettings({...settings, field_positions: JSON.stringify(newPositions)});
  };

  const getPositions = () => {
    if (!settings.field_positions) return {};
    const parsed = JSON.parse(settings.field_positions);
    return parsed[activeSide] || {};
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    
    try {
      await safeFetch('/api/admin/settings', {
        method: 'POST',
        body: formData
      });
      setStatus({ type: 'success', message: 'সেটিংস সফলভাবে আপডেট হয়েছে।' });
      setPreviews({}); // Clear local previews
      fetchSettings(); // Refresh settings to show new uploads
      
      // Clear success message after 5 seconds
      setTimeout(() => setStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'সেটিংস আপডেট ব্যর্থ হয়েছে: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-20 text-center text-slate-400 font-bengali">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 font-bengali text-sm shadow-sm border ${
            status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          {status.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {status.message}
        </motion.div>
      )}
      <div className="bg-white p-4 md:p-8 rounded-[24px] md:rounded-[32px] shadow-xl border border-slate-100">
        <h2 className="text-xl md:text-2xl font-black font-bengali text-slate-800 mb-6 md:mb-8 border-b border-slate-100 pb-4">Smart ID Card Generator সেটিংস</h2>
        
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block font-bengali mb-4">আইডি কার্ড টেম্পলেট</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border-2 border-gov-green bg-gov-green/5 ring-4 ring-gov-green/10 transition-all text-left">
                <p className="text-sm font-black text-gov-green">Sherpur Official</p>
                <p className="text-[10px] text-slate-400 mt-1">Hardcoded System Design</p>
              </div>
            </div>
            <input type="hidden" name="id_card_template" value="sherpur" />
            <input type="hidden" name="field_positions" value={settings.field_positions || ''} />
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block font-bengali">আইডি কার্ড লোগো (ID Card Logo)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative group">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col items-center transition-all group-hover:border-gov-green/50 hover:bg-slate-50 bg-white">
                   {(previews.id_card_logo || settings.id_card_logo_path) ? (
                      <div className="relative flex flex-col items-center animate-in fade-in duration-300">
                        <img src={previews.id_card_logo || settings.id_card_logo_path} className="h-24 w-24 object-contain mb-4" alt="ID Card Logo" />
                        <span className="text-[10px] text-slate-400 block text-center uppercase tracking-widest">বর্তমান লোগো (Current Logo)</span>
                      </div>
                   ) : (
                      <div className="text-slate-300 flex flex-col items-center">
                        <Download size={32} className="mb-2 rotate-180" />
                        <span className="text-[10px] md:text-xs font-bold font-bengali">নতুন লোগো আপলোড করুন</span>
                      </div>
                   )}
                   <input type="file" name="id_card_logo" onChange={(e) => handleFileChange(e, 'id_card_logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              <div className="text-slate-500 text-xs md:text-sm space-y-2 font-bengali">
                <p className="font-bold text-slate-700">লোগো সংক্রান্ত তথ্য:</p>
                <p>• আইডি কার্ডে প্রদর্শিত হওয়ার জন্য একটি বর্গাকৃতির লোগো আপলোড করা বাঞ্ছনীয়।</p>
                <p>• সাপোর্ট করা ফাইল ফরম্যাট: PNG, JPG, বা SVG।</p>
                <p>• এই লোগোটি সরাসরি আইডি কার্ডের প্রধান লোগো হিসেবে ব্যবহৃত হবে।</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 pt-8 border-t border-slate-100">
            {/* Signatures */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block font-bengali">অধ্যক্ষের স্বাক্ষর (Principal)</label>
              <div className="relative group">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col items-center transition-all group-hover:border-gov-green/50 hover:bg-slate-50">
                   {(previews.principal_signature || settings.principal_signature_path) ? (
                      <div className="relative">
                        <img src={previews.principal_signature || settings.principal_signature_path} className="h-12 md:h-16 w-auto object-contain mb-4" alt="Principal Sign" />
                        <span className="text-[8px] text-slate-400 block text-center uppercase tracking-widest">Current Signature</span>
                      </div>
                   ) : (
                      <div className="text-slate-300 flex flex-col items-center">
                        <Download size={32} className="mb-2 rotate-180" />
                        <p className="text-[10px] md:text-xs font-bold">আপলোড করুন</p>
                      </div>
                   )}
                   <input type="file" name="principal_signature" onChange={(e) => handleFileChange(e, 'principal_signature')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block font-bengali">রেজিস্ট্রারের স্বাক্ষর (Registrar)</label>
              <div className="relative group">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col items-center transition-all group-hover:border-gov-green/50 hover:bg-slate-50">
                   {(previews.registrar_signature || settings.registrar_signature_path) ? (
                      <div className="relative">
                        <img src={previews.registrar_signature || settings.registrar_signature_path} className="h-12 md:h-16 w-auto object-contain mb-4" alt="Registrar Sign" />
                        <span className="text-[8px] text-slate-400 block text-center uppercase tracking-widest">Current Signature</span>
                      </div>
                   ) : (
                      <div className="text-slate-300 flex flex-col items-center">
                        <Download size={32} className="mb-2 rotate-180" />
                        <p className="text-[10px] md:text-xs font-bold">আপলোড করুন</p>
                      </div>
                   )}
                   <input type="file" name="registrar_signature" onChange={(e) => handleFileChange(e, 'registrar_signature')} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 md:pt-8">
            <button 
              disabled={saving}
              className="w-full sm:w-auto bg-gov-green text-white px-8 md:px-12 py-3 md:py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              {saving ? 'আপডেট হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
              <Check size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminHome() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, printed: 0 });
  const [recent, setRecent] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    safeFetch('/api/admin/stats')
      .then(setStats)
      .catch((err) => {
        console.error('Stats error:', err);
        setError(err.message);
      });
      
    safeFetch('/api/admin/students')
      .then(data => {
        const sorted = (Array.isArray(data) ? data : [])
          .sort((a, b) => {
            if (a.is_downloaded !== b.is_downloaded) {
              return a.is_downloaded - b.is_downloaded;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        setRecent(sorted);
      })
      .catch((err) => console.error('Recent students error:', err));
  }, []);

  return (
    <div className="space-y-6 md:space-y-10">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 font-bengali text-sm">
          <X size={18} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
         <StatsCard label="মোট স্টুডেন্ট" value={stats.total.toString()} color="bg-blue-600" />
         <StatsCard label="প্রিন্টেড কার্ড" value={stats.printed.toString()} color="bg-purple-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
           <h3 className="font-bold text-lg font-bengali">সাম্প্রতিক রেজিস্ট্রেশন</h3>
           <Link to="/admin/students" className="text-gov-green text-sm font-bold border border-gov-green px-4 py-1 rounded-full hover:bg-gov-green hover:text-white transition-all font-bengali">সব দেখুন</Link>
        </div>
        <div className="p-0 overflow-x-auto">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase text-[11px] font-bold">
                 <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Technology</th>
                    <th className="px-6 py-4">Roll</th>
                 </tr>
              </thead>
              <tbody className="divide-y">
                 {recent.map(student => (
                   <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                         {student.full_name_en}
                         
                       </td>
                      <td className="px-6 py-4">{student.technology}</td>
                      <td className="px-6 py-4 text-gray-500">{student.roll_number}</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [downloadFilter, setDownloadFilter] = useState<'all' | 'new' | 'downloaded' | 'expired'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalMode, setModalMode] = useState<'details' | 'idcard' | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [processingStudent, setProcessingStudent] = useState<Student | null>(null);
  const [currentStudentPhotoBase64, setCurrentStudentPhotoBase64] = useState('');
  const [currentRegistrarSigBase64, setCurrentRegistrarSigBase64] = useState('');
  const [currentPrincipalSigBase64, setCurrentPrincipalSigBase64] = useState('');
  const [currentGovLogoBase64, setCurrentGovLogoBase64] = useState('');
  const batchFrontRef = useRef<HTMLDivElement>(null);
  const batchBackRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    safeFetch('/api/settings').then(setSettings).catch(console.error);
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await safeFetch('/api/admin/students');
      setStudents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await safeFetch(`/api/admin/students/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchStudents();
    } catch (err: any) {
      console.error('Update status error:', err);
      alert('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে: ' + err.message);
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedStudentIds.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(selectedStudentIds.map(id => 
        safeFetch(`/api/admin/students/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      ));
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err: any) {
      console.error('Bulk update status error:', err);
      alert('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = (id: any) => {
    const student = students.find(s => s.id === id);
    if (student) {
      setStudentToDelete(student);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await safeFetch(`/api/admin/students/${studentToDelete.id}`, { method: 'DELETE' });
      setStudentToDelete(null);
      setSelectedStudent(null);
      setModalMode(null);
      fetchStudents();
    } catch (err: any) {
      console.error('Delete student error:', err);
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = students
    .filter(s => {
      const matchesSearch = s.full_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.roll_number.includes(searchTerm);
      const matchesSession = !sessionFilter || s.session === sessionFilter;
      const matchesTech = !techFilter || s.technology === techFilter;
      const matchesDownload = downloadFilter === 'all' || 
                              (downloadFilter === 'new' && !s.is_downloaded) || 
                              (downloadFilter === 'downloaded' && s.is_downloaded) ||
                              (downloadFilter === 'expired' && isExpired(s.valid_upto));
      return matchesSearch && matchesSession && matchesTech && matchesDownload;
    })
    .sort((a, b) => {
      if (a.is_downloaded !== b.is_downloaded) {
        return a.is_downloaded - b.is_downloaded;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const sessions = Array.from(new Set(students.map(s => s.session))).sort().reverse();
  const technologies = Array.from(new Set(students.map(s => s.technology))).sort();

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedStudents = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sessionFilter, techFilter, downloadFilter]);

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(20);
    doc.text('Sherpur Govt. Polytechnic Institute - Student List', 15, 15);
    doc.setFontSize(10);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, 15, 22);

    const headers = [['Full Name', 'Roll Number', 'Technology', 'Semester', 'Shift', 'Mobile']];
    const data = filtered.map(s => [
      s.full_name_en,
      s.roll_number,
      s.technology,
      s.semester,
      s.shift,
      s.mobile
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 30,
      theme: 'grid',
      headStyles: { fillBox: '#006a4e' },
    });

    doc.save('student_list.pdf');
  };

  const downloadAllNewPNGs = async () => {
    // Filter to only include NEW (undownloaded) students matching current filters
    const studentsToExport = students.filter(s => {
      const matchesSearch = s.full_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.roll_number.includes(searchTerm);
      const matchesSession = !sessionFilter || s.session === sessionFilter;
      const matchesTech = !techFilter || s.technology === techFilter;
      
      return !s.is_downloaded && matchesSearch && matchesSession && matchesTech;
    });

    if (studentsToExport.length === 0) {
      alert('ডাউনলোড করার মতো কোনো নতুন (NEW) আইডি কার্ড পাওয়া যায়নি।');
      return;
    }

    if (!confirm(`${studentsToExport.length} জন শিক্ষার্থীর নতুন (NEW) আইডি কার্ড পিএনজি (PNG) ফরম্যাটে ডাউনলোড হবে। অবিরত রাখতে চান?`)) return;

    setIsZipping(true);
    setZipProgress(0);
    let successCount = 0;

    try {
      await (document as any).fonts.ready;
      
      for (let i = 0; i < studentsToExport.length; i++) {
        const student = studentsToExport[i];
        setProcessingStudent(student);
        setZipProgress(Math.round((i / studentsToExport.length) * 100));
        
        try {
          const photoB64 = student.photo_path ? await convertToBase64(student.photo_path).catch(() => '') : '';
          const regB64 = settings?.registrar_signature_path ? await convertToBase64(settings.registrar_signature_path).catch(() => '') : '';
          const priB64 = settings?.principal_signature_path ? await convertToBase64(settings.principal_signature_path).catch(() => '') : '';
          const logoB64 = await convertToBase64("https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/300px-Government_Seal_of_Bangladesh.svg.png").catch(() => '');

          setCurrentStudentPhotoBase64(photoB64);
          setCurrentRegistrarSigBase64(regB64);
          setCurrentPrincipalSigBase64(priB64);
          setCurrentGovLogoBase64(logoB64);
        } catch (err) {
          console.error("Base64 preloading error:", err);
        }

        // Wait for rendering & images
        await new Promise(r => setTimeout(r, 1000));
        
        try {
          if (batchFrontRef.current && batchBackRef.current) {
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const downloadOptions = {
              pixelRatio: isMobile ? 1.5 : 2,
              skipFonts: false,
              cacheBust: true,
              backgroundColor: '#ffffff',
            };

            // Workaround for rendering: Pre-warm the canvas render pipeline twice
            await toPng(batchFrontRef.current, downloadOptions).catch(() => {});
            await toPng(batchBackRef.current, downloadOptions).catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 800));

            const dataUrlFront = await toPng(batchFrontRef.current, downloadOptions);
            const dataUrlBack = await toPng(batchBackRef.current, downloadOptions);
            
            if (dataUrlFront && dataUrlBack) {
              const linkFront = document.createElement('a');
              linkFront.download = `${student.roll_number}_FRONT.png`;
              linkFront.href = dataUrlFront;
              linkFront.click();

              await new Promise<void>((resolve) => {
                setTimeout(() => {
                  const linkBack = document.createElement('a');
                  linkBack.download = `${student.roll_number}_BACK.png`;
                  linkBack.href = dataUrlBack;
                  linkBack.click();
                  resolve();
                }, 450);
              });
              
              if (!student.is_downloaded) {
                await safeFetch(`/api/admin/students/${student.id}/downloaded`, { method: 'PATCH' });
              }
              successCount++;
            }
          }
        } catch (singleErr) {
          console.error(`Error saving student ${student.roll_number} PNG:`, singleErr);
        }
      }

      setZipProgress(100);
      if (successCount === 0) {
        alert('কোনো আইডি কার্ড জেনারেট করা সম্ভব হয়নি। অনুগ্রহ করে শিক্ষার্থীদের ছবি ও তথ্য পুনরায় চেক করুন।');
      }
      fetchStudents();
    } catch (err) {
      console.error('Download Error:', err);
      alert('আইডি কার্ড ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsZipping(false);
      setProcessingStudent(null);
    }
  };

  const renderFrontSide = (student: Student) => (
    <div ref={batchFrontRef} className="w-[791px] h-[1169px] bg-white rounded-[24px] border border-slate-300 relative overflow-hidden flex flex-col shrink-0 font-sans">
        <div className="relative h-full w-full bg-gradient-to-b from-white via-[#00a8c5] to-[#50c8d8] text-center overflow-hidden">
          <div className="pt-8">
            <div className="flex justify-center mb-4">
              <img 
                src={currentGovLogoBase64 || "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/300px-Government_Seal_of_Bangladesh.svg.png"} 
                className="w-[140px] h-[140px] object-contain" 
                alt="" 
                crossOrigin="anonymous" 
              />
            </div>
            <div className="w-full bg-[#004d61] py-3">
              <h1 className="text-[28px] font-black text-white uppercase tracking-tight">SHERPUR GOVT. POLYTECHNIC INSTITUTE, SHERPUR</h1>
            </div>
          </div>
          <div className="h-[320px] bg-[#dff3f6] [clip-path:ellipse(80%_100%_at_50%_0%)] flex justify-center">
            <div className="w-[340px] bg-[#ffcc29] -mt-1 p-[8px] rounded-b-[160px] h-[360px] shadow-xl z-10">
              <div className="text-[28px] font-black text-slate-800 mb-2 mt-2">Student ID Card</div>
              <div className="bg-slate-200 w-[260px] h-[280px] mx-auto rounded-b-[120px] border-[6px] border-white overflow-hidden shadow-inner flex items-center justify-center">
                {currentStudentPhotoBase64 || student.photo_path ? (
                  <img src={currentStudentPhotoBase64 || student.photo_path} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
                ) : (
                  <UserIcon size={100} className="text-slate-400" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-20 px-12 text-[#002d3a] flex flex-col items-center">
             <h2 className="text-[48px] font-black uppercase mb-4 tracking-wide">{student.full_name_en}</h2>
             <div className="space-y-1 w-full text-[28px]">
               <p className="flex justify-center gap-2"><span className="font-black">Technology :</span> <span className="font-bold uppercase">{student.technology}</span></p>
               <p className="flex justify-center gap-2"><span className="font-black">Roll No :</span> <span className="font-bold">{student.roll_number}</span></p>
               <p className="flex justify-center gap-2"><span className="font-black">Shift:</span> <span className="font-bold">{student.shift || 'SHIFT'}</span></p>
               <p className="flex justify-center gap-2 -mb-1"><span className="font-black">Semester:</span></p>
               <div className="flex justify-center gap-1.5 py-2">
                 {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(sem => (
                   <span 
                     key={sem} 
                     className="border-[2.5px] border-[#002d3a] w-[54px] h-[54px] flex items-center justify-center text-[18px] font-black"
                   >
                     {sem}
                   </span>
                 ))}
               </div>
               <p className="flex justify-center gap-2 mt-1"><span className="font-black">Session:</span> <span className="font-bold">{student.session}</span></p>
             </div>
          </div>
          <div className="absolute bottom-16 left-0 w-full px-20 flex justify-between">
            <div className="text-center w-[200px]">
              <div className="h-20 flex items-end justify-center mb-1">
                {(currentRegistrarSigBase64 || settings?.registrar_signature_path) && <img src={currentRegistrarSigBase64 || settings.registrar_signature_path} className="max-h-full" alt="" crossOrigin="anonymous" />}
              </div>
              <div className="border-t-2 border-[#002d3a] pt-1 font-black text-[22px]">Registrar</div>
            </div>
            <div className="text-center w-[200px]">
              <div className="h-20 flex items-end justify-center mb-1">
                {(currentPrincipalSigBase64 || settings?.principal_signature_path) && <img src={currentPrincipalSigBase64 || settings.principal_signature_path} className="max-h-full" alt="" crossOrigin="anonymous" />}
              </div>
              <div className="border-t-2 border-[#002d3a] pt-1 font-black text-[22px]">Principal</div>
            </div>
          </div>
        </div>
    </div>
  );

  const renderBackSide = (student: Student) => (
    <div ref={batchBackRef} className="w-[791px] h-[1169px] bg-white rounded-[24px] border border-slate-300 relative overflow-hidden flex flex-col shrink-0 font-sans">
        <div className="relative h-full w-full bg-white flex flex-col">
            <div className="h-[40px] bg-[#FFBC0D]"></div>
            <div className="bg-[#00a0be] text-white py-3 mt-[40px] text-center font-black text-[26px]">SHERPUR GOVT. POLYTECHNIC INSTITUTE, SHERPUR.</div>
            <div className="p-12 h-full flex flex-col items-center">
               <div className="flex items-center bg-slate-100 px-6 py-3 rounded-xl border-2 border-slate-200 shadow-inner mb-8">
                  <span className="text-[24px] font-black text-slate-800 mr-4">Valid Upto : </span>
                  <span className="text-[24px] font-black text-[#00a0be] uppercase tracking-wide">{student.valid_upto || '2027'}</span>
               </div>
               
               <div className="border-2 border-slate-800 rounded-full px-12 py-3 bg-slate-50 mb-8">
                 <h4 className="text-[22px] font-black uppercase text-slate-800 tracking-wider">Personal Details</h4>
               </div>

               <div className="w-full space-y-6 text-[25px] font-black text-slate-800 px-4">
                  <p className="flex border-b-2 border-slate-100 pb-2">Fathers Name : <span className="font-bold text-slate-600 ml-4">{student.father_name || 'N/A'}</span></p>
                  <p className="flex border-b-2 border-slate-100 pb-2">Mothers Name : <span className="font-bold text-slate-600 ml-4">{student.mother_name || 'N/A'}</span></p>
                  <p className="flex border-b-2 border-slate-100 pb-2">Blood Group : <span className="font-black text-red-600 ml-4">{student.blood_group || 'N/A'}</span></p>
                  <p className="flex border-b-2 border-slate-100 pb-2">Guardian Mobile : <span className="font-bold text-slate-600 ml-4">{student.guardian_mobile || 'N/A'}</span></p>
                  <p className="flex border-b-2 border-slate-100 pb-2">Student Mobile : <span className="font-bold text-slate-600 ml-4">{student.mobile || 'N/A'}</span></p>
               </div>

               <div className="mt-8 w-full">
                  <h4 className="text-[24px] font-black text-slate-800 mb-4 border-b-4 border-[#00a0be] inline-block pb-1">Address :</h4>
                  <div className="grid grid-cols-1 gap-4 text-[20px] font-bold text-slate-600 px-4">
                    <p>Village: {student.address}</p>
                  </div>
               </div>

               <div className="absolute bottom-8 left-0 w-full flex justify-center">
                  <div className="bg-[#00a0be] text-white p-6 w-[90%] rounded-2xl text-center shadow-xl">
                     <p className="text-[18px] font-black uppercase mb-2 leading-none">If found please return to</p>
                     <h3 className="text-[26px] font-black uppercase mb-1">SHERPUR GOVT. POLYTECHNIC INSTITUTE</h3>
                     <p className="text-[18px] font-bold mb-3">Bhatshala, Sherpur-2100, Contact: 01309136071</p>
                     <div className="border-t border-white/30 pt-3">
                        <p className="text-[16px] font-black tracking-widest">web: https://sherpur.polytech.gov.bd</p>
                     </div>
                  </div>
               </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hidden container for ZIP processing */}
      {processingStudent && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '791px',
          height: '2400px',
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -1000,
          background: '#ffffff'
        }}>
          {renderFrontSide(processingStudent)}
          <div style={{ marginTop: '50px' }}>
            {renderBackSide(processingStudent)}
          </div>
        </div>
      )}

      {isZipping && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-sm w-full space-y-6">
            <div className="w-20 h-20 bg-gov-green/10 text-gov-green rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Download size={40} />
            </div>
            <div>
              <h4 className="text-xl font-black font-bengali">আইডি কার্ড ডাউনলোড হচ্ছে...</h4>
              <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">{zipProgress}% COMPLETED</p>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
               <motion.div 
                 className="bg-gov-green h-full" 
                 initial={{ width: 0 }}
                 animate={{ width: `${zipProgress}%` }}
               />
            </div>
            <p className="text-xs text-slate-500 font-medium">অনুগ্রহ করে অপেক্ষা করুন, এটি কিছুক্ষণ সময় নিতে পারে।</p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-xl md:text-2xl font-bold font-bengali">শিক্ষার্থী ব্যবস্থাপনা</h3>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-gov-green/20 bg-white"
            value={techFilter}
            onChange={e => setTechFilter(e.target.value)}
          >
            <option value="">সকল টেকনোলজি</option>
            {technologies.map(tech => (
              <option key={tech} value={tech}>{tech}</option>
            ))}
          </select>

          <select 
            className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-gov-green/20 bg-white"
            value={sessionFilter}
            onChange={e => setSessionFilter(e.target.value)}
          >
            <option value="">সকল সেশন</option>
            {sessions.map(sess => (sess && (
              <option key={sess} value={sess}>{sess}</option>
            )))}
          </select>

          <select 
            className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-gov-green/20 bg-white font-bengali text-slate-700 font-bold"
            value={downloadFilter}
            onChange={e => setDownloadFilter(e.target.value as any)}
          >
            <option value="all">সকল আইডি কার্ড</option>
            <option value="new">নতুন আইডি কার্ড</option>
            <option value="expired">মেয়াদ উত্তীর্ণ আইডি কার্ড</option>
          </select>

          <div className="relative flex-1 md:flex-none">
             <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search by Name or Roll..." 
               className="pl-10 pr-4 py-2 border rounded-xl w-full md:w-72 focus:ring-2 focus:ring-gov-green/20"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
      </div>

      {selectedStudentIds.length > 0 && (
        <div className="bg-gov-green/5 border border-gov-green/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 font-bengali text-sm text-slate-800 font-bold animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="bg-gov-green/10 text-gov-green rounded-lg px-2.5 py-1 text-xs">
              {selectedStudentIds.length} জন নির্বাচিত
            </span>
            <span>শিক্ষার্থীর স্ট্যাটাস পরিবর্তন করুন:</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              onChange={async (e) => {
                const status = e.target.value;
                if (!status) return;
                const statusLabel =
                  status === 'approved' ? 'অনুমোদিত (Approved)' :
                  status === 'processing' ? 'প্রসেসিং (Processing)' :
                  status === 'printed' ? 'প্রিন্টেড (Printed)' :
                  status === 'rejected' ? 'প্রত্যাখ্যাত (Rejected)' :
                  'অপেক্ষমান (Pending)';
                
                if (confirm(`${selectedStudentIds.length} জন শিক্ষার্থীর স্ট্যাটাস "${statusLabel}" এ পরিবর্তন করতে চান?`)) {
                  await bulkUpdateStatus(status);
                }
                e.target.value = "";
              }}
              className="border rounded-xl px-4 py-2 bg-white text-sm text-slate-700 font-bold focus:ring-2 focus:ring-gov-green/25 flex-1 sm:flex-none"
            >
              <option value="">স্ট্যাটাস নির্বাচন করুন</option>
              <option value="pending">অপেক্ষমান (Pending)</option>
              <option value="approved">অনুমোদিত (Approved)</option>
              <option value="processing">প্রসেসিং (Processing)</option>
              <option value="printed">প্রিন্টেড (Printed)</option>
              <option value="rejected">প্রত্যাখ্যাত (Rejected)</option>
            </select>
            <button 
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl px-3 py-2 transition-all font-bold"
            >
              নির্বাচন বাতিল
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-full">
        {loading ? (
          <div className="p-20 text-center text-gray-400 font-bengali font-bold">লোডিং হচ্ছে...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b text-gray-500 uppercase text-[10px] font-bold whitespace-nowrap">
                   <tr>
                      <th className="px-4 py-4 w-12 text-center">
                        <input 
                          type="checkbox"
                          className="rounded border-slate-300 text-gov-green focus:ring-gov-green/20 cursor-pointer"
                          checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const pageIds = paginatedStudents.map(s => s.id);
                              setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
                            } else {
                              const pageIds = paginatedStudents.map(s => s.id);
                              setSelectedStudentIds(prev => prev.filter(id => !pageIds.includes(id)));
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y">
                   {paginatedStudents.map(student => (
                     <tr key={student.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="px-4 py-6 w-12 text-center">
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-gov-green focus:ring-gov-green/20 cursor-pointer"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-6 min-w-[280px]">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border shrink-0">
                               <img src={student.photo_path || '/default-user.png'} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className="whitespace-nowrap">
                               <div className="flex items-center gap-2">
                                 <p className="font-bold text-slate-800">{student.full_name_en}</p>
                                 
                               </div>
                               <p className="text-xs text-gray-500 font-bengali">{student.full_name_bn}</p>
                             </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 min-w-[160px] whitespace-nowrap">
                           <p className="text-xs font-bold text-gov-green">{student.technology}</p>
                           <p className="text-gray-500">Roll: {student.roll_number}</p>
                           <p className="text-gray-400 text-[10px]">Session: {student.session}</p>
                        </td>
                        <td className="px-6 py-4 min-w-[150px] text-center whitespace-nowrap">
                          <select
                            value={student.status || 'pending'}
                            onChange={(e) => updateStatus(student.id, e.target.value)}
                            className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border focus:ring-2 focus:ring-offset-1 focus:ring-gov-green/20 cursor-pointer font-bengali ${
                              student.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              student.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold' :
                              student.status === 'printed' ? 'bg-purple-50 text-purple-700 border-purple-200 font-extrabold' :
                              student.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="pending" className="text-slate-700">অপেক্ষমান (Pending)</option>
                            <option value="approved" className="text-slate-700">অনুমোদিত (Approved)</option>
                            <option value="processing" className="text-slate-700">প্রসেসিং (Processing)</option>
                            <option value="printed" className="text-slate-700">প্রিন্টেড (Printed)</option>
                            <option value="rejected" className="text-slate-700">প্রত্যাখ্যাত (Rejected)</option>
                          </select>
                        </td>
                         <td className="px-6 py-4 min-w-[150px]">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            <button 
                              onClick={() => { setSelectedStudent(student); setModalMode('details'); }} 
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" 
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => { setSelectedStudent(student); setModalMode('idcard'); }} 
                              className="p-2 text-gov-green hover:bg-gov-green/5 rounded-lg transition-all" 
                              title="Print ID Card"
                            >
                              <Printer size={18} />
                            </button>
                            <button onClick={() => deleteStudent(student.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all" title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
               {paginatedStudents.length === 0 ? (
                 <div className="p-10 text-center text-slate-400 font-bengali">কোনো তথ্য পাওয়া যায়নি।</div>
               ) : (
                 paginatedStudents.map(student => (
                   <div key={student.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          className="rounded border-slate-300 text-gov-green focus:ring-gov-green/20 cursor-pointer shrink-0"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                           <img src={student.photo_path || '/default-user.png'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2">
                             <h4 className="font-extrabold text-slate-800 text-sm truncate max-w-[120px] xs:max-w-[160px]">{student.full_name_en}</h4>
                             
                           </div>
                           <p className="text-[11px] font-bold text-slate-400">Roll: {student.roll_number}</p>
                           <div className="mt-1">
                             <select
                               value={student.status || 'pending'}
                               onChange={(e) => updateStatus(student.id, e.target.value)}
                               className={`text-[9px] font-extrabold rounded-lg px-2 py-0.5 border cursor-pointer font-bengali ${
                                 student.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                 student.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200 font-black' :
                                 student.status === 'printed' ? 'bg-purple-50 text-purple-700 border-purple-200 font-black' :
                                 student.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                 'bg-amber-50 text-amber-700 border-amber-200'
                               }`}
                             >
                               <option value="pending">পেন্ডিং (Pending)</option>
                               <option value="approved">অনুমোদিত (Approved)</option>
                               <option value="processing">প্রসেসিং (Processing)</option>
                               <option value="printed">প্রিন্টেড (Printed)</option>
                               <option value="rejected">প্রত্যাখ্যাত (Rejected)</option>
                             </select>
                           </div>
                        </div>
                     </div>
                     <button 
                       onClick={() => { setSelectedStudent(student); setModalMode('details'); }}
                       className="bg-gov-green text-white px-4 py-2 rounded-xl text-xs font-black font-bengali shadow-lg shadow-gov-green/10 whitespace-nowrap active:scale-95 transition-transform"
                     >
                        Details
                     </button>
                   </div>
                 ))
               )}
            </div>
          </>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-bold transition-all border-2 ${
                  currentPage === page 
                    ? 'bg-gov-green border-gov-green text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-gov-green/50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedStudent(null); setModalMode(null); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gov-green/5 text-gov-green rounded-2xl flex items-center justify-center">
                    {modalMode === 'details' ? <UserIcon size={24} /> : <Printer size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-bengali">{modalMode === 'details' ? 'শিক্ষার্থীর তথ্য' : 'আইডি কার্ড প্রিভিউ'}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedStudent.full_name_en}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedStudent(null); setModalMode(null); }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 md:p-12 overflow-y-auto">
                {modalMode === 'details' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-full max-w-[240px] aspect-square rounded-[40px] border-4 border-gov-green/10 overflow-hidden shadow-inner bg-slate-50">
                        <img src={selectedStudent.photo_path || '/default-user.png'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="w-full space-y-4">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">স্ট্যাটাস</p>
                           <span className="bg-emerald-50 rounded-xl">
                            <select
                              value={selectedStudent.status || 'pending'}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                await updateStatus(selectedStudent.id, newStatus);
                                setSelectedStudent(prev => prev ? { ...prev, status: newStatus as any } : null);
                              }}
                              className={`text-[11px] font-black rounded-xl px-2.5 py-1.5 border focus:ring-2 focus:ring-offset-1 focus:ring-gov-green/20 cursor-pointer font-bengali w-full text-center ${
                                selectedStudent.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                selectedStudent.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold pb-0.5' :
                                selectedStudent.status === 'printed' ? 'bg-purple-50 text-purple-700 border-purple-200 font-extrabold pb-0.5' :
                                selectedStudent.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="pending" className="text-slate-700">অপেক্ষমান (Pending)</option>
                              <option value="approved" className="text-slate-700">অনুমোদিত (Approved)</option>
                              <option value="processing" className="text-slate-700">প্রসেসিং (Processing)</option>
                              <option value="printed" className="text-slate-700">প্রিন্টেড (Printed)</option>
                              <option value="rejected" className="text-slate-700">প্রত্যাখ্যাত (Rejected)</option>
                            </select>
                          </span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2 space-y-8">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8">
                          <DetailItem label="পুরো নাম (বাংলা)" value={selectedStudent.full_name_bn} font="bengali" />
                          <DetailItem label="Full Name (English)" value={selectedStudent.full_name_en} />
                          <DetailItem label="পিতার নাম" value={selectedStudent.father_name} font="bengali" />
                          <DetailItem label="মাতার নাম" value={selectedStudent.mother_name} font="bengali" />
                          <DetailItem label="রোল নম্বর" value={selectedStudent.roll_number} />
                          <DetailItem label="রেজিস্ট্রেশন" value={selectedStudent.reg_number} />
                          <DetailItem label="টেকনোলজি" value={selectedStudent.technology} font="bengali" />
                          <DetailItem label="সেশন" value={selectedStudent.session} />
                          <DetailItem label="সেমিস্টার" value={selectedStudent.semester} font="bengali" />
                          <DetailItem label="শিফট" value={selectedStudent.shift} font="bengali" />
                          <DetailItem label="মোবাইল নম্বর" value={selectedStudent.mobile} />
                          <DetailItem label="অভিভাবকের মোবাইল" value={selectedStudent.guardian_mobile} />
                          <DetailItem label="জন্ম তারিখ" value={selectedStudent.dob} />
                          <DetailItem label="রক্তের গ্রুপ" value={selectedStudent.blood_group} />
                          <DetailItem 
                            label="যোগদানের তারিখ" 
                            value={selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'} 
                            font="bengali" 
                          />
                       </div>
                       <div className="pt-6 md:pt-8 border-t border-slate-100">
                          <DetailItem label="স্থায়ী ঠিকানা" value={selectedStudent.address} font="bengali" fullWidth />
                       </div>

                       {/* Action Buttons for Mobile Accessibility */}
                       <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-4">
                          <button 
                            onClick={() => setModalMode('idcard')}
                            className="flex-1 min-w-[140px] bg-gov-green text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-gov-green/20"
                          >
                            <Printer size={18} /> আইডি কার্ড প্রিন্ট
                          </button>
                          <button 
                            onClick={() => deleteStudent(selectedStudent.id)}
                            className="flex-1 min-w-[140px] bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={18} /> ডিলেট করুন
                          </button>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center -mt-6 md:-mt-10 scale-75 md:scale-90 lg:scale-100 transition-transform origin-top">
                    <IDCard 
                      user={selectedStudent as any} 

                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {studentToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStudentToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden p-8 flex flex-col items-center text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 font-bengali mb-3">আপনি কি সুনিশ্চিত?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed font-bengali">
                আপনি কি নিশ্চিত যে আপনি <strong className="text-slate-800 font-extrabold">{studentToDelete.full_name_en}</strong> এর শিক্ষার্থীর তথ্য স্থায়ীভাবে ডিলিট করতে চান? এই কাজ কোনোভাবেই আর ফিরিয়ে নেওয়া যাবে না।
              </p>
              <div className="flex gap-4 w-full">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors disabled:opacity-55 font-bengali"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-600/15 flex items-center justify-center gap-2 disabled:bg-red-500 font-bengali"
                >
                  {isDeleting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isDeleting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value, font, fullWidth }: { label: string, value?: string, font?: string, fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm font-bold text-slate-800 ${font === 'bengali' ? 'font-bengali' : ''}`}>{value || 'N/A'}</p>
    </div>
  );
}

function StatsCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
       <div className={`${color} w-2 h-12 rounded-full`}></div>
       <div>
         <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</p>
         <p className="text-2xl font-bold">{value}</p>
       </div>
    </div>
  );
}
