import React from 'react';

export default function GovtSealSvg({ className = "w-[140px] h-[140px] object-contain" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
      id="govt-seal-svg-element"
    >
      {/* Outer green circle */}
      <circle cx="50" cy="50" r="48" fill="#006a4e" stroke="#f2a900" strokeWidth="2.5" />
      
      {/* Center red circle */}
      <circle cx="50" cy="50" r="26" fill="#f42a41" />
      
      {/* Inner dotted yellow boundary */}
      <circle cx="50" cy="50" r="21" fill="none" stroke="#f2a900" strokeWidth="1.2" strokeDasharray="3 1.5" />
      
      {/* High-fidelity Map of Bangladesh inside red circle */}
      <path 
        d="M 50,30 
           C 51.5,33 53.5,32 54.5,35 
           C 55.5,36 57.5,36 58.5,38 
           C 59.5,40 59.5,43 56.5,43 
           C 56.5,45 54.5,44 53.5,46 
           C 53.5,48 55.5,49 54.5,51 
           C 53.5,52 50.5,50 49.5,53 
           C 48.5,54 49.5,57 47.5,59 
           C 45.5,60 44.5,58 43.5,62 
           C 42.5,63 45.5,65 44.5,67 
           C 41.5,68 39.5,64 38.5,65 
           C 37.5,66 39.5,70 37.5,71 
           C 35.5,71 36.5,68 35.5,67
           C 36.5,64 39.5,63 41.5,60
           C 42.5,59 41.5,56 43.5,55
           C 44.5,54 44.5,51 43.5,49
           C 42.5,47 45.5,45 45.5,43
           C 45.5,41 43.5,40 43.5,38
           C 44.5,36 47.5,38 48.5,36
           Z" 
        fill="#f2a900" 
      />
      
      <defs>
        {/* Curved path templates for text following */}
        <path id="textPathTop" d="M 12,50 A 38,38 0 0,1 88,50" fill="none" />
        <path id="textPathBottom" d="M 88,50 A 38,38 0 0,1 12,50" fill="none" />
      </defs>
      
      <text fill="#ffffff" fontSize="7.8" fontWeight="bold" fontFamily="sans-serif">
        <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
          গণপ্রজাতন্ত্রী বাংলাদেশ
        </textPath>
      </text>
      
      <text fill="#ffffff" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">
        <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
          সরকার
        </textPath>
      </text>
      
      {/* 2 Stars on the Left */}
      <g fill="#ffffff" transform="translate(13, 44) scale(0.6)">
        <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
      </g>
      <g fill="#ffffff" transform="translate(13, 56) scale(0.6)">
        <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
      </g>
      
      {/* 2 Stars on the Right */}
      <g fill="#ffffff" transform="translate(75, 44) scale(0.6)">
        <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
      </g>
      <g fill="#ffffff" transform="translate(75, 56) scale(0.6)">
        <path d="M 10 0 L 13 7 L 20 7 L 15 11 L 17 18 L 10 14 L 3 18 L 5 11 L 0 7 L 7 7 Z" />
      </g>
    </svg>
  );
}
