import { safeFetch } from '../lib/fetchUtils';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, ArrowLeft, Upload, Camera, CheckCircle, Eye, EyeOff } from 'lucide-react';

const DEPARTMENTS = [
'Civil Technology',
'Electrical Technology',
'Electronics Technology',
'Computer Technology',
'RAC Technology',
'Mechanical Integrated Technology'
];

export default function Signup() {
  const [formData, setFormData] = useState({
    full_name_bn: '',
    full_name_en: '',
    roll_number: '',
    reg_number: '',
    session: '',
    technology: '',
    semester: '',
    shift: '',
    blood_group: '',
    mobile: '',
    email: '',
    dob: '',
    address: '',
    village: '',
    post_office: '',
    upazilla: '',
    district: '',
    valid_upto: '',
    father_name: '',
    mother_name: '',
    guardian_mobile: '',
    password: ''
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData();
    if (formData && typeof formData === 'object' && formData !== null) {
      Object.entries(formData).forEach(([key, value]) => form.append(key, value as string));
    }
    if (photo) form.append('photo', photo);

    try {
      await safeFetch('/api/student/signup', {
        method: 'POST',
        body: form
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen signup-page flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-bold font-bengali text-gov-green mb-4">অভিনন্দন!</h2>
          <p className="text-gray-600 font-bengali text-lg leading-relaxed">
            আপনার অ্যাকাউন্টটি সফলভাবে তৈরি হয়েছে এবং সক্রিয় হয়েছে। আপনি এখন লগইন করতে পারবেন।
          </p>
          <div className="mt-8">
            <Link to="/login" className="text-gov-green font-bold flex items-center justify-center gap-2 hover:underline">
              লগইন পেজে যান <ArrowLeft size={18} className="rotate-180" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen signup-page py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <Link to="/" className="flex items-center gap-3 text-slate-800 mb-8 px-4 font-bold font-bengali group">
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft size={20} className="group-hover:text-gov-green" />
          </div>
          হোম পেজ
        </Link>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[30px] shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="bg-gov-green p-6 md:p-10 text-white relative overflow-hidden border-b-4 border-gov-red flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <UserPlus size={160} />
            </div>
            <div className="bg-white p-2.5 w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl border border-white/20 overflow-hidden shrink-0 relative z-10">
              <img src="images/logo.png" className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div className="relative z-10 text-center md:text-left">
              <h2 className="text-3xl font-black font-bengali leading-tight">নতুন শিক্ষার্থী রেজিস্ট্রেশন</h2>
              <p className="text-sm opacity-70 mt-2 font-medium tracking-wide uppercase">Institutional Enrollment System</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8 md:space-y-12">
            {/* Upload Section */}
            <div className="flex justify-center">
              <div className="space-y-3 w-full max-w-md">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">ছাত্র/ছাত্রীর ছবি (৩০০x৩০০)</label>
                <div className="group relative w-full h-56 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center hover:border-gov-green transition-all bg-slate-50 overflow-hidden shadow-inner">
                  {photoPreview ? (
                    <img src={photoPreview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="text-gov-green" size={32} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-4">Upload Photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-10">
              {[
                { label: 'পূর্ণ নাম (বাংলায়)', name: 'full_name_bn', type: 'text', placeholder: 'যেমন: মো: সাকিল ইসলাম' },
                { label: 'Full Name (English)', name: 'full_name_en', type: 'text', placeholder: 'e.g. Md. Sakil Islam' },
                { label: 'রোল নম্বর (ইংরেজি)', name: 'roll_number', type: 'number', placeholder: 'e.g. 123456 (6 digits)' },
                { label: 'রেজিস্ট্রেশন নম্বর (ইংরেজি)', name: 'reg_number', type: 'number', placeholder: 'e.g. 1500012345 (10 digits)' },
                { label: 'সেশন (ইংরেজি)', name: 'session', type: 'text', placeholder: 'e.g. 2022-23' },
                { label: 'পর্ব (ইংরেজি)', name: 'semester', type: 'text', placeholder: 'e.g. 5th' },
                { label: 'শিফট (ইংরেজি)', name: 'shift', type: 'text', placeholder: 'e.g. 1st/2nd' },
                { label: 'রক্তের গ্রুপ (ইংরেজি)', name: 'blood_group', type: 'text', placeholder: 'e.g. AB+' },
                { label: 'মোবাইল নম্বর (ইংরেজি)', name: 'mobile', type: 'tel', placeholder: '017...' },
                { label: 'ইমেইল এড্রেস', name: 'email', type: 'email', placeholder: 'student@domain.com' },
                { label: 'বাবার নাম (ইংরেজি)', name: 'father_name', type: 'text', placeholder: 'e.g. Md. Abdul Alim' },
                { label: 'মাতার নাম (ইংরেজি)', name: 'mother_name', type: 'text', placeholder: 'e.g. Mst. Khatun Begum' },
                { label: 'অভিভাবকের মোবাইল (ইংরেজি)', name: 'guardian_mobile', type: 'tel', placeholder: '017...' },
                { label: 'জন্ম তারিখ (ইংরেজি)', name: 'dob', type: 'date' },
                { label: 'মেয়াদ উত্তীর্ণ (ইংরেজি)', name: 'valid_upto', type: 'text', placeholder: 'e.g. June 2026' },
                { label: 'পাসওয়ার্ড (ইংরেজি)', name: 'password', type: 'password', placeholder: 'Enter secret password' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-bold text-gray-700 mb-1 font-bengali">{field.label}</label>
                  {field.name === 'technology' ? null : (
                    <div className="relative">
                      <input 
                        type={field.name === 'password' ? (showPassword ? 'text' : 'password') : field.type} 
                        name={field.name}
                        required
                        placeholder={field.placeholder}
                        value={(formData as any)[field.name]}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-gov-green/10 focus:border-gov-green focus:bg-white outline-none transition-all placeholder:text-slate-400"
                      />
                      {field.name === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="md:col-span-1">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">টেকনোলজি/বিভাগ</label>
                <select 
                  required
                  value={formData.technology}
                  onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                  className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-gov-green/10 focus:border-gov-green focus:bg-white outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Technology</option>
                  {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">স্থায়ী ঠিকানা (সংক্ষেপে) (ইংরেজি)</label>
                <textarea 
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-gov-green/10 focus:border-gov-green focus:bg-white outline-none transition-all h-20"
                  placeholder="Village, Post Office, Upazilla, District..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6 md:col-span-2 border-t border-slate-100 pt-8">
                 <div className="md:col-span-2">
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2 px-1">ঠিকানা বিস্তারিত (আইডি কার্ডের জন্য)</h4>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 font-bengali">গ্রাম (ইংরেজি)</label>
                   <input type="text" value={formData.village} onChange={(e) => setFormData({...formData, village: e.target.value})} className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-gov-green/20" placeholder="e.g. Bhatshala" required />
                 </div>
                  <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 font-bengali">ডাকঘর (ইংরেজি)</label>
                   <input type="text" value={formData.post_office} onChange={(e) => setFormData({...formData, post_office: e.target.value})} className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-gov-green/20" placeholder="e.g. Bhatshala" required />
                 </div>
                  <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 font-bengali">উপজেলা (ইংরেজি)</label>
                   <input type="text" value={formData.upazilla} onChange={(e) => setFormData({...formData, upazilla: e.target.value})} className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-gov-green/20" placeholder="e.g. Sherpur Sadar" required />
                 </div>
                  <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1 font-bengali">জেলা (ইংরেজি)</label>
                   <input type="text" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-gov-green/20" placeholder="e.g. Sherpur" required />
                 </div>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-gov-red text-[13px] font-bold font-bengali bg-gov-red/5 p-4 rounded-xl border border-gov-red/10 flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <span className="w-5 h-5 bg-gov-red text-white text-[10px] rounded-full flex items-center justify-center font-black shrink-0">!</span>
                  <span>{error.replace("AUTH_REQUIRED: ", "")}</span>
                </div>
                {error.includes("AUTH_REQUIRED") && (
                  <div className="mt-1 pl-7 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <span className="text-xs text-slate-500 font-normal">ব্রাউজারের থার্ড-পার্টি কুকি ব্লকিং এড়িয়ে যেতে আপনি সাইটটি নতুন উইন্ডোতে ওপেন করতে পারেন:</span>
                    <a 
                      href={window.location.host === 'localhost:3000' ? '/' : window.location.origin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-gov-green hover:bg-gov-green/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm font-black flex items-center gap-1 transition-all"
                    >
                      নতুন উইন্ডোতে খুলুন ↗
                    </a>
                  </div>
                )}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black font-bengali text-xl hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'প্রসেসিং হচ্ছে...' : <><UserPlus size={24} /> আবেদন সম্পন্ন করুন</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
