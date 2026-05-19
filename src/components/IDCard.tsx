import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { User, SystemSettings } from '../types';
import { Download, Printer, ShieldCheck, User as UserIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

import { safeFetch } from '../lib/fetchUtils';

export default function IDCard({ user, onDownload }: { user: User, onDownload?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const frontCaptureRef = useRef<HTMLDivElement>(null);
  const backCaptureRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(`ID:${user.roll_number}|Name:${user.full_name_en}`, {
      margin: 1,
      width: 100,
    }).then(setQrCode);

    setError(null);
    safeFetch('/api/settings')
      .then(setSettings)
      .catch(err => {
        console.error('Settings fetch error:', err);
        setError(err.message);
      });
  }, [user]);

  const downloadPNG = async () => {
    if (!frontCaptureRef.current || !backCaptureRef.current) return;
    try {
      await document.fonts.ready;
      const options = {
        pixelRatio: 3,
        skipFonts: false,
        cacheBust: true,
        backgroundColor: '#ffffff',
      };

      const dataUrlFront = await toPng(frontCaptureRef.current, options);
      const dataUrlBack = await toPng(backCaptureRef.current, options);

      const linkFront = document.createElement('a');
      linkFront.download = `ID_CARD_${user.roll_number}_FRONT.png`;
      linkFront.href = dataUrlFront;
      linkFront.click();

      setTimeout(() => {
        const linkBack = document.createElement('a');
        linkBack.download = `ID_CARD_${user.roll_number}_BACK.png`;
        linkBack.href = dataUrlBack;
        linkBack.click();
      }, 500);

      if (onDownload) onDownload();
      
    } catch (err) {
      console.error('Image download failed:', err);
    }
  };

  const downloadPDF = async () => {
    if (!frontCaptureRef.current || !backCaptureRef.current) return;
    try {
      await document.fonts.ready;
      const exportOptions = { 
        pixelRatio: 3,
        skipFonts: false,
        cacheBust: true,
        backgroundColor: '#ffffff',
      };
      
      const dataUrlFront = await toPng(frontCaptureRef.current, exportOptions);
      const dataUrlBack = await toPng(backCaptureRef.current, exportOptions);
      
      const pdf = new jsPDF('p', 'mm', [66.8, 98.6]);
      pdf.addImage(dataUrlFront, 'PNG', 0, 0, 66.8, 98.6);
      pdf.addPage([66.8, 98.6]);
      pdf.addImage(dataUrlBack, 'PNG', 0, 0, 66.8, 98.6);
      pdf.save(`ID_CARD_${user.roll_number}.pdf`);

      if (onDownload) onDownload();
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  const renderFrontSide = (ref: React.RefObject<HTMLDivElement>, isCapture = false) => (
    <div 
      ref={ref} 
      className={`${isCapture ? '' : 'id-card-element'} w-[791px] h-[1169px] bg-white rounded-[24px] border border-slate-300 relative overflow-hidden font-sans flex flex-col shrink-0`}
    >
      {settings?.id_card_template === 'sherpur' ? (
        <div className="relative h-full w-full bg-gradient-to-b from-white via-[#00a8c5] to-[#50c8d8] text-center overflow-hidden">
          {/* Header */}
          <div className="pt-8">
            <div className="flex justify-center mb-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/300px-Government_Seal_of_Bangladesh.svg.png" 
                className="w-[140px] h-[140px] object-contain" 
                alt="Logo" 
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg";
                }}
              />
            </div>
            <div className="w-full bg-[#004d61] py-3">
              <h1 className="text-[28px] font-black text-white uppercase tracking-tight">
                SHERPUR POLYTECHNIC INSTITUTE, SHERPUR
              </h1>
            </div>
          </div>

          {/* Top Design / Shield */}
          <div className="h-[320px] bg-[#dff3f6] [clip-path:ellipse(80%_100%_at_50%_0%)] flex justify-center">
            <div className="w-[340px] bg-[#ffcc29] -mt-1 p-[8px] rounded-b-[160px] h-[360px] z-[2] shadow-xl">
              <div className="text-[28px] font-black text-slate-800 mb-2 mt-2">Student ID Card</div>
              <div className="bg-slate-200 w-[260px] h-[280px] mx-auto rounded-b-[120px] flex items-center justify-center border-[6px] border-white overflow-hidden shadow-inner">
                {user.photo_path ? (
                  <img src={user.photo_path} className="w-full h-full object-cover" alt="Student" crossOrigin="anonymous" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <UserIcon size={100} />
                    <span className="text-[16px] font-bold mt-2">Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-20 px-12 text-[#002d3a] items-center">
            <h2 className="text-[48px] font-black uppercase mb-4 tracking-wide drop-shadow-sm">
              {user.full_name_en}
            </h2>
            
            <div className="space-y-1 w-full text-[28px]">
              <div className="flex items-center justify-center gap-2">
                <span className="font-black">Technology :</span>
                <span className="font-bold uppercase">{user.technology}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-black">Roll No :</span>
                <span className="font-bold">{user.roll_number}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-black">Shift:</span>
                <span className="font-bold">{user.shift || 'SHIFT'}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 -mb-1">
                <span className="font-black">Semester:</span>
              </div>
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

              <div className="flex items-center justify-center gap-2">
                <span className="font-black">Session:</span>
                <span className="font-bold">{user.session}</span>
              </div>
            </div>
          </div>

          {/* Footer / Signatures */}
          <div className="absolute bottom-16 left-0 w-full px-20 flex justify-between">
            <div className="text-center w-[200px]">
              <div className="h-20 flex items-end justify-center mb-1">
                {settings.registrar_signature_path && <img src={settings.registrar_signature_path} className="max-h-full" alt="" crossOrigin="anonymous" />}
              </div>
              <div className="border-t-2 border-[#002d3a] pt-1 text-[22px] font-black">Registrar</div>
            </div>
            <div className="text-center w-[200px]">
              <div className="h-20 flex items-end justify-center mb-1">
                {settings.principal_signature_path && <img src={settings.principal_signature_path} className="max-h-full" alt="" crossOrigin="anonymous" />}
              </div>
              <div className="border-t-2 border-[#002d3a] pt-1 text-[22px] font-black">Principal</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center">Standard Template...</div>
      )}
    </div>
  );

  const renderBackSide = (ref: React.RefObject<HTMLDivElement>, isCapture = false) => (
    <div 
      ref={ref} 
      className={`${isCapture ? '' : 'id-card-element'} w-[791px] h-[1169px] bg-white rounded-[24px] border border-slate-300 relative overflow-hidden font-sans shrink-0`}
    >
      {settings?.id_card_template === 'sherpur' ? (
        <div className="relative h-full w-full bg-white flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[40px] bg-[#FFBC0D]"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-[#00a0be] text-white py-3 mt-[40px]">
              <h2 className="text-[26px] font-black text-center uppercase tracking-tight">SHERPUR POLYTECHNIC INSTITUTE, SHERPUR.</h2>
            </div>

            <div className="px-12 pt-12 pb-6 h-full flex flex-col items-center">
              <div className="flex items-center bg-slate-100 px-6 py-3 rounded-xl border-2 border-slate-200 shadow-inner mb-6">
                <span className="text-[24px] font-black text-slate-800 mr-4">Valid Upto : </span>
                <span className="text-[24px] font-black text-[#00a0be] uppercase tracking-wide">
                  {user.valid_upto || '2027'}
                </span>
              </div>

              <div className="border-2 border-slate-800 rounded-full px-12 py-3 shadow-md bg-slate-50 mb-8">
                <h4 className="text-[22px] font-black uppercase text-slate-800 tracking-wider">Personal Details</h4>
              </div>

              <div className="w-full space-y-6 px-4">
                <div className="flex items-center">
                  <span className="w-[230px] shrink-0 text-[25px] font-black text-slate-800">Fathers  Name  : </span>
                  <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1">{user.father_name || '________________'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[230px] shrink-0 text-[25px] font-black text-slate-800">Mothers  Name  : </span>
                  <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1">{user.mother_name || '________________'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[230px] shrink-0 text-[25px] font-black text-slate-800">Blood  Group  : </span>
                  <span className="w-[100px] border-b-2 border-slate-400 text-[22px] font-black text-red-600 text-center pb-1">{user.blood_group || '__'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[230px] shrink-0 text-[25px] font-black text-slate-800">Guardian  Mobile  : </span>
                  <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1">{user.guardian_mobile || '________________'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[230px] shrink-0 text-[25px] font-black text-slate-800">Student  Mobile  : </span>
                  <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1">{user.student_mobile || user.mobile || '________________'}</span>
                </div>
              </div>

              <div className="mt-8 w-full flex flex-col items-center">
                 <h4 className="text-[26px] font-black text-slate-800 mb-6 border-b-4 border-[#00a0be] pb-1">Address  :</h4>
                 <div className="w-full space-y-4 px-4 text-center">
                    <div className="grid grid-cols-2 gap-6 w-full">
                       <div className="flex items-center gap-2">
                         <span className="text-[20px] font-black text-slate-800 shrink-0">Vill : </span>
                         <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1 overflow-hidden whitespace-nowrap">{user.village || '________________'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-[20px] font-black text-slate-800 shrink-0">Post : </span>
                         <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1 overflow-hidden whitespace-nowrap">{user.post_office || '____'}</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 w-full">
                       <div className="flex items-center gap-2">
                         <span className="text-[20px] font-black text-slate-800 shrink-0">Upazilla : </span>
                         <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1 overflow-hidden whitespace-nowrap">{user.upazilla || '________________'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-[20px] font-black text-slate-800 shrink-0">District : </span>
                         <span className="flex-1 border-b-2 border-slate-400 text-[20px] font-bold text-slate-700 pb-1 overflow-hidden whitespace-nowrap">{user.district || '________________'}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="absolute bottom-8 left-0 w-full flex justify-center">
                 <div className="bg-[#00a0be] text-white p-6 w-[90%] rounded-2xl shadow-xl flex flex-col items-center text-center">
                    <p className="text-[18px] font-black uppercase mb-3">If found please return to</p>
                    <h3 className="text-[26px] font-black uppercase mb-2 leading-tight">SHERPUR POLYTECHNIC INSTITUTE</h3>
                    <p className="text-[18px] font-bold mb-1">Bhatshala, Sherpur-2100,</p>
                    <p className="text-[18px] font-bold mb-3">Contact : 01309136071</p>
                    <div className="border-t border-white/30 pt-3 w-full">
                       <p className="text-[16px] font-black opacity-90 tracking-wider">web: https://sherpur.polytech.gov.bd</p>
                    </div>
                 </div>
              </div>
            </div>
            </div>
            
            <div className="absolute left-6 top-[30%] -rotate-90 origin-left">
               <p className="text-[14px] font-bold text-slate-300 tracking-widest">{user.roll_number} {user.technology}</p>
            </div>
          </div>
      ) : (
        <div className="p-10 text-center">Standard Template...</div>
      )}
    </div>
  );

  const cardScale = 0.45;
  const portraitWidth = 791;
  const portraitHeight = 1169;

  const previewWidth = portraitWidth * cardScale;
  const previewHeight = portraitHeight * cardScale;

  if (error) {
    return (
      <div className="p-10 text-center space-y-4">
        <p className="text-red-500 font-bengali font-bold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-gov-green text-white px-6 py-2 rounded-xl text-sm font-bold font-bengali"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!settings) return <div className="p-10 text-center font-bengali">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-12 flex flex-col items-center w-full px-4">
      {/* Hidden Capture Area for High Quality Download (1:1 scale) */}
      <div
        style={{
          position: 'fixed',
          top: '-99999px',
          left: '-99999px',
          pointerEvents: 'none',
          zIndex: -1000,
          background: '#fff'
        }}
      >
        {renderFrontSide(frontCaptureRef, true)}
        <div style={{ marginTop: '1200px' }}>
          {renderBackSide(backCaptureRef, true)}
        </div>
      </div>

      <div className="flex gap-4 mb-4 sticky top-4 z-[10] bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200">
        <button onClick={downloadPNG} className="flex items-center gap-2 bg-gov-green text-white px-5 py-2.5 rounded-xl hover:bg-gov-green-dark transition-all text-sm font-bold font-bengali shadow-lg shadow-gov-green/20">
          <Download size={18} /> ছবি ডাউনলোড
        </button>
        <button onClick={downloadPDF} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-900 transition-all text-sm font-bold font-bengali shadow-lg shadow-slate-900/20">
          <Printer size={18} /> পিডিএফ ডাউনলোড
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-16 items-center lg:items-start justify-center w-full">
        {/* Front Side Preview */}
        <div className="flex flex-col items-center gap-6">
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] font-sans">Front Side Preview</span>
          <div style={{ width: previewWidth, height: previewHeight }} className="relative shrink-0 rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-slate-200">
            <div className="origin-top-left" style={{ zoom: cardScale }}>
              {renderFrontSide(cardRef)}
            </div>
          </div>
        </div>

        {/* Back Side Preview */}
        <div className="flex flex-col items-center gap-6">
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] font-sans">Back Side Preview</span>
          <div style={{ width: previewWidth, height: previewHeight }} className="relative shrink-0 rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-slate-200">
            <div className="origin-top-left" style={{ zoom: cardScale }}>
              {renderBackSide(backCardRef)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
