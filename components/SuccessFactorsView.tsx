'use client';

import { SuccessFactorsAnalysis } from '@/types';

interface SuccessFactorsViewProps {
  successFactors: SuccessFactorsAnalysis;
}

export default function SuccessFactorsView({ successFactors }: SuccessFactorsViewProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return '↑';
      case 'negative':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Facteurs de Succès des Jeux
        </h2>
        {successFactors.usingGroq && (
          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
            🤖 Groq ({successFactors.model})
          </span>
        )}
      </div>

      {successFactors.summary && (
        <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
          {successFactors.summary}
        </p>
      )}

      <div className="space-y-4">
        {successFactors.topFactors.map((factor, index) => (
          <div
            key={index}
            className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-r"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {index + 1}. {factor.name}
                </span>
                <span className={`text-sm font-medium ${getImpactColor(factor.impact)}`}>
                  {getImpactIcon(factor.impact)}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(factor.importance * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {factor.description}
            </p>
            {/* Barre de progression pour l'importance */}
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${factor.importance * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
