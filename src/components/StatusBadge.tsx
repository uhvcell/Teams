import React from 'react';
import { MemberStatus } from '../types';

interface StatusBadgeProps {
  status: MemberStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isActive = status === 'Active';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizeClasses[size]} ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-rose-50 text-rose-700 border-rose-300'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}
      />
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
};
