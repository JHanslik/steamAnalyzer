'use client';

import { useState } from 'react';

interface SteamIdFormProps {
  onAnalyze: (steamId: string) => void;
  isLoading: boolean;
}

export default function SteamIdForm({ onAnalyze, isLoading }: SteamIdFormProps) {
  const [steamId, setSteamId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (steamId.trim()) {
      onAnalyze(steamId.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="steamId" className="block text-sm font-medium mb-2">
            SteamID (ID64)
          </label>
          <input
            type="text"
            id="steamId"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="Ex: 76561198000000000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <p className="mt-2 text-sm text-gray-600">
            Vous pouvez trouver votre SteamID sur{' '}
            <a
              href="https://steamid.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              steamid.io
            </a>
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading || !steamId.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Analyse en cours...' : 'Analyser mon profil'}
        </button>
      </form>
    </div>
  );
}
