'use client';

import { AdvancedStats } from '@/types';

interface AdvancedStatsViewProps {
  advancedStats: AdvancedStats;
}

export default function AdvancedStatsView({ advancedStats }: AdvancedStatsViewProps) {
  const formatNumber = (n: number, decimals: number = 2) => {
    return n.toFixed(decimals);
  };

  const formatPercent = (n: number) => {
    return `${Math.round(n * 100)}%`;
  };

  const getCorrelationColor = (r: number | undefined) => {
    if (r === undefined) return 'text-gray-500';
    const absR = Math.abs(r);
    if (absR < 0.3) return 'text-gray-400';
    if (absR < 0.5) return 'text-yellow-500';
    if (absR < 0.7) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCorrelationLabel = (r: number | undefined) => {
    if (r === undefined) return 'N/A';
    const absR = Math.abs(r);
    if (absR < 0.1) return 'Négligeable';
    if (absR < 0.3) return 'Faible';
    if (absR < 0.5) return 'Modérée';
    if (absR < 0.7) return 'Forte';
    return 'Très forte';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        📊 Statistiques Avancées (Équivalent R)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 italic">
        Ces statistiques sont calculées manuellement en JavaScript, équivalentes aux fonctions R (quantile, sd, skewness, kurtosis, cor).
      </p>

      {/* Quartiles */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Quartiles (Q1, Q2, Q3) et IQR
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Q1 (25%)</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(advancedStats.quartiles.q1)}h
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Q2 / Médiane (50%)</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatNumber(advancedStats.quartiles.q2)}h
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Q3 (75%)</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {formatNumber(advancedStats.quartiles.q3)}h
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">IQR (Q3-Q1)</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatNumber(advancedStats.quartiles.iqr)}h
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
          {advancedStats.explanations.quartiles}
        </p>
      </div>

      {/* Coefficient de Variation */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Coefficient de Variation (CV)
        </h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatPercent(advancedStats.coefficientOfVariation)}
            </p>
          </div>
          <div className="flex-1">
            {advancedStats.coefficientOfVariation < 0.15 && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                Dispersion faible
              </span>
            )}
            {advancedStats.coefficientOfVariation >= 0.15 && advancedStats.coefficientOfVariation <= 0.35 && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                Dispersion modérée
              </span>
            )}
            {advancedStats.coefficientOfVariation > 0.35 && (
              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                Dispersion forte
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
          {advancedStats.explanations.coefficientOfVariation}
        </p>
      </div>

      {/* Skewness et Kurtosis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Skewness (Asymétrie)
          </h3>
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded mb-3">
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {formatNumber(advancedStats.skewness)}
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
            {advancedStats.explanations.skewness}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Kurtosis (Aplatissement)
          </h3>
          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded mb-3">
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {formatNumber(advancedStats.kurtosis)}
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
            {advancedStats.explanations.kurtosis}
          </p>
        </div>
      </div>

      {/* Corrélations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Corrélations de Pearson
        </h3>
        <div className="space-y-3 mb-3">
          {advancedStats.correlations.playtimeVsPrice !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-gray-700 dark:text-gray-300">Temps de jeu ↔ Prix</span>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${getCorrelationColor(advancedStats.correlations.playtimeVsPrice)}`}>
                  {formatNumber(advancedStats.correlations.playtimeVsPrice)}
                </span>
                <span className="text-xs text-gray-500">
                  ({getCorrelationLabel(advancedStats.correlations.playtimeVsPrice)})
                </span>
              </div>
            </div>
          )}
          {advancedStats.correlations.playtimeVsRating !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-gray-700 dark:text-gray-300">Temps de jeu ↔ Notes</span>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${getCorrelationColor(advancedStats.correlations.playtimeVsRating)}`}>
                  {formatNumber(advancedStats.correlations.playtimeVsRating)}
                </span>
                <span className="text-xs text-gray-500">
                  ({getCorrelationLabel(advancedStats.correlations.playtimeVsRating)})
                </span>
              </div>
            </div>
          )}
          {advancedStats.correlations.priceVsRating !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-gray-700 dark:text-gray-300">Prix ↔ Notes</span>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${getCorrelationColor(advancedStats.correlations.priceVsRating)}`}>
                  {formatNumber(advancedStats.correlations.priceVsRating)}
                </span>
                <span className="text-xs text-gray-500">
                  ({getCorrelationLabel(advancedStats.correlations.priceVsRating)})
                </span>
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded whitespace-pre-line">
          {advancedStats.explanations.correlations}
        </p>
      </div>
    </div>
  );
}
