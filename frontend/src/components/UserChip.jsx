import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const getInitials = (name, email) => {
  const source = name || email || '';
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 && email) {
    return email.charAt(0).toUpperCase();
  }
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const UserChip = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || !user) return null;

  const displayName = user.name || (user.email ? user.email.split('@')[0] : 'User');
  const initials = getInitials(user.name, user.email);
  // Shared neutral silhouette avatar for all users (keeps UX consistent)
  const placeholderAvatar =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" fill="url(#g)"/>
        <circle cx="32" cy="26" r="12" fill="white" fill-opacity="0.95"/>
        <path d="M16 56c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="white" fill-opacity="0.95"/>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0ea5e9"/>
            <stop offset="1" stop-color="#2563eb"/>
          </linearGradient>
        </defs>
      </svg>`
    );

  return (
    <div className="flex items-center gap-3 bg-slate-800/70 border border-slate-700/70 px-3 py-2 rounded-full shadow-lg shadow-cyan-500/10 backdrop-blur-md">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold overflow-hidden">
        <img src={placeholderAvatar} alt={displayName} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-sm font-semibold text-white truncate max-w-[140px]">{displayName}</span>
        {user.email && <span className="text-xs text-slate-400 truncate max-w-[140px]">{user.email}</span>}
      </div>
      <button
        onClick={logout}
        className="flex items-center gap-1 text-xs font-semibold text-white px-2 py-1 rounded-md bg-slate-700/80 hover:bg-slate-600/80 border border-slate-600/70 transition"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
};

export default UserChip;
