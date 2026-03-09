'use client';

import type { Server } from '../../types';

interface ServerIconProps {
  server: Server;
  isActive?: boolean;
  onClick?: () => void;
}

export function ServerIcon({ server, isActive = false, onClick }: ServerIconProps) {
  const initials = server.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`group relative w-12 h-12 flex items-center justify-center transition-all duration-200 ${
        isActive ? 'rounded-2xl' : 'rounded-3xl hover:rounded-2xl'
      }`}
    >
      {/* Indicator */}
      <div
        className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
          isActive ? 'h-10' : 'h-0 group-hover:h-5'
        }`}
        style={{ transform: 'translateX(-8px)' }}
      />

      {/* Icon */}
      {server.icon_url ? (
        <img
          src={server.icon_url}
          alt={server.name}
          className={`w-12 h-12 object-cover transition-all duration-200 ${
            isActive ? 'rounded-2xl' : 'rounded-3xl group-hover:rounded-2xl'
          }`}
        />
      ) : (
        <div
          className={`w-12 h-12 flex items-center justify-center text-white font-semibold transition-all duration-200 ${
            isActive
              ? 'bg-blue-600 rounded-2xl'
              : 'bg-gray-700 rounded-3xl group-hover:rounded-2xl group-hover:bg-blue-600'
          }`}
        >
          {initials}
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
        {server.name}
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
      </div>
    </button>
  );
}
