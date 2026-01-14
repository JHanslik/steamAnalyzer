'use client';

import { GamePrediction } from '@/types';

interface GamePredictionsViewProps {
  predictions: GamePrediction[];
}

export default function GamePredictionsView({ predictions }: GamePredictionsViewProps) {
  const successfulGames = predictions.filter(p => p.willSucceed);
  const failedGames = predictions.filter(p => !p.willSucceed);

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600 dark:text-green-400';
    if (probability >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProbabilityBg = (probability: number) => {
    if (probability >= 0.7) return 'bg-green-100 dark:bg-green-900/30';
    if (probability >= 0.4) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Prédictions de Succès des Jeux
      </h2>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Jeux qui fonctionnent</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {successfulGames.length}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Jeux qui ne fonctionnent pas</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {failedGames.length}
          </p>
        </div>
      </div>

      {/* Liste des prédictions */}
      <div className="space-y-3">
        {predictions
          .sort((a, b) => b.probability - a.probability)
          .map((prediction, index) => (
            <div
              key={prediction.appid}
              className={`border rounded-lg p-4 ${getProbabilityBg(prediction.probability)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {prediction.gameName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {prediction.explanation}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <div className={`text-2xl font-bold ${getProbabilityColor(prediction.probability)}`}>
                    {Math.round(prediction.probability * 100)}%
                  </div>
                  <div className={`text-xs font-medium mt-1 ${
                    prediction.willSucceed 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {prediction.willSucceed ? '✓ Fonctionne' : '✗ Ne fonctionne pas'}
                  </div>
                  {prediction.usingGroq && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Groq
                    </div>
                  )}
                </div>
              </div>

              {/* Facteurs clés pour cette prédiction */}
              {prediction.factors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Facteurs clés:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prediction.factors.slice(0, 3).map((factor, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
                      >
                        {factor.name} ({Math.round(factor.importance * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
