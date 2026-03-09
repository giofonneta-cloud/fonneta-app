'use client';

import { useState } from 'react';
import { useChannels } from '../../hooks';
import type { ChannelType } from '../../types';

interface CreateChannelModalProps {
  onClose: () => void;
}

export function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { createChannel } = useChannels();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createChannel(name.trim(), type);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear canal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gray-800 rounded-lg shadow-xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Crear canal</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Channel Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-2">
                Tipo de canal
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-gray-900 rounded-md cursor-pointer hover:bg-gray-850">
                  <input
                    type="radio"
                    name="type"
                    value="text"
                    checked={type === 'text'}
                    onChange={() => setType('text')}
                    className="text-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Texto</p>
                      <p className="text-xs text-gray-400">Envia mensajes, imagenes y GIFs</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-900 rounded-md cursor-pointer hover:bg-gray-850">
                  <input
                    type="radio"
                    name="type"
                    value="voice"
                    checked={type === 'voice'}
                    onChange={() => setType('voice')}
                    className="text-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">Voz</p>
                      <p className="text-xs text-gray-400">Habla con tu comunidad</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Channel Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-2">
                Nombre del canal
              </label>
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-md px-3">
                <span className="text-gray-500">#</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="nuevo-canal"
                  className="flex-1 py-2 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

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
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Crear canal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
