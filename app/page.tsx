'use client';

import { useState, useEffect, useRef } from 'react';
import SteamIdForm from '@/components/SteamIdForm';
import StatsCard from '@/components/StatsCard';
import PlaytimeChart from '@/components/PlaytimeChart';
import GenreChart from '@/components/GenreChart';
import RecommendationsList from '@/components/RecommendationsList';
import AnalysisConsole from '@/components/AnalysisConsole';
import RawDataView from '@/components/RawDataView';
import { AnalysisResult } from '@/types';

interface LogEntry {
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      message,
      timestamp: new Date(),
      type
    };
    logsRef.current = [...logsRef.current, newLog];
    setLogs([...logsRef.current]);
  };

  const handleAnalyze = async (steamId: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    logsRef.current = [];
    setLogs([]);

    try {
      // Étape 1: Connexion à l'API Steam
      addLog('Connexion à l\'API Steam...', 'info');
      await new Promise(resolve => setTimeout(resolve, 500));

      addLog('Récupération des données du profil...', 'info');
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch('/api/steam/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ steamId }),
      });

      if (!response.ok) {
        const data = await response.json();
        addLog(`Erreur: ${data.error || 'Erreur lors de l\'analyse'}`, 'error');
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      // Simuler les étapes pendant le chargement
      addLog('Données récupérées avec succès', 'success');
      await new Promise(resolve => setTimeout(resolve, 400));

      addLog('Préprocessing des données...', 'info');
      await new Promise(resolve => setTimeout(resolve, 500));

      addLog('Calcul des features quantitatives...', 'info');
      await new Promise(resolve => setTimeout(resolve, 400));

      addLog('Analyse des genres et styles de jeu...', 'info');
      await new Promise(resolve => setTimeout(resolve, 500));

      addLog('Calcul des statistiques descriptives...', 'info');
      await new Promise(resolve => setTimeout(resolve, 400));

      addLog('Classification du type de joueur...', 'info');
      await new Promise(resolve => setTimeout(resolve, 500));

      addLog('Clustering par style de jeu...', 'info');
      await new Promise(resolve => setTimeout(resolve, 400));

      addLog('Génération des recommandations...', 'info');
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = await response.json();
      
      addLog('Analyse terminée avec succès !', 'success');
      await new Promise(resolve => setTimeout(resolve, 300));

      setResults(data);
      
      // Effacer les logs après un court délai en cas de succès
      setTimeout(() => {
        setLogs([]);
        logsRef.current = [];
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      // Garder les logs en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Steam Player Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analysez votre profil Steam et recevez des recommandations personnalisées
          </p>
        </div>

        {/* Formulaire */}
        <div className="mb-8">
          <SteamIdForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Console d'analyse */}
        {isLoading && <AnalysisConsole logs={logs} />}

        {/* Erreur */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            <p>{error}</p>
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div className="space-y-8">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Temps de jeu total"
                value={`${Math.round(results.playerData.totalPlaytime / 60)}h`}
                subtitle={`${results.playerData.totalGames} jeux`}
              />
              <StatsCard
                title="Temps moyen par jeu"
                value={`${Math.round(results.features.averagePlaytime / 60)}h`}
                subtitle="Moyenne"
              />
              <StatsCard
                title="Type de joueur"
                value={results.classification.type}
                subtitle={
                  <div className="space-y-1">
                    <div>{Math.round(results.classification.probability * 100)}% de confiance</div>
                    {results.classification.usingGroq ? (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        🤖 Groq ({results.classification.model})
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ⚙️ Logique basique
                      </div>
                    )}
                  </div>
                }
              />
              <StatsCard
                title="Cluster"
                value={results.clustering.clusterLabel}
                subtitle={
                  <div className="space-y-1">
                    <div>Cluster #{results.clustering.cluster}</div>
                    {results.clustering.usingGroq ? (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        🤖 Groq ({results.clustering.model})
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ⚙️ Logique basique
                      </div>
                    )}
                  </div>
                }
              />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlaytimeChart games={results.playerData.games} />
              <GenreChart genreDistribution={results.features.genreDistribution} />
            </div>

            {/* Statistiques détaillées */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Statistiques détaillées
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne</p>
                  <p className="text-lg font-semibold">{Math.round(results.stats.mean / 60)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Médiane</p>
                  <p className="text-lg font-semibold">{Math.round(results.stats.median / 60)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Minimum</p>
                  <p className="text-lg font-semibold">{Math.round(results.stats.min / 60)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Maximum</p>
                  <p className="text-lg font-semibold">{Math.round(results.stats.max / 60)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Écart-type</p>
                  <p className="text-lg font-semibold">{Math.round(results.stats.std / 60)}h</p>
                </div>
              </div>
            </div>

            {/* Caractéristiques du cluster */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Caractéristiques de votre profil
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li className="text-gray-700 dark:text-gray-300">
                  Genre dominant: <strong>{results.features.dominantGenre}</strong>
                </li>
                <li className="text-gray-700 dark:text-gray-300">
                  Style de jeu: <strong>{results.features.gameStyle}</strong>
                </li>
                <li className="text-gray-700 dark:text-gray-300">
                  Ancienneté du compte: <strong>{results.features.accountAge} jours</strong>
                </li>
                {results.clustering.characteristics.length > 0 && (
                  <li className="text-gray-700 dark:text-gray-300">
                    Caractéristiques: <strong>{results.clustering.characteristics.join(', ')}</strong>
                  </li>
                )}
              </ul>
            </div>

            {/* Recommandations */}
            <RecommendationsList recommendations={results.recommendations} />

            {/* Données brutes */}
            <RawDataView playerData={results.playerData} />
          </div>
        )}
      </div>
    </main>
  );
}
