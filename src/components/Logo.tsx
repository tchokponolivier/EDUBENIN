import React from 'react';

export function EduBeninLogo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Left Vertical Panel */}
      <path d="M 25,60 L 55,50 L 55,120 L 25,140 Z" fill="#166534" />
      
      {/* Left Bottom Panel */}
      <path d="M 25,140 L 55,120 L 100,145 L 100,180 Z" fill="#15803d" />
      
      {/* Right Bottom Panel */}
      <path d="M 100,180 L 100,145 L 145,120 L 175,140 Z" fill="#16a34a" />
      
      {/* Right Vertical Panel */}
      <path d="M 175,140 L 145,120 L 145,50 L 175,60 Z" fill="#22c55e" />

      {/* Graduation Cap Top */}
      <path d="M 100,20 L 60,40 L 100,60 L 140,40 Z" fill="#15803d" />
      
      {/* Graduation Cap Base */}
      <path d="M 75,52.5 L 75,65 L 100,80 L 125,65 L 125,52.5 L 100,67.5 Z" fill="#15803d" />
      
      {/* Tassel */}
      <path d="M 136,42 L 136,65 L 133,80 L 139,80 L 136,65 Z" fill="#15803d" />

      {/* Person Head */}
      <circle cx="100" cy="90" r="12" fill="#15803d" />

      {/* Left Page */}
      <path d="M 98,135 L 65,115 L 65,95 C 75,105 85,110 98,110 Z" fill="#15803d" />
      
      {/* Right Page */}
      <path d="M 102,135 L 135,115 L 135,95 C 125,105 115,110 102,110 Z" fill="#16a34a" />
    </svg>
  );
}
