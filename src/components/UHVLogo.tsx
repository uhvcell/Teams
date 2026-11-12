import React, { useState } from 'react';
import { storageService } from '../services/storage';
import officialLogoImg from '../assets/uhv-logo.png';

interface UHVLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const UHVLogo: React.FC<UHVLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const settings = storageService.getSettings();

  // Prefer custom logo from settings, bundled official asset, or public static file
  const logoSrc = settings.customLogoUrl || officialLogoImg || '/uhv-logo.png';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-white shadow-xs ${sizeClasses[size]}`}
      >
        {!imageFailed ? (
          <img
            src={logoSrc}
            alt="UHV CELL – NBKRIST Official Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => {
              if (logoSrc !== '/uhv-logo.png') {
                const img = new Image();
                img.src = '/uhv-logo.png';
                img.onload = () => {
                  // static path loaded
                };
                img.onerror = () => {
                  setImageFailed(true);
                };
              } else {
                setImageFailed(true);
              }
            }}
          />
        ) : (
          /* High-precision vector emblem representing Universal Human Values (Understanding, Harmony, Co-Existence) */
          <svg viewBox="0 0 200 200" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Circular Rim */}
            <circle cx="100" cy="100" r="97" fill="#ffffff" stroke="#0a2540" strokeWidth="2.5" />
            <circle cx="100" cy="100" r="94" fill="none" stroke="#0a2540" strokeWidth="0.8" />

            {/* Arched Text Path for 'UNIVERSAL HUMAN VALUES' */}
            <defs>
              <path
                id="uhv-arc-path"
                d="M 28 100 A 72 72 0 0 1 172 100"
                fill="none"
              />
            </defs>

            <text fill="#0a2540" fontSize="12.8" fontWeight="900" letterSpacing="2.2" fontFamily="system-ui, -apple-system, sans-serif">
              <textPath href="#uhv-arc-path" startOffset="50%" textAnchor="middle">
                UNIVERSAL HUMAN VALUES
              </textPath>
            </text>

            {/* Celestial / Atomic Planetary System */}
            <g id="atomic-system" transform="translate(100, 68)">
              {/* Elliptical Orbits */}
              <ellipse cx="0" cy="0" rx="42" ry="12" fill="none" stroke="#0a2540" strokeWidth="2.5" transform="rotate(-28)" />
              <ellipse cx="0" cy="0" rx="42" ry="12" fill="none" stroke="#0a2540" strokeWidth="2.5" transform="rotate(28)" />
              <ellipse cx="0" cy="0" rx="38" ry="9" fill="none" stroke="#0a2540" strokeWidth="2" transform="rotate(2)" />

              {/* Central Planet Sphere */}
              <circle cx="0" cy="0" r="17" fill="#0a2540" />

              {/* Orbiting Satellites / Electrons */}
              <circle cx="-32" cy="-14" r="3.5" fill="#0a2540" />
              <circle cx="34" cy="-12" r="3.5" fill="#0a2540" />
              <circle cx="26" cy="15" r="3" fill="#0a2540" />
              <circle cx="-24" cy="13" r="2.8" fill="#0a2540" />

              {/* Stars / Celestial Constellation Dots */}
              <circle cx="-35" cy="-28" r="2" fill="#0a2540" />
              <circle cx="28" cy="-30" r="2.2" fill="#0a2540" />
              <circle cx="0" cy="-34" r="1.8" fill="#0a2540" />
              <circle cx="-18" cy="-24" r="1.5" fill="#0a2540" />
              <circle cx="16" cy="-22" r="1.5" fill="#0a2540" />
            </g>

            {/* Thought Bubble Connection from Planetary System to Thinker */}
            <circle cx="94" cy="93" r="2" fill="#0a2540" />
            <circle cx="93" cy="99" r="2.8" fill="#0a2540" />
            <circle cx="92" cy="106" r="3.5" fill="#0a2540" />

            {/* Globe of Earth (Curved Latitude and Longitude Grid) */}
            <g id="globe-grid">
              <path d="M 45 152 Q 100 114 155 152" fill="none" stroke="#0a2540" strokeWidth="1.8" />
              <path d="M 52 144 Q 100 120 148 144" fill="none" stroke="#0a2540" strokeWidth="1.2" strokeDasharray="3 2" />
              <path d="M 100 118 L 100 162" fill="none" stroke="#0a2540" strokeWidth="1.2" />
              <path d="M 78 126 Q 74 142 68 158" fill="none" stroke="#0a2540" strokeWidth="1" />
              <path d="M 122 126 Q 126 142 132 158" fill="none" stroke="#0a2540" strokeWidth="1" />
            </g>

            {/* The Thinker Figure (Contemplation Silhouette) */}
            <g id="the-thinker" transform="translate(80, 96)">
              <circle cx="12" cy="12" r="6" fill="#0a2540" />
              <path d="M 12 18 Q 8 26 7 32 Q 14 34 16 28 L 14 18 Z" fill="#0a2540" />
              <path d="M 14 17 Q 26 22 28 34 Q 20 40 10 38 Q 6 30 14 17 Z" fill="#0a2540" />
              <path d="M 24 24 Q 18 36 6 36 L 5 32 Q 16 31 22 22 Z" fill="#0a2540" />
              <path d="M 7 36 Q 2 46 16 48 Q 28 48 30 42 Q 22 41 18 42 L 7 36 Z" fill="#0a2540" />
            </g>

            {/* Bottom Ribbon Banner */}
            <g id="bottom-ribbon">
              <path
                d="M 32 166 Q 100 144 168 166 L 164 178 Q 100 156 36 178 Z"
                fill="#0a2540"
              />
              <polygon points="32,166 22,171 36,178 30,172" fill="#06182a" />
              <polygon points="168,166 178,171 164,178 170,172" fill="#06182a" />
              <text
                x="100"
                y="166"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9.5"
                fontWeight="900"
                letterSpacing="1.2"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                EXISTENCE IS CO-EXISTENCE
              </text>
            </g>
          </svg>
        )}
      </div>

      {showSubtitle && (
        <div className="flex flex-col text-left">
          <span className="font-serif font-bold text-slate-900 tracking-wide text-sm sm:text-base">
            UHV CELL – NBKRIST
          </span>
          <span className="text-xs text-slate-600 font-sans tracking-tight">
            Universal Human Values Cell
          </span>
        </div>
      )}
    </div>
  );
};
