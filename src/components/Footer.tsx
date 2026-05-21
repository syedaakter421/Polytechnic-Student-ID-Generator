import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#f3f4f6] text-slate-700 pt-0 relative border-t border-slate-200 mt-12 overflow-hidden w-full">
      {/* Bottom Support & Copyright Section */}
      <div className="relative">
        {/* Skyline Background Image */}
        <div className="w-full">
          <img src="/images/footer_top_bg.png" className="w-full h-auto max-h-[115px] object-cover opacity-80" alt="" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-10 pb-12 pt-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
            <div className="text-xs text-slate-600 space-y-2 font-bengali text-center md:text-left">
              <p className="font-bold">© ২০২৪ শেরপুর সরকারি পলিটেকনিক ইনস্টিটিউট। সকল স্বত্ব সংরক্ষিত।</p>
              <p className="opacity-80">সাইটটি সর্বশেষ হাল-নাগাদ করা হয়েছে: রবিবার, ১০ মে, ২০২৬ এ ২০:৫৪:২৩</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-6 text-center md:text-right">
               <div className="flex flex-col items-center md:items-end">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1 border-b border-slate-300 pb-1">Planning & Implementation</p>
                  <p className="text-xs font-bold text-slate-700 font-bengali">কারিগরি শাখা, শেরপুর সরকারি পলিটেকনিক ইনস্টিটিউট</p>
               </div>
               
               <div className="flex flex-col sm:flex-row items-center gap-4">
                  <span className="text-xs font-bold text-slate-500 font-bengali">কারিগরি সহযোগিতায়:</span>
                  <div className="bg-white/50 p-2 rounded-lg backdrop-blur-sm border border-white">
                    <img src="/images/technical-support.png" className="h-10 md:h-12 w-auto object-contain opacity-100" alt="Support Logos" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
