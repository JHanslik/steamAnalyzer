'use client';

import { useState } from 'react';
import { SteamGame, SteamPlayerData } from '@/types';

interface RawDataViewProps {
  playerData: SteamPlayerData;
}

export default function RawDataView({ playerData }: RawDataViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'playtime'>('playtime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedGames = [...playerData.games].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = (a.playtime_forever || 0) - (b.playtime_forever || 0);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const displayedGames = isExpanded ? sortedGames : sortedGames.slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Données brutes
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isExpanded ? 'Réduire' : 'Voir tout'}
        </button>
      </div>

      {/* Informations générales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">SteamID</p>
          <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
            {playerData.steamid}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total jeux</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {playerData.totalGames}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">Temps total</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(playerData.totalPlaytime / 60)}h
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">Ancienneté</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {playerData.accountAge ? `${playerData.accountAge} jours` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Options de tri */}
      <div className="flex items-center space-x-4 mb-4">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Trier par:
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'playtime')}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="playtime">Temps de jeu</option>
          <option value="name">Nom</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
        </button>
      </div>

      {/* Liste des jeux */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                Nom du jeu
              </th>
              <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                AppID
              </th>
              <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                Temps (min)
              </th>
              <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                Temps (heures)
              </th>
              <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedGames.map((game) => (
              <tr
                key={game.appid}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="py-2 px-3 text-gray-900 dark:text-white">
                  {game.name}
                </td>
                <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                  {game.appid}
                </td>
                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                  {game.playtime_forever || 0}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-gray-900 dark:text-white">
                  {Math.round((game.playtime_forever || 0) / 60 * 10) / 10}
                </td>
                <td className="py-2 px-3 text-center">
                  <a
                    href={`https://store.steampowered.com/app/${game.appid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                  >
                    Steam →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isExpanded && playerData.games.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Affichage de 10 sur {playerData.games.length} jeux. 
          <button
            onClick={() => setIsExpanded(true)}
            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Voir tout
          </button>
        </div>
      )}

      {/* Export JSON */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Voir les données JSON brutes
          </summary>
          <div className="mt-4 bg-gray-900 rounded p-4 overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono">
              {JSON.stringify(playerData, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}
