'use client';

import { useState } from 'react';
import { useServers } from '../../hooks';

interface JoinServerModalProps {
  onClose: () => void;
}

export function JoinServerModal({ onClose }: JoinServerModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { joinServer } = useServers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setError('El codigo de invitacion es requerido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await joinServer(inviteCode.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Codigo de invitacion invalido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-800 rounded-lg shadow-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Unirse a un servidor</h2>
          <p className="text-gray-400 mb-6">
            Ingresa el codigo de invitacion para unirte a un servidor existente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-2">
                Codigo de invitacion
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123XY"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 uppercase tracking-widest text-center font-mono text-lg"
                autoFocus
                maxLength={8}
              />
              <p className="text-xs text-gray-500 mt-2">
                Los codigos de invitacion tienen 8 caracteres
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || inviteCode.length < 8}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Uniendo...' : 'Unirse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
