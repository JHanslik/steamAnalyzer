'use client';

import dynamic from 'next/dynamic';
import { SteamGame } from '@/types';

// Import dynamique pour éviter les problèmes SSR avec Plotly
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-gray-500">Chargement du graphique...</div>
    </div>
  )
});

interface PlaytimeChartProps {
  games: SteamGame[];
}

export default function PlaytimeChart({ games }: PlaytimeChartProps) {
  // Prendre les 20 jeux les plus joués
  const topGames = [...games]
    .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
    .slice(0, 20);

  const data = [
    {
      x: topGames.map(g => g.name),
      y: topGames.map(g => (g.playtime_forever || 0) / 60), // Convertir en heures
      type: 'bar',
      marker: {
        color: 'rgb(59, 130, 246)'
      }
    }
  ];

  const layout = {
    title: 'Temps de jeu par jeu (top 20)',
    xaxis: {
      title: 'Jeux',
      tickangle: -45
    },
    yaxis: {
      title: 'Heures de jeu'
    },
    height: 500,
    margin: { b: 150 }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <Plot data={data} layout={layout} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
