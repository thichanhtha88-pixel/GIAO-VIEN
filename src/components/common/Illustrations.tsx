import React from 'react';

// Cute yellow school building illustration (matches top right banner)
export const SchoolIllustration: React.FC<{ className?: string }> = ({ className = 'w-32 h-20' }) => {
  return (
    <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trees in background */}
      <circle cx="35" cy="75" r="22" fill="#34D399" />
      <circle cx="25" cy="70" r="16" fill="#10B981" />
      <rect x="32" y="80" width="6" height="25" fill="#78350F" rx="2" />
      
      <circle cx="165" cy="75" r="22" fill="#34D399" />
      <circle cx="175" cy="70" r="16" fill="#10B981" />
      <rect x="162" y="80" width="6" height="25" fill="#78350F" rx="2" />

      {/* Main Base */}
      <rect x="40" y="55" width="120" height="50" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" rx="4" />
      
      {/* Central Tower */}
      <rect x="85" y="30" width="30" height="40" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
      <polygon points="82,30 100,10 118,30" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
      
      {/* Flagpole */}
      <line x1="100" y1="10" x2="100" y2="0" stroke="#475569" strokeWidth="1.5" />
      <polygon points="100,0 112,4 100,8" fill="#EF4444" />

      {/* Clock on Tower */}
      <circle cx="100" cy="42" r="7" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1.5" />
      <line x1="100" y1="42" x2="100" y2="38" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="100" y1="42" x2="103" y2="42" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />

      {/* Roof left & right */}
      <polygon points="36,55 42,50 100,50 96,55" fill="#E11D48" />
      <polygon points="104,55 100,50 158,50 164,55" fill="#E11D48" />

      {/* Windows Left */}
      <rect x="48" y="62" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />
      <rect x="66" y="62" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />
      <rect x="48" y="80" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />
      <rect x="66" y="80" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />

      {/* Windows Right */}
      <rect x="122" y="62" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />
      <rect x="140" y="62" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />
      <rect x="122" y="80" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />
      <rect x="140" y="80" width="12" height="12" fill="#67E8F9" stroke="#0891B2" strokeWidth="1.5" rx="1" />

      {/* Main Entrance Door */}
      <path d="M92 105 V82 Q100 76 108 82 V105 Z" fill="#9333EA" stroke="#6B21A8" strokeWidth="1.5" />
      <circle cx="103" cy="94" r="1.5" fill="#FDE047" />

      {/* Ground Line */}
      <line x1="10" y1="105" x2="190" y2="105" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

// Teacher Avatar
export const TeacherAvatar: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`relative rounded-full overflow-hidden bg-sky-100 border-2 border-white shadow-sm flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        {/* Background */}
        <circle cx="24" cy="24" r="24" fill="#E0F2FE" />
        {/* Hair Back */}
        <path d="M12 28C10 20 13 10 24 10C35 10 38 20 36 28C36 34 33 40 33 40H15C15 40 12 34 12 28Z" fill="#1E293B" />
        {/* Neck */}
        <rect x="20" y="27" width="8" height="8" fill="#FBCFE8" />
        {/* Shirt Collar */}
        <path d="M15 40C15 34 19 32 24 32C29 32 33 34 33 40H15Z" fill="#0284C7" />
        <polygon points="24,35 21,32 27,32" fill="#FFFFFF" />
        {/* Face */}
        <circle cx="24" cy="22" r="9" fill="#FDE047" />
        {/* Eyes & Smile */}
        <circle cx="21" cy="21" r="1.2" fill="#0F172A" />
        <circle cx="27" cy="21" r="1.2" fill="#0F172A" />
        <path d="M22 25 Q24 27 26 25" stroke="#BE123C" strokeWidth="1.2" strokeLinecap="round" />
        {/* Hair Bangs */}
        <path d="M15 20C17 15 22 14 24 16C26 14 31 15 33 20C32 15 29 13 24 13C19 13 16 15 15 20Z" fill="#1E293B" />
        {/* Glasses */}
        <rect x="18" y="19" width="5" height="4" rx="1.5" stroke="#0284C7" strokeWidth="1" fill="none" />
        <rect x="25" y="19" width="5" height="4" rx="1.5" stroke="#0284C7" strokeWidth="1" fill="none" />
        <line x1="23" y1="21" x2="25" y2="21" stroke="#0284C7" strokeWidth="1" />
      </svg>
    </div>
  );
};

// Top Left Logo
export const PrimaryITLogo: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  return (
    <div className={`rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 p-2 shadow-md flex items-center justify-center border border-sky-300/40 ${className}`}>
      <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        {/* Code inside */}
        <polyline points="9 8 7 10 9 12" stroke="#FEF08A" strokeWidth="1.8" />
        <polyline points="15 8 17 10 15 12" stroke="#FEF08A" strokeWidth="1.8" />
        <line x1="13" y1="8" x2="11" y2="12" stroke="#FEF08A" strokeWidth="1.8" />
      </svg>
    </div>
  );
};

// Sidebar Bottom Cute Boy Student with Laptop illustration
export const StudentSidebarIllustration: React.FC<{ className?: string }> = ({ className = 'w-36 h-36' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
        {/* Floating tech icons */}
        <g opacity="0.85">
          {/* Code badge */}
          <rect x="110" y="20" width="34" height="24" rx="6" fill="#1E40AF" stroke="#60A5FA" strokeWidth="1.5" />
          <text x="115" y="36" fill="#93C5FD" fontSize="11" fontWeight="bold" fontFamily="monospace">{"< / >"}</text>

          {/* Glowing Lightbulb */}
          <circle cx="125" cy="80" r="10" fill="#FDE047" />
          <path d="M122 90 H128" stroke="#CA8A04" strokeWidth="2" />
          <line x1="125" y1="65" x2="125" y2="60" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
          <line x1="138" y1="74" x2="142" y2="71" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />

          {/* Cloud & Gear */}
          <circle cx="28" cy="45" r="9" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="23" y="42" width="10" height="6" rx="2" fill="#BAE6FD" />

          {/* Gear icon left */}
          <circle cx="34" cy="82" r="8" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="1.5" />
          <circle cx="34" cy="82" r="3" fill="#60A5FA" />
        </g>

        {/* Student Body */}
        {/* Hair */}
        <path d="M52 75 C45 55 52 42 75 42 C98 42 105 55 98 75 C95 62 88 56 75 56 C62 56 55 62 52 75 Z" fill="#1E293B" />
        {/* Ears */}
        <circle cx="56" cy="72" r="4" fill="#FCD34D" />
        <circle cx="94" cy="72" r="4" fill="#FCD34D" />
        {/* Face */}
        <circle cx="75" cy="72" r="16" fill="#FDE047" />
        {/* Eyes & smile */}
        <circle cx="69" cy="70" r="2" fill="#0F172A" />
        <circle cx="81" cy="70" r="2" fill="#0F172A" />
        <path d="M71 78 Q75 83 79 78" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
        {/* Hair Fringe */}
        <path d="M59 62 C63 56 70 54 75 58 C80 54 87 56 91 62 C85 60 80 61 75 64 C70 61 65 60 59 62 Z" fill="#1E293B" />
        
        {/* Torso - Light blue shirt */}
        <path d="M50 110 C50 96 60 92 75 92 C90 92 100 96 100 110 V125 H50 V110 Z" fill="#38BDF8" />
        <polygon points="75,98 68,92 82,92" fill="#FFFFFF" />

        {/* Arms */}
        <path d="M48 108 L62 118" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" />
        <path d="M102 108 L88 118" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" />

        {/* Laptop open */}
        {/* Screen */}
        <rect x="52" y="98" width="46" height="30" rx="3" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.5" />
        <rect x="55" y="101" width="40" height="24" rx="2" fill="#0284C7" />
        {/* Small code on laptop screen */}
        <line x1="60" y1="108" x2="72" y2="108" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="113" x2="85" y2="113" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="118" x2="78" y2="118" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />

        {/* Laptop Keyboard Base */}
        <polygon points="44,136 106,136 100,128 50,128" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
        
        {/* Glow under laptop */}
        <ellipse cx="75" cy="144" rx="40" ry="6" fill="#38BDF8" opacity="0.3" />
      </svg>
    </div>
  );
};
