import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const CloudOptixLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
    >
      <defs>
        {/* Sky blue to indigo gradient matching the uploaded logo */}
        <linearGradient id="cloudLogoGradient" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" /> {/* Sky blue */}
          <stop offset="100%" stopColor="#1d4ed8" /> {/* Royal/deep blue */}
        </linearGradient>
      </defs>
      
      {/* Cloud Shape */}
      <path
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C22.31 20 25 17.31 25 14C25 11.09 22.92 8.59 19.35 10.04Z"
        fill="url(#cloudLogoGradient)"
      />
      
      {/* Internal Bar Chart (translucent white for premium contrast) */}
      <rect x="7" y="13" width="1.8" height="4" rx="0.4" fill="white" fillOpacity="0.8" />
      <rect x="10.5" y="10.5" width="1.8" height="6.5" rx="0.4" fill="white" fillOpacity="0.8" />
      <rect x="14" y="8" width="1.8" height="9" rx="0.4" fill="white" fillOpacity="0.8" />
      
      {/* Rising Trend Line (dark navy for clear visibility, overlaying the bars) */}
      <path
        d="M6 14.5L9.5 11.5L13 12.5L16.5 8"
        stroke="#0b1329"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Rising Trend Line Dot */}
      <circle cx="16.5" cy="8" r="0.9" fill="#0b1329" />
    </svg>
  );
};
