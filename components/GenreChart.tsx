'use client';

import dynamic from 'next/dynamic';

// Import dynamique pour éviter les problèmes SSR avec Plotly
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-gray-500">Chargement du graphique...</div>
    </div>
  )
});

interface GenreChartProps {
  genreDistribution: Record<string, number>;
}

export default function GenreChart({ genreDistribution }: GenreChartProps) {
  const genres = Object.entries(genreDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const data = [
    {
      labels: genres.map(([genre]) => genre),
      values: genres.map(([, playtime]) => playtime),
      type: 'pie',
      hole: 0.4
    }
  ];

  const layout = {
    title: 'Répartition par genre (temps de jeu)',
    height: 400
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <Plot data={data} layout={layout} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
