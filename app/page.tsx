"use client";

import { useState, useRef } from "react";
import SteamIdForm from "@/components/SteamIdForm";
import StatsCard from "@/components/StatsCard";
import PlaytimeChart from "@/components/PlaytimeChart";
import GenreChart from "@/components/GenreChart";
import RecommendationsList from "@/components/RecommendationsList";
import AnalysisConsole from "@/components/AnalysisConsole";
import RawDataView from "@/components/RawDataView";
import SuccessFactorsView from "@/components/SuccessFactorsView";
import GamePredictionsView from "@/components/GamePredictionsView";
import AdvancedStatsView from "@/components/AdvancedStatsView";
import { AnalysisResult } from "@/types";

interface LogEntry {
  message: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error";
}

// Messages de progression pour l'analyse
const ANALYSIS_STEPS = [
  { message: "Connexion à l'API Steam...", delay: 500 },
  { message: "Récupération des données du profil...", delay: 300 },
  { message: "Données récupérées avec succès", delay: 400, type: "success" as const },
  { message: "Préprocessing des données...", delay: 500 },
  { message: "Calcul des features quantitatives...", delay: 400 },
  { message: "Analyse des genres et styles de jeu...", delay: 500 },
  { message: "Calcul des statistiques descriptives...", delay: 400 },
  { message: "Classification du type de joueur...", delay: 500 },
  { message: "Clustering par style de jeu...", delay: 400 },
  { message: "Enrichissement des données des jeux...", delay: 600 },
  { message: "Analyse des facteurs de succès...", delay: 500 },
  { message: "Analyse du succès global des jeux (notes, joueurs, etc.)...", delay: 500 },
  { message: "Génération des recommandations...", delay: 500 },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const newLog: LogEntry = {
      message,
      timestamp: new Date(),
      type,
    };
    logsRef.current = [...logsRef.current, newLog];
    setLogs([...logsRef.current]);
  };

  const clearLogs = () => {
    logsRef.current = [];
    setLogs([]);
  };

  const handleAnalyze = async (steamId: string) => {
    // Réinitialiser l'état
    setIsLoading(true);
    setError(null);
    setResults(null);
    clearLogs();

    try {
      // Afficher les messages de progression
      for (const step of ANALYSIS_STEPS) {
        addLog(step.message, step.type || "info");
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      // Appel API
      const response = await fetch("/api/steam/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Erreur lors de l'analyse";
        addLog(`Erreur: ${errorMessage}`, "error");
        throw new Error(errorMessage);
      }

      const data = await response.json();
      addLog("Analyse terminée avec succès !", "success");
      await new Promise((resolve) => setTimeout(resolve, 300));

      setResults(data);

      // Effacer les logs après succès
      setTimeout(clearLogs, 1000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper pour obtenir le style du statut Groq
  const getGroqStatusStyle = (status: string) => {
    const styles = {
      cached: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
      rate_limited: "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800",
      available: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
      unavailable: "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
    };
    return styles[status as keyof typeof styles] || styles.unavailable;
  };

  // Helper pour obtenir le message du statut Groq
  const getGroqStatusMessage = (status: string) => {
    const messages = {
      cached: { icon: "📦", text: "Analyse IA depuis le cache (données mises en cache il y a moins de 24h)", color: "text-blue-700 dark:text-blue-300" },
      rate_limited: { icon: "⚠️", text: "Quota Groq atteint - Analyse basique utilisée (statistiques et recommandations toujours disponibles)", color: "text-yellow-700 dark:text-yellow-300" },
      available: { icon: "✅", text: "Analyse IA complète disponible", color: "text-green-700 dark:text-green-300" },
      unavailable: { icon: "ℹ️", text: "Analyse basique utilisée (clé Groq non configurée ou indisponible)", color: "text-gray-700 dark:text-gray-300" },
    };
    return messages[status as keyof typeof messages] || messages.unavailable;
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Steam Player Analyzer</h1>
          <p className="text-gray-600 dark:text-gray-400">Analysez votre profil Steam et recevez des recommandations personnalisées</p>
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

        {/* Message de statut Groq */}
        {results && (results as any).groqStatus && (() => {
          const status = (results as any).groqStatus;
          const statusMessage = getGroqStatusMessage(status);
          return (
            <div className={`mb-4 p-4 rounded-lg ${getGroqStatusStyle(status)}`}>
              <p className="text-sm font-medium">
                {statusMessage.icon} <span className={statusMessage.color}>{statusMessage.text}</span>
              </p>
            </div>
          );
        })()}

        {/* Résultats */}
        {results && (
          <div className="space-y-8">
            {/* ============================================ */}
            {/* SECTION 1: VUE D'ENSEMBLE DU JOUEUR */}
            {/* ============================================ */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Vue d&apos;ensemble</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Profil et caractéristiques principales</p>
              </div>

              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Temps de jeu total"
                  value={`${Math.round(results.playerData.totalPlaytime / 60)}h`}
                  subtitle={`${results.playerData.totalGames} jeux`}
                />
                <StatsCard title="Temps moyen par jeu" value={`${Math.round(results.features.averagePlaytime / 60)}h`} subtitle="Moyenne" />
                <StatsCard
                  title="Type de joueur"
                  value={results.classification.type}
                  subtitle={
                    <div className="space-y-1">
                      <div>{Math.round(results.classification.probability * 100)}% de confiance</div>
                      {results.classification.usingGroq ? (
                        <div className="text-xs text-green-600 dark:text-green-400">🤖 Groq ({results.classification.model})</div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">⚙️ Logique basique</div>
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
                        <div className="text-xs text-green-600 dark:text-green-400">🤖 Groq ({results.clustering.model})</div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">⚙️ Logique basique</div>
                      )}
                    </div>
                  }
                />
              </div>

              {/* Caractéristiques du profil */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Caractéristiques de votre profil</h3>
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
                      Caractéristiques: <strong>{results.clustering.characteristics.join(", ")}</strong>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 2: ANALYSE DES DONNÉES */}
            {/* ============================================ */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analyse des données</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Visualisations et statistiques détaillées</p>
              </div>

              {/* Graphiques */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlaytimeChart games={results.playerData.games} />
                <GenreChart genreDistribution={results.features.genreDistribution} />
              </div>

              {/* Statistiques descriptives de base */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Statistiques descriptives de base</h3>
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

              {/* Statistiques avancées */}
              {results.advancedStats && (
                <AdvancedStatsView advancedStats={results.advancedStats} />
              )}
            </div>

            {/* ============================================ */}
            {/* SECTION 3: INSIGHTS IA */}
            {/* ============================================ */}
            {(results.successFactors || (results.gamePredictions && results.gamePredictions.length > 0)) && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Insights IA</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Analyse approfondie des facteurs de succès et prédictions</p>
                </div>

                {/* Facteurs de succès */}
                {results.successFactors && (
                  <SuccessFactorsView successFactors={results.successFactors} />
                )}

                {/* Prédictions des jeux */}
                {results.gamePredictions && results.gamePredictions.length > 0 && (
                  <GamePredictionsView predictions={results.gamePredictions} />
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* SECTION 4: RECOMMANDATIONS */}
            {/* ============================================ */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Recommandations</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Jeux personnalisés basés sur votre profil</p>
              </div>

              <RecommendationsList recommendations={results.recommendations} />
            </div>

            {/* ============================================ */}
            {/* SECTION 5: DONNÉES DÉTAILLÉES */}
            {/* ============================================ */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Données détaillées</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Accès aux données brutes pour analyse approfondie</p>
              </div>

              <RawDataView playerData={results.playerData} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
