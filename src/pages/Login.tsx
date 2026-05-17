import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, User, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { User as UserType } from '../types';

import { safeFetch } from '../lib/fetchUtils';

export default function Login({ onLogin }: { onLogin: (user: UserType, token: string) => void }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isAdmin ? '/api/admin/login' : '/api/student/login';
      const body = isAdmin ? { email: userId, password } : { roll_number: userId, password };

      const data = await safeFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      onLogin(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen login-page flex flex-col items-center justify-center p-4">
      <Link to="/" className="mb-6 md:absolute md:top-8 md:left-8 flex items-center gap-2 text-gov-green hover:underline">
        <ArrowLeft size={20} /> হোম পেজ
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="bg-gov-green p-6 md:p-10 text-center text-white relative overflow-hidden border-b-4 border-gov-red">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ShieldCheck size={120} />
          </div>
          <div className="bg-white p-3 w-28 h-28 rounded-[35px] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 overflow-hidden">
            <img src="images/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <h2 className="text-3xl font-black font-bengali leading-tight">{isAdmin ? 'এডমিন পোর্টাল' : 'শিক্ষার্থী লগইন'}</h2>
          <p className="text-sm opacity-70 mt-2 font-medium tracking-wide uppercase">Institutional Access System</p>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex gap-2 mb-10 bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => {
                setIsAdmin(false);
                setUserId('');
              }}
              className={`flex-1 py-3 rounded-xl font-bold font-bengali text-sm transition-all ${!isAdmin ? 'bg-white shadow-lg text-gov-green' : 'text-slate-400 hover:text-slate-600'}`}
            >
              শিক্ষার্থী
            </button>
            <button 
              onClick={() => {
                setIsAdmin(true);
                setUserId('');
              }}
              className={`flex-1 py-3 rounded-xl font-bold font-bengali text-sm transition-all ${isAdmin ? 'bg-white shadow-lg text-gov-green' : 'text-slate-400 hover:text-slate-600'}`}
            >
              এডমিন
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                {isAdmin ? 'ইমেইল' : 'রোল নম্বর'}
              </label>
              <input 
                type={isAdmin ? 'email' : 'text'} 
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={isAdmin ? 'admin@gmail.com' : 'ছয় ডিজিটের রোল নম্বর'}
                className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-gov-green/10 focus:border-gov-green focus:bg-white outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">পাসওয়ার্ড</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:ring-4 focus:ring-gov-green/10 focus:border-gov-green focus:bg-white outline-none transition-all placeholder:text-slate-400"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gov-green transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-gov-red text-[13px] font-bold font-bengali bg-gov-red/5 p-4 rounded-xl border border-gov-red/10 flex gap-2 items-center">
                <span className="w-5 h-5 bg-gov-red text-white text-[10px] rounded-full flex items-center justify-center font-black">!</span>
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold font-bengali text-lg hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'লোড হচ্ছে...' : <><LogIn size={22} /> লগইন করুন</>}
            </button>
          </form>

          {!isAdmin && (
            <div className="mt-10 text-center text-sm text-slate-400 font-medium">
              আপনার কি এখনো অ্যাকাউন্ট নেই? <Link to="/signup" className="text-gov-green font-bold hover:underline">রেজিস্ট্রেশন করুন</Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
