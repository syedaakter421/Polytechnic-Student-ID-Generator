import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { User, SystemSettings } from '../types';
import { Download, Printer, ShieldCheck, User as UserIcon, Loader2, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

import { safeFetch } from '../lib/fetchUtils';

// Robust, cross-browser, mobile-safe utility to convert any image URL to standard Base64.
// If the image is already a Base64 string, it resolves immediately without network calls.
const convertToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }
    // If it's already a base64 encoded data URI, return immediately.
    // This is vital for mobile Safari/Chrome, as calling fetch() on data: URIs causes exceptions.
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
        // Canvas fallback for loading and encoding image (e.g. if CORS policy permits standard <img> tag loading)
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

export default function IDCard({ user, onDownload }: { user: User, onDownload?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const frontCaptureRef = useRef<HTMLDivElement>(null);
  const backCaptureRef = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [downloadPngState, setDownloadPngState] = useState<'idle' | 'downloading' | 'success'>('idle');
  const [downloadPdfState, setDownloadPdfState] = useState<'idle' | 'downloading' | 'success'>('idle');

  const [studentPhotoBase64, setStudentPhotoBase64] = useState('');
  const [registrarSigBase64, setRegistrarSigBase64] = useState('');
  const [principalSigBase64, setPrincipalSigBase64] = useState('');
  const [logoBase64, setLogoBase64] = useState('');

  useEffect(() => {
    convertToBase64('/images/logo.png').then(setLogoBase64);
  }, []);

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

  useEffect(() => {
    if (user.photo_path) {
      convertToBase64(user.photo_path).then(setStudentPhotoBase64);
    } else {
      setStudentPhotoBase64('');
    }
  }, [user.photo_path]);

  useEffect(() => {
    if (!settings) return;

    if (settings.id_card_logo_path) {
      convertToBase64(settings.id_card_logo_path).then(setLogoBase64);
    } else {
      convertToBase64('/images/logo.png').then(setLogoBase64);
    }

    if (settings.registrar_signature_path) {
      convertToBase64(settings.registrar_signature_path).then(setRegistrarSigBase64);
    }
    if (settings.principal_signature_path) {
      convertToBase64(settings.principal_signature_path).then(setPrincipalSigBase64);
    }
  }, [settings]);


  const downloadPNG = async () => {
    if (!frontCaptureRef.current || !backCaptureRef.current) return;
    if (downloadPngState !== 'idle') return;

    setDownloadPngState('downloading');
    try {
      await document.fonts.ready;
      const options = {
        pixelRatio: 3,
        skipFonts: false,
        cacheBust: false,
        backgroundColor: '#ffffff',
      };

      // Workaround for Safari/iOS: Pre-warm the canvas render pipeline twice
      await toPng(frontCaptureRef.current, options).catch(() => {});
      await toPng(backCaptureRef.current, options).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrlFront = await toPng(frontCaptureRef.current, options);
      const dataUrlBack = await toPng(backCaptureRef.current, options);

      const linkFront = document.createElement('a');
      linkFront.download = `ID_CARD_${user.roll_number}_FRONT.png`;
      linkFront.href = dataUrlFront;
      linkFront.click();

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const linkBack = document.createElement('a');
          linkBack.download = `ID_CARD_${user.roll_number}_BACK.png`;
          linkBack.href = dataUrlBack;
          linkBack.click();
          resolve();
        }, 450);
      });

      if (onDownload) onDownload();

      setDownloadPngState('success');
      setTimeout(() => {
        setDownloadPngState('idle');
      }, 2000);
      
    } catch (err) {
      console.error('Image download failed:', err);
      setDownloadPngState('idle');
    }
  };

  const downloadPDF = async () => {
    if (!frontCaptureRef.current || !backCaptureRef.current) return;
    if (downloadPdfState !== 'idle') return;

    setDownloadPdfState('downloading');
    try {
      await document.fonts.ready;
      const exportOptions = { 
        pixelRatio: 3,
        skipFonts: false,
        cacheBust: false,
        backgroundColor: '#ffffff',
      };
      
      // Workaround for Safari/iOS: Pre-warm the canvas render pipeline twice
      await toPng(frontCaptureRef.current, exportOptions).catch(() => {});
      await toPng(backCaptureRef.current, exportOptions).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrlFront = await toPng(frontCaptureRef.current, exportOptions);
      const dataUrlBack = await toPng(backCaptureRef.current, exportOptions);
      
      const pdf = new jsPDF('p', 'mm', [66.8, 98.6]);
      pdf.addImage(dataUrlFront, 'PNG', 0, 0, 66.8, 98.6);
      pdf.addPage([66.8, 98.6]);
      pdf.addImage(dataUrlBack, 'PNG', 0, 0, 66.8, 98.6);
      pdf.save(`ID_CARD_${user.roll_number}.pdf`);

      if (onDownload) onDownload();

      setDownloadPdfState('success');
      setTimeout(() => {
        setDownloadPdfState('idle');
      }, 2000);
    } catch (err) {
      console.error('PDF download failed:', err);
      setDownloadPdfState('idle');
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
                src={logoBase64 || "/images/logo.png"} 
                className="w-[140px] h-[140px] object-contain" 
                alt="Logo" 
                crossOrigin="anonymous" 
              />
            </div>
            <div className="w-full bg-[#004d61] py-3">
              <h1 className="text-[28px] font-black text-white uppercase tracking-tight">
                SHERPUR GOVT. POLYTECHNIC INSTITUTE, SHERPUR
              </h1>
            </div>
          </div>

          {/* Top Design / Shield */}
          <div className="h-[320px] bg-[#dff3f6] [clip-path:ellipse(80%_100%_at_50%_0%)] flex justify-center">
            <div className="w-[340px] bg-[#ffcc29] mt-0 p-[8px] rounded-b-[160px] h-[360px] z-[2] shadow-xl">
              <div className="text-[28px] font-black text-slate-800 mb-2 mt-2">Student ID Card</div>
              <div className="bg-slate-200 w-[260px] h-[280px] mx-auto rounded-b-[120px] flex items-center justify-center border-[6px] border-white overflow-hidden shadow-inner">
                {studentPhotoBase64 || user.photo_path ? (
                  <img src={studentPhotoBase64 || user.photo_path} className="w-full h-full object-cover" alt="Student" crossOrigin="anonymous" />
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
                {(registrarSigBase64 || settings.registrar_signature_path) && <img src={registrarSigBase64 || settings.registrar_signature_path} className="max-h-full" alt="" crossOrigin="anonymous" />}
              </div>
              <div className="border-t-2 border-[#002d3a] pt-1 text-[22px] font-black">Registrar</div>
            </div>
            <div className="text-center w-[200px]">
              <div className="h-20 flex items-end justify-center mb-1">
                {(principalSigBase64 || settings.principal_signature_path) && <img src={principalSigBase64 || settings.principal_signature_path} className="max-h-full" alt="" crossOrigin="anonymous" />}
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
              <h2 className="text-[26px] font-black text-center uppercase tracking-tight">SHERPUR GOVT. POLYTECHNIC INSTITUTE, SHERPUR.</h2>
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
                    <h3 className="text-[26px] font-black uppercase mb-2 leading-tight">SHERPUR GOVT. POLYTECHNIC INSTITUTE</h3>
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
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '791px',
          height: '2400px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1000,
          background: '#fff'
        }}
      >
        {renderFrontSide(frontCaptureRef, true)}
        {renderBackSide(backCaptureRef, true)}
      </div>

      <div className="flex gap-4 mb-4 sticky top-4 z-[10] bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200">
        <button 
          onClick={downloadPNG} 
          disabled={downloadPngState !== 'idle'}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold font-bengali shadow-lg transition-all min-w-[145px] hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-90 ${
            downloadPngState === 'success' 
            ? 'bg-[#15803d] text-white shadow-[#15803d]/20' 
            : downloadPngState === 'downloading'
            ? 'bg-gov-green/80 text-white shadow-gov-green/10 cursor-wait'
            : 'bg-gov-green text-white hover:bg-gov-green-dark shadow-gov-green/20'
          }`}
        >
          {downloadPngState === 'downloading' && (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>ডাউনলোড হচ্ছে...</span>
            </>
          )}
          {downloadPngState === 'success' && (
            <>
              <Check size={18} className="animate-bounce" />
              <span>সম্পন্ন হয়েছে!</span>
            </>
          )}
          {downloadPngState === 'idle' && (
            <>
              <Download size={18} />
              <span>ছবি ডাউনলোড</span>
            </>
          )}
        </button>

        <button 
          onClick={downloadPDF} 
          disabled={downloadPdfState !== 'idle'}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold font-bengali shadow-lg transition-all min-w-[155px] hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-90 ${
            downloadPdfState === 'success' 
            ? 'bg-[#15803d] text-white shadow-[#15803d]/20' 
            : downloadPdfState === 'downloading'
            ? 'bg-slate-700 text-white shadow-slate-900/10 cursor-wait'
            : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/20'
          }`}
        >
          {downloadPdfState === 'downloading' && (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>পিডিএফ হচ্ছে...</span>
            </>
          )}
          {downloadPdfState === 'success' && (
            <>
              <Check size={18} className="animate-bounce" />
              <span>সম্পন্ন হয়েছে!</span>
            </>
          )}
          {downloadPdfState === 'idle' && (
            <>
              <Printer size={18} />
              <span>পিডিএফ ডাউনলোড</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-16 items-center lg:items-start justify-center w-full max-w-full">
        {/* Front Side Preview */}
        <div className="flex flex-col items-center gap-6 max-w-full">
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] font-sans text-center">Front Side Preview</span>
          <div className="max-w-full overflow-x-auto pb-4 px-2 flex justify-center w-full">
            <div style={{ width: previewWidth, height: previewHeight }} className="relative shrink-0 rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-slate-200">
              <div className="origin-top-left" style={{ zoom: cardScale }}>
                {renderFrontSide(cardRef)}
              </div>
            </div>
          </div>
        </div>

        {/* Back Side Preview */}
        <div className="flex flex-col items-center gap-6 max-w-full">
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] font-sans text-center">Back Side Preview</span>
          <div className="max-w-full overflow-x-auto pb-4 px-2 flex justify-center w-full">
            <div style={{ width: previewWidth, height: previewHeight }} className="relative shrink-0 rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-slate-200">
              <div className="origin-top-left" style={{ zoom: cardScale }}>
                {renderBackSide(backCardRef)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
