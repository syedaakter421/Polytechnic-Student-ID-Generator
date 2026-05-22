import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { LogOut, Home, User as UserIcon, CreditCard, Bell, Clock, CheckCircle, Pencil, Check, Camera, Save, X, Menu } from 'lucide-react';
import IDCard from '../components/IDCard';
import Footer from '../components/Footer';
import { NavLink, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { safeFetch } from '../lib/fetchUtils';

export default function StudentDashboard({ user, onLogout, onUpdateUser }: { user: User, onLogout: () => void, onUpdateUser: (user: User) => void }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'রেজিস্ট্রেশন সফল', message: 'আপনার আইডি কার্ড রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে।', time: '', read: false },
  ]);

  useEffect(() => {
    if (!user || !user.status) return;
    const statusVal = user.status;
    let statusNotif = null;

    if (statusVal === 'printed') {
      statusNotif = {
        id: 99,
        title: 'আইডি কার্ড প্রিন্ট সম্পন্ন',
        message: 'আপনার আইডি কার্ডটি সফলভাবে প্রিন্ট করা হয়েছে। অনুগ্রহ করে সংশ্লিষ্ট কার্যালয় হতে আপনার আইডি কার্ডটি সংগ্রহ করুন।',
        time: 'এখন',
        read: false
      };
    } else if (statusVal === 'processing') {
      statusNotif = {
        id: 99,
        title: 'আইডি কার্ড প্রস্তুত করা হচ্ছে',
        message: 'আপনার আইডি কার্ডটি প্রিন্ট করার কাজ প্রক্রিয়াধীন (Processing) রয়েছে।',
        time: 'এখন',
        read: false
      };
    } else if (statusVal === 'approved') {
      statusNotif = {
        id: 99,
        title: 'আবেদন অনুমোদিত',
        message: 'বিজ্ঞপ্তি: আপনার আইডি কার্ডের আবেদন সফলভাবে অনুমোদিত হয়েছে।',
        time: 'এখন',
        read: false
      };
    } else if (statusVal === 'rejected') {
      statusNotif = {
        id: 99,
        title: 'আবেদন প্রত্যাখ্যাত',
        message: 'দুঃখিত, আপনার দেওয়া তথ্যের সংশোধন প্রয়োজন বা আবেদনটি প্রত্যাখ্যাত হয়েছে। অনুগ্রহ করে অফিসে যোগাযোগ করুন।',
        time: 'এখন',
        read: false
      };
    } else {
      statusNotif = {
        id: 99,
        title: 'আবেদন প্রক্রিয়াধীন',
        message: 'আপনার আইডি কার্ড আবেদনটি বর্তমানে অপেক্ষমান (Pending) আছে এবং পর্যালোচনা করা হচ্ছে।',
        time: 'এখন',
        read: false
      };
    }

    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== 99);
      const regSuccess = filtered.find(n => n.id === 1);
      const others = filtered.filter(n => n.id !== 1);
      
      const newNotifs = [];
      if (regSuccess) {
        newNotifs.push(regSuccess);
      }
      if (statusNotif) {
        newNotifs.push(statusNotif);
      }
      newNotifs.push(...others);
      return newNotifs;
    });
  }, [user.status]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bengali text-sm font-medium border-l-4 ${
      isActive 
        ? 'bg-gov-green/5 text-gov-green border-gov-green pl-6 shadow-sm' 
        : 'text-slate-600 border-transparent hover:bg-gov-green/5 hover:text-gov-green hover:pl-6 hover:border-gov-green'
    }`;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen student-page flex relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col p-4 shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-sm md:z-10 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between md:block">
          <Link to="/" className="p-4 block hover:opacity-80 transition-all group">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-200 overflow-hidden group-hover:scale-105 transition-transform">
                 <img src="/images/logo.png" className="w-full h-full object-contain" alt="Logo" />
               </div>
               <div>
                 <h2 className="font-black text-slate-800 text-[11px] uppercase leading-tight">Sherpur Govt. Polytechnic Institute</h2>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Digital Student Portal</p>
               </div>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-gov-red md:hidden">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 mt-6 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-4 px-3">Main Menu</div>
          <NavLink to="/dashboard" end className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
            <Home size={18} /> ড্যাশবোর্ড
          </NavLink>
          <NavLink to="/dashboard/profile" className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
            <UserIcon size={18} /> প্রোফাইল
          </NavLink>
          <NavLink to="/dashboard/id-card" className={navLinkClass} onClick={() => setIsSidebarOpen(false)}>
            <CreditCard size={18} /> আইডি কার্ড সংগ্রহ
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gov-red hover:bg-gov-red/5 transition-all font-bengali text-sm font-bold">
            <LogOut size={18} /> লগ আউট
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white h-auto py-4 md:h-20 border-b border-slate-200 px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between w-full md:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:text-gov-green md:hidden transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="text-center md:text-left flex-1 md:flex-none">
              <h1 className="font-black text-slate-800 text-lg md:text-xl font-bengali leading-tight">স্বাগতম, <span className="text-gov-green">{user.full_name_en}</span></h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digital ID System v2.4</p>
            </div>
            <div className="w-10 md:hidden"></div> {/* Spacer for symmetry on mobile */}
          </div>
          <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 md:gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`text-slate-400 hover:text-gov-green relative transition-colors p-2 rounded-full ${showNotifications ? 'bg-slate-50 text-gov-green' : 'hover:bg-slate-50'}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-gov-red rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                  <div className="fixed md:absolute top-20 right-4 md:top-auto md:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px]">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <h4 className="font-bold text-slate-800 font-bengali">নটিফিকেশন</h4>
                      <button onClick={markAllRead} className="text-[10px] font-bold text-gov-green hover:underline uppercase tracking-tighter">Mark all as read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div key={notification.id} className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notification.read ? 'bg-gov-green/[0.02]' : ''}`}>
                            {!notification.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gov-green rounded-full"></div>}
                            <div className="pl-2">
                              <p className="text-xs font-bold text-slate-800 font-bengali mb-1">{notification.title}</p>
                              <p className="text-[11px] text-slate-500 font-bengali leading-relaxed">{notification.message}</p>
                              {notification.time && (
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">{notification.time}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center text-slate-400 text-sm font-bengali">কোনো নটিফিকেশন নেই</div>
                      )}
                    </div>
                    <div className="p-3 border-t border-slate-50 text-center">
                      <button className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors">See All Notifications</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-black text-slate-800 font-bengali leading-none">{user.full_name_bn}</p>
                 <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Roll: {user.roll_number}</p>
               </div>
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-gov-green/20 overflow-hidden shadow-inner bg-slate-100">
                 <img src={user.photo_path || '/default-user.png'} className="w-full h-full object-cover" alt="" />
               </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-10 flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<DashboardHome user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} onUpdateUser={onUpdateUser} />} />
            <Route path="/id-card" element={<IDCard user={user} />} />
            <Route path="*" element={<div className="font-bengali p-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">এই বিভাগটি শীঘ্রই আপডেট করা হবে।</div>} />
          </Routes>
          <div className="-mx-4 md:-mx-10 mt-10">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfilePage({ user, onUpdateUser }: { user: User, onUpdateUser: (user: User) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(() => user || {} as User);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(user?.photo_path);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && typeof user === 'object' && Object.keys(user).length > 0) {
      setFormData(user);
      setPhotoPreview(user.photo_path);
    }
  }, [user]);

  // Image Compression Logic
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'অনুগ্রহ করে শুধুমাত্র JPG, PNG অথবা WebP ফরম্যাটে ছবি আপলোড করুন।' });
        return;
      }
      
      setLoading(true);
      try {
        const compressed = await compressImage(file);
        setPhoto(compressed);
        setPhotoPreview(URL.createObjectURL(compressed));
        setMessage(null);
      } catch (err) {
        console.error('Compression error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user?.id || loading) return;
    setLoading(true);
    setMessage(null);
    const data = new FormData();
    
    if (formData && typeof formData === 'object' && formData !== null) {
      const allowedFields = [
        'full_name_bn', 'full_name_en', 'session', 'technology', 
        'semester', 'shift', 'blood_group', 'mobile', 'email', 'dob', 'address', 
        'father_name', 'mother_name', 'guardian_mobile',
        'village', 'post_office', 'upazilla', 'district', 'valid_upto'
      ];
      allowedFields.forEach(field => {
        const value = formData[field as keyof User];
        if (value !== undefined && value !== null) {
          data.append(field, value as string);
        }
      });
    }

    if (photo) data.append('photo', photo);

    try {
      const result = await safeFetch(`/api/student/profile/${user.id}`, {
        method: 'PATCH',
        body: data
      });
      onUpdateUser(result.user);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।' });
    } catch (err: any) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: err.message || 'আপডেট করতে সমস্যা হয়েছে।' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || typeof user !== 'object' || !user.id) {
    return (
      <div className="p-10 text-center font-bengali text-slate-400">
        <div className="animate-pulse">তথ্য লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-gov-green rounded-full"></div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 font-bengali">প্রোফাইল তথ্য</h2>
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage your account and profile information</p>
          </div>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-bengali w-full sm:w-auto"
          >
            <Pencil size={16} /> তথ্য পরিবর্তন করুন
          </button>
        ) : (
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
             <button 
              onClick={() => { 
                setIsEditing(false); 
                if(user) setFormData({...user}); 
                setPhotoPreview(user?.photo_path); 
                setMessage(null);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-slate-500 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-bengali"
            >
              <X size={16} /> বাতিল
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gov-green text-white px-4 sm:px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-gov-green/20 hover:-translate-y-0.5 transition-all font-bengali disabled:opacity-50"
            >
              {loading ? 'সেভ...' : <><Save size={16} /> সেভ করুন</>}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-2xl font-bengali text-sm animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-gov-green/10 text-gov-green' : 'bg-gov-red/10 text-gov-red'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photo & Signature */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] border-4 border-gov-green/10 overflow-hidden shadow-inner bg-slate-50">
                <img src={photoPreview || '/default-user.png'} className="w-full h-full object-cover" alt="" />
              </div>
              {isEditing && (
                <label className="absolute bottom-2 right-2 bg-gov-green text-white p-2.5 rounded-2xl shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                  <Camera size={18} />
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </label>
              )}
            </div>
            <h3 className="mt-6 font-black text-slate-800 font-bengali text-xl">{user.full_name_bn}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{user.technology}</p>
          </div>

          <div className="bg-slate-800 p-8 rounded-[40px] text-white shadow-xl shadow-slate-900/10">
            <h4 className="font-bold font-bengali mb-4 text-sm flex items-center gap-2">
              <CheckCircle size={16} className="text-gov-green" /> অ্যাকাউন্ট স্ট্যাটাস
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">রেজিস্ট্রেশন</span>
                <span className="text-gov-green text-[10px] font-black font-bengali uppercase">সক্রিয়</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">আইডি স্ট্যাটাস</span>
                <span className="text-white text-[10px] font-black font-bengali uppercase">অনুমোদিত</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">যোগদানের তারিখ</span>
                <span className="text-white text-[10px] font-black font-bengali uppercase">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProfileField 
                label="পূর্ণ নাম (বাংলায়)" 
                value={formData?.full_name_bn || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, full_name_bn: v})}
                font="bengali"
              />
              <ProfileField 
                label="Full Name (English)" 
                value={formData?.full_name_en || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, full_name_en: v})}
                uppercase
              />
              <ProfileField 
                label="রোল নম্বর" 
                value={formData?.roll_number || ''} 
                isEditing={false}
              />
              <ProfileField 
                label="রেজিস্ট্রেশন নম্বর" 
                value={formData?.reg_number || ''} 
                isEditing={false}
              />
              <ProfileField 
                label="টেকনোলজি" 
                value={formData?.technology || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, technology: v})}
              />
              <ProfileField 
                label="সেশন" 
                value={formData?.session || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, session: v})}
                color="text-gov-green"
              />
              <ProfileField 
                label="সেমিস্টার" 
                value={formData?.semester || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, semester: v})}
              />
              <ProfileField 
                label="শিফট" 
                value={formData?.shift || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, shift: v})}
              />
              <ProfileField 
                label="জন্ম তারিখ" 
                value={formData?.dob || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, dob: v})}
                type="date"
              />
              <ProfileField 
                label="রক্তের গ্রুপ" 
                value={formData?.blood_group || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, blood_group: v})}
                color="text-gov-red"
              />
              <ProfileField 
                label="মেয়াদ উত্তীর্ণ (Valid Upto)" 
                value={formData?.valid_upto || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, valid_upto: v})}
              />
              <ProfileField 
                label="মোবাইল নম্বর" 
                value={formData?.mobile || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, mobile: v})}
              />
              <ProfileField 
                label="ইমেইল এড্রেস" 
                value={formData?.email || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, email: v})}
                type="email"
              />
              <ProfileField 
                label="বাবার নাম" 
                value={formData?.father_name || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, father_name: v})}
                font="bengali"
              />
              <ProfileField 
                label="মাতার নাম" 
                value={formData?.mother_name || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, mother_name: v})}
                font="bengali"
              />
              <ProfileField 
                label="অভিভাবকের মোবাইল" 
                value={formData?.guardian_mobile || ''} 
                isEditing={isEditing}
                onChange={(v: string) => setFormData({...formData, guardian_mobile: v})}
              />
              <div className="md:col-span-2 space-y-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest px-1">ঠিকানা বিস্তারিত (আইডি কার্ডের জন্য)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ProfileField 
                    label="গ্রাম (Village)" 
                    value={formData?.village || ''} 
                    isEditing={isEditing}
                    onChange={(v: string) => setFormData({...formData, village: v})}
                    font="bengali"
                  />
                  <ProfileField 
                    label="ডাকঘর (Post Office)" 
                    value={formData?.post_office || ''} 
                    isEditing={isEditing}
                    onChange={(v: string) => setFormData({...formData, post_office: v})}
                    font="bengali"
                  />
                  <ProfileField 
                    label="উপজেলা (Upazilla)" 
                    value={formData?.upazilla || ''} 
                    isEditing={isEditing}
                    onChange={(v: string) => setFormData({...formData, upazilla: v})}
                    font="bengali"
                  />
                  <ProfileField 
                    label="জেলা (District)" 
                    value={formData?.district || ''} 
                    isEditing={isEditing}
                    onChange={(v: string) => setFormData({...formData, district: v})}
                    font="bengali"
                  />
                </div>
              </div>

              <div className="md:col-span-2 mt-4">
                <ProfileField 
                  label="স্থায়ী ঠিকানা (সংক্ষেপে)" 
                  value={formData?.address || ''} 
                  isEditing={isEditing}
                  onChange={(v: string) => setFormData({...formData, address: v})}
                  font="bengali"
                  textarea
                />
              </div>

              {isEditing && (
                <div className="md:col-span-2 pt-8 flex gap-3 border-t border-slate-100">
                  <button 
                    onClick={() => { 
                      setIsEditing(false); 
                      if(user) setFormData({...user}); 
                      setPhotoPreview(user?.photo_path); 
                      setMessage(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-500 px-6 py-3 rounded-2xl font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-bengali"
                  >
                    <X size={18} /> বাতিল
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gov-green text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-gov-green/20 hover:-translate-y-0.5 transition-all font-bengali disabled:opacity-50"
                  >
                    {loading ? 'সেভ হচ্ছে...' : <><Save size={18} /> সেভ করুন</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, isEditing, onChange, font = 'sans', uppercase = false, color = 'text-slate-800', type = 'text', textarea = false }: any) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
      {isEditing ? (
        textarea ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-gov-green focus:ring-4 focus:ring-gov-green/5 transition-all min-h-[100px] ${font === 'bengali' ? 'font-bengali' : ''}`}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-gov-green focus:ring-4 focus:ring-gov-green/5 transition-all ${font === 'bengali' ? 'font-bengali' : ''} ${uppercase ? 'uppercase' : ''}`}
          />
        )
      ) : (
        <div className={`text-base font-bold pb-2 border-b border-slate-50 ${color} ${font === 'bengali' ? 'font-bengali' : ''} ${uppercase ? 'uppercase tracking-wide' : ''}`}>
          {value || <span className="text-slate-300 font-normal italic">তথ্য নেই</span>}
        </div>
      )}
    </div>
  );
}

function DashboardHome({ user }: { user: User }) {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-200 flex items-center gap-3 group hover:translate-y-1 transition-all">
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"><Clock size={20} /></div>
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Session</p>
            </div>
            <p className="text-sm font-black text-slate-800 truncate" title={user.session}>{user.session || 'N/A'}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-200 flex items-center gap-3 group hover:translate-y-1 transition-all">
          <div className="bg-gov-green/5 p-2.5 rounded-xl text-gov-green shadow-inner group-hover:bg-gov-green group-hover:text-white transition-all shrink-0"><Bell size={20} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">ID Card Status</p>
            {(() => {
              const statusVal = user.status || 'pending';
              let text = 'অপেক্ষমান (Pending)';
              let colorClass = 'text-amber-500';
              if (statusVal === 'approved') {
                text = 'অনুমোদিত (Verified)';
                colorClass = 'text-gov-green';
              } else if (statusVal === 'processing') {
                text = 'প্রসেসিং (Processing)';
                colorClass = 'text-blue-500';
              } else if (statusVal === 'printed') {
                text = 'প্রিন্টেড (Printed)';
                colorClass = 'text-purple-600';
              } else if (statusVal === 'rejected') {
                text = 'প্রত্যাখ্যাত (Rejected)';
                colorClass = 'text-red-500';
              }
              return (
                <p className={`text-sm font-black font-bengali ${colorClass} uppercase truncate`}>{text}</p>
              );
            })()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-200 flex items-center gap-3 group hover:translate-y-1 transition-all">
          <div className="bg-gov-red/5 p-2.5 rounded-xl text-gov-red shadow-inner group-hover:bg-gov-red group-hover:text-white transition-all shrink-0"><CreditCard size={20} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Blood Donation</p>
            <p className="text-sm font-black text-slate-800 font-bengali truncate">রক্তের গ্রুপ: <span className="text-gov-red">{user.blood_group || 'O+'}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-gov-green rounded-full"></div>
              <h3 className="font-black text-slate-800 text-lg font-bengali">ব্যক্তিগত প্রোফাইল তথ্য</h3>
           </div>
           <Link to="/dashboard/id-card" className="bg-gov-green text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-gov-green/20 transition-all font-bengali">কার্ড তৈরি করুন</Link>
        </div>
        <div className="p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
           {/* General Info Group */}
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">পূর্ণ নাম (বাংলায়)</p>
              <p className="text-sm font-bold font-bengali text-slate-800 border-b border-slate-50 pb-2">{user.full_name_bn}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Full Name (English)</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 uppercase tracking-wide">{user.full_name_en}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">রোল নম্বর</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 uppercase tracking-tighter">{user.roll_number}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">রেজিস্ট্রেশন নম্বর</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 uppercase tracking-tighter">{user.reg_number}</p>
           </div>

           {/* Academic Info Group */}
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">টেকনোলজি</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">{user.technology}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">সেশন</p>
              <p className="text-sm font-bold text-gov-green border-b border-slate-50 pb-2">{user.session}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">সেমিস্টার</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 uppercase tracking-tighter">{user.semester}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">শিফট</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 uppercase tracking-tighter">{user.shift}</p>
           </div>

           {/* Contact & Personal Info Group (Side-by-side as requested) */}
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">জন্ম তারিখ</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 uppercase tracking-tighter">{user.dob}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">রক্তের গ্রুপ</p>
              <p className="text-sm font-bold text-gov-red border-b border-slate-50 pb-2 uppercase tracking-tighter">{user.blood_group || 'N/A'}</p>
           </div>
           <div className="sm:col-span-2">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">ইমেইল ও যোগাযোগ</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 truncate" title={user.email}>{user.email || 'N/A'}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">মোবাইল নম্বর</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">{user.mobile || 'N/A'}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">বাবার নাম</p>
              <p className="text-sm font-bold font-bengali text-slate-800 border-b border-slate-50 pb-2">{user.father_name || 'N/A'}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">মাতার নাম</p>
              <p className="text-sm font-bold font-bengali text-slate-800 border-b border-slate-50 pb-2">{user.mother_name || 'N/A'}</p>
           </div>
           <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">অভিভাবকের মোবাইল</p>
              <p className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">{user.guardian_mobile || 'N/A'}</p>
           </div>
           <div className="sm:col-span-3">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">স্থায়ী ঠিকানা</p>
              <p className="text-sm font-bold font-bengali text-slate-800 border-b border-slate-50 pb-2 leading-relaxed truncate" title={user.address}>{user.address || 'N/A'}</p>
           </div>
        </div>
      </div>
    </div>
  );
}


