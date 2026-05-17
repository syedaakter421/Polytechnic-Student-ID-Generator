import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { Link } from 'react-router-dom';
import { CreditCard, Info, MapPin, Phone, Mail, ChevronRight, LogIn, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import Footer from '../components/Footer';

export default function Home({ user }: { user: User | null }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const banners = ['images/Banner1.jpg', 'images/Banner2.jpg', 'images/Banner3.jpg'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="min-h-screen home-page">
      {/* Top bar */}
      <div className="bg-gov-green text-white py-2 px-4 shadow-md border-b-4 border-gov-red flex justify-between items-center sm:px-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-0.5 border border-slate-200 overflow-hidden shadow-sm">
            <img src="images/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold leading-tight font-bengali">শেরপুর পলিটেকনিক ইনস্টিটিউট</h1>
            <p className="text-[9px] md:text-[11px] opacity-90 tracking-wide uppercase">Sherpur Polytechnic Institute</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-2 hidden sm:flex">
             <button className="text-[12px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-all">English</button>
             <button className="text-[12px] bg-white/20 px-3 py-1 rounded font-bold transition-all">বাংলা</button>
          </div>
          {user ? (
            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-md text-sm font-bold hover:bg-white hover:text-gov-green transition-all font-bengali">
               ড্যাশবোর্ড
            </Link>
          ) : (
            <Link to="/login" className="bg-white/20 text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-white hover:text-gov-green transition-all font-bengali">
               লগইন
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section with Banner Slider */}
      <section className="relative h-[450px] md:h-[550px] bg-black overflow-hidden shadow-inner">
        <AnimatePresence>
          <motion.img 
            key={currentSlide}
            src={banners[currentSlide]} 
            alt={`Banner ${currentSlide + 1}`} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        {/* Light Black Glass Overlay for Readability and Style */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px] bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 md:px-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white max-w-2xl"
          >
            <div className="inline-block px-4 py-1 bg-gov-red text-[10px] md:text-xs font-bold rounded-full mb-4 md:mb-6 tracking-widest uppercase">Official Student Portal</div>
            <h2 className="text-3xl md:text-5xl font-black font-bengali mb-4 md:mb-6 tracking-tight leading-tight">আপনার স্মার্ট আইডি কার্ড <br className="hidden md:block"/> এখন এক ক্লিকেই</h2>
            <p className="text-base md:text-xl mb-6 md:mb-10 opacity-70 leading-relaxed max-w-lg">শেরপুর পলিটেকনিক ইনস্টিটিউটের ছাত্রছাত্রীদের জন্য আধুনিক এবং স্বয়ংক্রিয় পরিচয়পত্র জেনারেশন সিস্টেম।</p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="bg-gov-green text-white px-8 md:px-12 py-3 md:py-4 rounded-xl font-bold shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 group text-sm md:text-base">
                  ভিজিট করুন <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="bg-gov-green text-white px-6 md:px-10 py-3 md:py-4 rounded-xl font-bold shadow-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 group text-sm md:text-base">
                    রেজিস্ট্রেশন করুন <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/login" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 md:px-10 py-3 md:py-4 rounded-xl font-bold hover:bg-white hover:text-gov-green transition-all text-center text-sm md:text-base">
                    লগইন করুন
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Areas */}
      <main className="max-w-7xl mx-auto py-20 px-4 sm:px-10 bg-slate-50 shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.1)] -mt-10 rounded-t-[40px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Info Cards */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <h3 className="text-3xl font-black text-slate-800 font-bengali mb-2">সেবাসমূহ</h3>
              <div className="w-16 h-1.5 bg-gov-green rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link to="/signup" className="group">
                <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col gap-6 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-[100px] font-black pointer-events-none">01</div>
                  <div className="bg-gov-green/5 w-16 h-16 rounded-2xl flex items-center justify-center text-gov-green group-hover:bg-gov-green group-hover:text-white transition-colors">
                    <UserPlus size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl font-bengali mb-2 group-hover:text-gov-green">নতুন অ্যাকাউন্ট খোলা</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">আপনার প্রয়োজনীয় তথ্য ও ছবি দিয়ে আইডি কার্ডের জন্য প্রাথমিক রেজিস্ট্রেশন সম্পন্ন করুন।</p>
                  </div>
                </div>
              </Link>

              <Link to="/login" className="group">
                <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col gap-6 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-[100px] font-black pointer-events-none">02</div>
                  <div className="bg-gov-red/5 w-16 h-16 rounded-2xl flex items-center justify-center text-gov-red group-hover:bg-gov-red group-hover:text-white transition-colors">
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl font-bengali mb-2 group-hover:text-gov-red">ডিজিটাল আইডি কার্ড</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">অনুমোদিত শিক্ষার্থীরা যেকোনো সময় তাদের ডিজিটাল আইডি কার্ড ডাউনলোড ও প্রিন্ট করতে পারবেন।</p>
                  </div>
                </div>
              </Link>
            </div>

            <div className="bg-white rounded-[30px] p-10 border border-slate-200 shadow-sm">
               <h3 className="text-xl font-bold mb-8 font-bengali flex items-center gap-3">
                 <span className="w-8 h-8 bg-gov-green text-white rounded-lg flex items-center justify-center text-sm">!</span>
                 আইডি কার্ড সংগ্রহের নিয়মাবলি:
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { t: 'ধাপ ১', d: 'সঠিক তথ্য দিয়ে প্রোফাইল আপডেট করুন।' },
                   { t: 'ধাপ ২', d: '৩০০x৩০০ সাইজের পরিষ্কার ছবি আপলোড দিন।' },
                   { t: 'ধাপ ৩', d: 'সাদা কাগজে স্বাক্ষর করে ছবি আপলোড দিন।' },
                   { t: 'ধাপ ৪', d: 'এডমিন অনুমোদন দিলে কার্ড ডাউনলোড করুন।' }
                 ].map(step => (
                   <div key={step.t} className="flex gap-4">
                     <div className="text-gov-green font-black text-2xl opacity-20">{step.t.split(' ')[1]}</div>
                     <div>
                       <p className="font-bold text-slate-800 font-bengali">{step.t}</p>
                       <p className="text-sm text-slate-500 font-bengali">{step.d}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Right: Sidebar Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-6">
                <h3 className="text-white font-bold font-bengali tracking-tight uppercase text-sm">গুরুত্বপূর্ণ লিংক</h3>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { name: 'TEMIS', url: 'https://temis.gov.bd/' },
                  { name: 'শিক্ষা মন্ত্রণালয়', url: 'https://moedu.gov.bd/' },
                  { name: 'কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ', url: 'https://tmed.gov.bd/' },
                  { name: 'কারিগরি শিক্ষা অধিদপ্তর', url: 'http://dte.gov.bd/' },
                  { name: 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড', url: 'http://bteb.gov.bd/' },
                  { name: 'BTEB ই-সেবা', url: 'http://eservice.bteb.gov.bd/' },
                  { name: 'অনলাইনে বদলি', url: 'http://onserv.dte.gov.bd/' }
                ].map(link => (
                  <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="p-4 block flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-all group">
                    <span className="font-bengali text-sm font-medium text-slate-600 group-hover:text-gov-green">{link.name}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-gov-green" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-gov-green p-8 rounded-[30px] text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Mail size={120} />
              </div>
              <h3 className="font-bold text-xl mb-4 font-bengali">সহযোগিতা প্রয়োজন?</h3>
              <p className="text-sm opacity-80 mb-6 font-bengali leading-relaxed">রেজিস্ট্রেশন বা কার্ড ডাউনলোড করতে কোনো সমস্যায় পড়লে আমাদের হেল্পডেস্কে যোগাযোগ করুন।</p>
              <a href="tel:+8802997714718" className="bg-white text-gov-green px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                <Phone size={18} /> কল করুন
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
