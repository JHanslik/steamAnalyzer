'use client';

import { GameRecommendation } from '@/types';

interface RecommendationsListProps {
  recommendations: GameRecommendation[];
}

export default function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Aucune recommandation disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Recommandations de jeux
      </h2>
      <div className="grid gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.appid}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {index + 1}. {rec.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {rec.reason}
                </p>
                <div className="mt-3">
                  <a
                    href={`https://store.steampowered.com/app/${rec.appid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Voir sur Steam →
                  </a>
                </div>
              </div>
              <div className="ml-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {Math.round(rec.matchScore * 100)}% match
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
