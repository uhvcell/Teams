import React, { useState, useEffect } from 'react';
import { GraduationCap, ImageOff, Loader2 } from 'lucide-react';

export type PhotoLoadStatus = 'loading' | 'available' | 'missing' | 'error';

interface MemberPhotoProps {
  photoUrl?: string | null;
  name: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  shape?: 'rounded' | 'circle' | 'square';
  showStatusIndicator?: boolean;
  indicatorPosition?: 'top-right' | 'bottom-right';
  alt?: string;
  onStatusChange?: (status: PhotoLoadStatus) => void;
  iconOnlyPlaceholder?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-xs',
  md: 'w-16 h-16 text-base',
  lg: 'w-24 h-24 text-xl',
  xl: 'w-28 h-28 sm:w-32 sm:h-32 text-2xl',
  custom: '',
};

const SHAPE_CLASSES = {
  rounded: 'rounded-xl sm:rounded-2xl',
  circle: 'rounded-full',
  square: 'rounded-none',
};

export const MemberPhoto: React.FC<MemberPhotoProps> = ({
  photoUrl,
  name,
  className = '',
  size = 'md',
  shape = 'rounded',
  showStatusIndicator = false,
  indicatorPosition = 'bottom-right',
  alt,
  onStatusChange,
  iconOnlyPlaceholder = false,
}) => {
  const [loadStatus, setLoadStatus] = useState<PhotoLoadStatus>(() => {
    if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.trim()) {
      return 'missing';
    }
    return 'loading';
  });

  const cleanUrl = typeof photoUrl === 'string' ? photoUrl.trim() : '';

  useEffect(() => {
    if (!cleanUrl) {
      setLoadStatus('missing');
      onStatusChange?.('missing');
      return;
    }

    // Validate data URL or http url
    const isDataUrl = cleanUrl.startsWith('data:image/');
    const isHttp = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');

    if (!isDataUrl && !isHttp) {
      setLoadStatus('error');
      onStatusChange?.('error');
      return;
    }

    // Reset to loading when URL changes
    setLoadStatus('loading');

    // Pre-test image to guarantee load status
    let active = true;
    const img = new Image();
    img.src = cleanUrl;

    img.onload = () => {
      if (active) {
        setLoadStatus('available');
        onStatusChange?.('available');
      }
    };

    img.onerror = () => {
      if (active) {
        setLoadStatus('error');
        onStatusChange?.('error');
      }
    };

    return () => {
      active = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [cleanUrl, onStatusChange]);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    : 'U';

  const sizeClass = SIZE_CLASSES[size] || '';
  const shapeClass = SHAPE_CLASSES[shape] || SHAPE_CLASSES.rounded;

  return (
    <div
      className={`relative inline-block overflow-hidden shrink-0 select-none bg-slate-100 border border-slate-200 shadow-2xs ${sizeClass} ${shapeClass} ${className}`}
    >
      {loadStatus === 'available' && cleanUrl ? (
        <img
          src={cleanUrl}
          alt={alt || name}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={() => {
            setLoadStatus('error');
            onStatusChange?.('error');
          }}
        />
      ) : loadStatus === 'loading' ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400 mb-0.5" />
          {size === 'xl' && (
            <span className="text-[10px] text-slate-400 font-medium">Loading...</span>
          )}
        </div>
      ) : loadStatus === 'error' ? (
        // Clean default UHV CELL placeholder when image failed to load (NO browser broken icon!)
        <div
          title={`Photo failed to load for ${name}. Showing official UHV Cell placeholder.`}
          className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-rose-50/40 to-slate-200 text-slate-500 p-1"
        >
          {iconOnlyPlaceholder ? (
            <ImageOff className="w-1/2 h-1/2 text-rose-400" />
          ) : size === 'xl' || size === 'lg' ? (
            <>
              <GraduationCap className="w-8 h-8 text-slate-400 mb-0.5" />
              <span className="text-xs font-bold text-slate-700 tracking-wider">
                {initials}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                UHV Cell
              </span>
            </>
          ) : (
            <span className="font-bold text-slate-600">
              {initials}
            </span>
          )}
        </div>
      ) : (
        // Clean default UHV CELL placeholder when no photo was uploaded
        <div
          title={`Official UHV Cell profile for ${name}`}
          className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2942]/5 via-slate-100 to-amber-500/10 text-slate-600 p-1"
        >
          {size === 'xl' ? (
            <>
              <GraduationCap className="w-10 h-10 text-[#0f2942]/60 mb-1" />
              <span className="text-sm font-bold text-[#0f2942]">
                {initials}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                UHV Member
              </span>
            </>
          ) : size === 'lg' ? (
            <>
              <GraduationCap className="w-6 h-6 text-[#0f2942]/60 mb-0.5" />
              <span className="text-xs font-bold text-[#0f2942]">
                {initials}
              </span>
            </>
          ) : (
            <span className="font-bold text-[#0f2942]">
              {initials}
            </span>
          )}
        </div>
      )}

      {/* Admin Status Indicator Dot if enabled */}
      {showStatusIndicator && (
        <span
          title={
            loadStatus === 'available'
              ? 'Photo Available & Verified'
              : loadStatus === 'loading'
              ? 'Loading Photo...'
              : loadStatus === 'error'
              ? 'Photo Failed to Load (Broken Reference)'
              : 'Photo Missing / Not Uploaded'
          }
          className={`absolute ${
            indicatorPosition === 'top-right' ? 'top-1 right-1' : 'bottom-1 right-1'
          } w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
            loadStatus === 'available'
              ? 'bg-emerald-500 ring-1 ring-emerald-600/30'
              : loadStatus === 'loading'
              ? 'bg-amber-400 animate-ping'
              : loadStatus === 'error'
              ? 'bg-rose-500 ring-1 ring-rose-600/30'
              : 'bg-slate-300 ring-1 ring-slate-400/30'
          }`}
        />
      )}
    </div>
  );
};
