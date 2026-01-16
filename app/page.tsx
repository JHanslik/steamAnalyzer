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
      rate_limited: {
        icon: "⚠️",
        text: "Quota Groq atteint - Analyse basique utilisée (statistiques et recommandations toujours disponibles)",
        color: "text-yellow-700 dark:text-yellow-300",
      },
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

        {/* Section Présentation */}
        {!results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Présentation du Projet</h2>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              {/* Objectif */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🎯 Objectif</h3>
                <p>
                  Ce projet démontre un <strong>pipeline complet de Data Science</strong> implémenté entièrement en JavaScript (Next.js), équivalent aux
                  analyses statistiques réalisées en R. L&apos;application analyse les profils Steam pour identifier les comportements de jeu, calculer des
                  statistiques avancées, et générer des recommandations personnalisées.
                </p>
              </div>

              {/* Architecture */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🏗️ Architecture du Projet</h3>
                <p className="mb-2">
                  Le projet suit une <strong>architecture modulaire en services</strong> :
                </p>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded text-sm font-mono">
                  <div className="mb-2">
                    <strong>Frontend (Next.js App Router)</strong>
                  </div>
                  <div className="ml-4 mb-2">
                    ├─ <code>app/page.tsx</code> - Page principale avec formulaire et affichage
                  </div>
                  <div className="ml-4 mb-2">
                    └─ <code>components/</code> - Composants React réutilisables
                  </div>

                  <div className="mb-2 mt-4">
                    <strong>Backend (API Routes)</strong>
                  </div>
                  <div className="ml-4 mb-2">
                    └─ <code>app/api/steam/analyze/route.ts</code> - Endpoint principal d&apos;analyse
                  </div>

                  <div className="mb-2 mt-4">
                    <strong>Services (lib/services/)</strong>
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>steamService.ts</code> - Communication avec Steam Web API
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>preprocessingService.ts</code> - Nettoyage et transformation des données
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>analysisService.ts</code> - Statistiques descriptives de base
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>advancedStatsService.ts</code> - Statistiques avancées (quartiles, skewness, etc.)
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>gameEnrichmentService.ts</code> - Enrichissement avec données Steam Store
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>groqUnifiedService.ts</code> - Analyse IA unifiée (Groq LLM)
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>mlService.ts</code> - Fallback ML basique
                  </div>
                  <div className="ml-4 mb-1">
                    ├─ <code>recommendationService.ts</code> - Génération de recommandations
                  </div>
                  <div className="ml-4 mb-1">
                    └─ <code>cacheService.ts</code> - Cache en mémoire (TTL 24h)
                  </div>
                </div>
              </div>

              {/* Pipeline de traitement */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">⚙️ Pipeline de Traitement des Données</h3>
                <p className="mb-2">
                  Le traitement suit un <strong>pipeline séquentiel en 5 étapes</strong> :
                </p>
                <ol className="list-decimal list-inside space-y-3 ml-4">
                  <li>
                    <strong>Collecte</strong> : Récupération des données Steam via API
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-2 text-sm font-mono">
                      <div>
                        API: <code>IPlayerService/GetOwnedGames</code>
                      </div>
                      <div className="mt-1">Exemple: 150 jeux récupérés, temps total = 45,000 minutes</div>
                      <div className="mt-1">Filtrage: jeux avec playtime_forever &gt; 0 uniquement</div>
                    </div>
                  </li>
                  <li>
                    <strong>Enrichissement</strong> : Ajout de métadonnées pour les 20 jeux les plus joués
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-2 text-sm">
                      <div>Pour chaque jeu (top 20) :</div>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>
                          Prix via <code>appdetails</code> API
                        </li>
                        <li>
                          Notes positives/négatives via <code>appreviews</code> endpoint
                        </li>
                        <li>Genres et catégories</li>
                        <li>
                          Joueurs actuels via <code>GetNumberOfCurrentPlayers</code>
                        </li>
                      </ul>
                      <div className="mt-2 font-mono text-xs">Délai séquentiel: 200-300ms entre chaque appel pour éviter rate limits</div>
                    </div>
                  </li>
                  <li>
                    <strong>Préprocessing</strong> : Transformation des données brutes
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded mt-2 text-sm space-y-3">
                      {/* Features quantitatives */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                          <strong className="text-gray-900 dark:text-white">Features quantitatives</strong>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-blue-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} preprocessingService.ts - computeFeatures() {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">totalGames</span> = <span className="text-blue-300">games</span>.<span className="text-yellow-300">length</span>;
                          </div>
                          <div>
                            <span className="text-purple-400">const</span> <span className="text-blue-300">averagePlaytime</span> = <span className="text-blue-300">totalGames</span> &gt; <span className="text-orange-400">0</span> 
                          </div>
                          <div className="ml-4">
                            ? <span className="text-blue-300">totalPlaytime</span> / <span className="text-blue-300">totalGames</span>
                          </div>
                          <div className="ml-4">
                            : <span className="text-orange-400">0</span>;
                          </div>
                          <div className="mt-3 text-gray-500">{'/*'} Calcul F2P basé sur prix réel (gratuit = prix === 0) {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">if</span> (<span className="text-blue-300">enrichedGames</span> &amp;&amp; <span className="text-blue-300">enrichedGames</span>.<span className="text-yellow-300">length</span> &gt; <span className="text-orange-400">0</span>) {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">freeToPlayCount</span> = <span className="text-blue-300">enrichedGames</span>.<span className="text-yellow-300">filter</span>(<span className="text-blue-300">g</span> =&gt; 
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">g</span>.<span className="text-blue-300">price</span>?.<span className="text-yellow-300">final</span> === <span className="text-orange-400">0</span>
                          </div>
                          <div className="ml-4">
                            ).<span className="text-yellow-300">length</span>;
                          </div>
                          <div>{'}'}</div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-6">
                          Résultat: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">totalPlaytime=45000</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">averagePlaytime=300</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">freeToPlayRatio=0.2</code>
                        </div>
                      </div>

                      {/* Distribution genres */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                          <strong className="text-gray-900 dark:text-white">Distribution des genres</strong>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-green-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} Accumulation par genre avec temps de jeu {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-blue-300">genres</span>.<span className="text-yellow-300">forEach</span>(<span className="text-blue-300">genre</span> =&gt; {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">if</span> (!<span className="text-blue-300">genreDistribution</span>[<span className="text-blue-300">genre</span>]) {'{'}
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">genreDistribution</span>[<span className="text-blue-300">genre</span>] = <span className="text-orange-400">0</span>;
                          </div>
                          <div className="ml-4">{'}'}</div>
                          <div className="ml-4">
                            <span className="text-blue-300">genreDistribution</span>[<span className="text-blue-300">genre</span>] += <span className="text-blue-300">playtime</span>;
                          </div>
                          <div>{'});'}</div>
                          <div className="mt-3 text-gray-500">{'/*'} Résultat (minutes cumulées par genre): {'*/'}</div>
                          <div className="mt-2 text-yellow-200">
                            {'{'}
                          </div>
                          <div className="ml-4 text-yellow-200">
                            <span className="text-green-400">&quot;Action&quot;</span>: <span className="text-orange-400">12000</span>,  <span className="text-gray-500">{'/*'} minutes {'*/'}</span>
                          </div>
                          <div className="ml-4 text-yellow-200">
                            <span className="text-green-400">&quot;RPG&quot;</span>: <span className="text-orange-400">18000</span>,
                          </div>
                          <div className="ml-4 text-yellow-200">
                            <span className="text-green-400">&quot;Strategy&quot;</span>: <span className="text-orange-400">5000</span>
                          </div>
                          <div className="text-yellow-200">{'}'}</div>
                        </div>
                      </div>

                      {/* Style de jeu */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                          <strong className="text-gray-900 dark:text-white">Détermination du style de jeu</strong>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-purple-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} preprocessingService.ts - determineGameStyle() {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">shortGames</span> = <span className="text-blue-300">games</span>.<span className="text-yellow-300">filter</span>(<span className="text-blue-300">g</span> =&gt;
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">g</span>.<span className="text-yellow-300">playtime_forever</span> &lt; <span className="text-orange-400">20</span>
                          </div>
                          <div>
                            ).<span className="text-yellow-300">length</span>;
                          </div>
                          <div className="mt-2">
                            <span className="text-purple-400">if</span> (<span className="text-blue-300">shortGames</span> / <span className="text-blue-300">games</span>.<span className="text-yellow-300">length</span> &gt; <span className="text-orange-400">0.5</span>) {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">return</span> <span className="text-green-400">&apos;Explorateur&apos;</span>;
                          </div>
                          <div>{'}'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">if</span> (<span className="text-blue-300">avgPlaytimePerGame</span> &gt; <span className="text-orange-400">100</span>) {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">return</span> <span className="text-green-400">&apos;Investi&apos;</span>;
                          </div>
                          <div>{'}'}</div>
                        </div>
                      </div>

                      {/* Encodage */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                          <strong className="text-gray-900 dark:text-white">Encodage catégoriel → numérique</strong>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-yellow-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} encodeCategoricalFeatures() - Pour ML {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">genreMap</span> = {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-green-400">&apos;Action&apos;</span>: <span className="text-orange-400">0</span>, <span className="text-green-400">&apos;RPG&apos;</span>: <span className="text-orange-400">2</span>, ...
                          </div>
                          <div>{'};'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">return</span> [
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">features</span>.<span className="text-yellow-300">totalPlaytime</span>,    <span className="text-gray-500">{'/*'} 45000 {'*/'}</span>
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">features</span>.<span className="text-yellow-300">averagePlaytime</span>,   <span className="text-gray-500">{'/*'} 300 {'*/'}</span>
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">features</span>.<span className="text-yellow-300">totalGames</span>,        <span className="text-gray-500">{'/*'} 150 {'*/'}</span>
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">features</span>.<span className="text-yellow-300">freeToPlayRatio</span>,  <span className="text-gray-500">{'/*'} 0.2 {'*/'}</span>
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">features</span>.<span className="text-yellow-300">accountAge</span>,        <span className="text-gray-500">{'/*'} 1825 {'*/'}</span>
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">genreEncoded</span>,              <span className="text-gray-500">{'/*'} 2 (RPG) {'*/'}</span>
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">styleEncoded</span>               <span className="text-gray-500">{'/*'} 1 (Investi) {'*/'}</span>
                          </div>
                          <div>];</div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-6">
                          Vecteur final: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono">[45000, 300, 150, 0.2, 1825, 2, 1]</code>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <strong>Analyse Statistique</strong> : Calculs statistiques avancés
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded mt-2 text-sm space-y-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Exemple avec données: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">[10, 20, 30, 50, 100, 200, 500, 1000]</code> heures
                      </div>

                      {/* Quartiles */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">Quartiles</span>
                          <span className="text-xs text-gray-500">Q1=25h, Q2=75h, Q3=375h, IQR=350h</span>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-blue-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} advancedStatsService.ts - calculateQuartiles() {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">sorted</span> = [...<span className="text-blue-300">values</span>].<span className="text-yellow-300">sort</span>((<span className="text-blue-300">a</span>, <span className="text-blue-300">b</span>) =&gt; <span className="text-blue-300">a</span> - <span className="text-blue-300">b</span>);
                          </div>
                          <div className="mt-1">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">q2</span> = <span className="text-yellow-300">calculateMedian</span>(<span className="text-blue-300">sorted</span>);  <span className="text-gray-500">{'/*'} Médiane (50%) {'*/'}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">lowerHalf</span> = <span className="text-blue-300">sorted</span>.<span className="text-yellow-300">slice</span>(<span className="text-orange-400">0</span>, <span className="text-yellow-300">Math.floor</span>(<span className="text-blue-300">n</span> / <span className="text-orange-400">2</span>));
                          </div>
                          <div className="mt-1">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">q1</span> = <span className="text-yellow-300">calculateMedian</span>(<span className="text-blue-300">lowerHalf</span>);  <span className="text-gray-500">{'/*'} Q1 (25%) {'*/'}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">iqr</span> = <span className="text-blue-300">q3</span> - <span className="text-blue-300">q1</span>;  <span className="text-gray-500">{'/*'} IQR {'*/'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skewness */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">Skewness</span>
                          <span className="text-xs text-gray-500">Formule: (n/(n-1)(n-2)) × Σ((x-μ)³)/σ³ → 1.2</span>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-pink-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} calculateSkewness() - Mesure l&apos;asymétrie {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">sumCubed</span> = <span className="text-blue-300">values</span>.<span className="text-yellow-300">reduce</span>((<span className="text-blue-300">sum</span>, <span className="text-blue-300">val</span>) =&gt; {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">diff</span> = <span className="text-blue-300">val</span> - <span className="text-blue-300">mean</span>;
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">return</span> <span className="text-blue-300">sum</span> + <span className="text-yellow-300">Math.pow</span>(<span className="text-blue-300">diff</span>, <span className="text-orange-400">3</span>);
                          </div>
                          <div>{'}, 0);'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">return</span> (<span className="text-blue-300">n</span> / ((<span className="text-blue-300">n</span> - <span className="text-orange-400">1</span>) * (<span className="text-blue-300">n</span> - <span className="text-orange-400">2</span>))) 
                          </div>
                          <div className="ml-4">
                            * (<span className="text-blue-300">sumCubed</span> / <span className="text-yellow-300">Math.pow</span>(<span className="text-blue-300">std</span>, <span className="text-orange-400">3</span>));
                          </div>
                        </div>
                      </div>

                      {/* Kurtosis */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">Kurtosis</span>
                          <span className="text-xs text-gray-500">Formule: [n(n+1)/(n-1)(n-2)(n-3)] × Σ((x-μ)⁴)/σ⁴ - 3 → 0.8</span>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-teal-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} calculateKurtosis() - Mesure l&apos;aplatissement {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">sumFourth</span> = <span className="text-blue-300">values</span>.<span className="text-yellow-300">reduce</span>((<span className="text-blue-300">sum</span>, <span className="text-blue-300">val</span>) =&gt; {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">diff</span> = <span className="text-blue-300">val</span> - <span className="text-blue-300">mean</span>;
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">return</span> <span className="text-blue-300">sum</span> + <span className="text-yellow-300">Math.pow</span>(<span className="text-blue-300">diff</span>, <span className="text-orange-400">4</span>);
                          </div>
                          <div>{'}, 0);'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">kurtosis</span> = (<span className="text-blue-300">n</span> * (<span className="text-blue-300">n</span> + <span className="text-orange-400">1</span>) / ((<span className="text-blue-300">n</span> - <span className="text-orange-400">1</span>) * (<span className="text-blue-300">n</span> - <span className="text-orange-400">2</span>) * (<span className="text-blue-300">n</span> - <span className="text-orange-400">3</span>))) 
                          </div>
                          <div className="ml-4">
                            * (<span className="text-blue-300">sumFourth</span> / <span className="text-yellow-300">Math.pow</span>(<span className="text-blue-300">std</span>, <span className="text-orange-400">4</span>)) 
                          </div>
                          <div className="ml-4">
                            - (<span className="text-orange-400">3</span> * <span className="text-yellow-300">Math.pow</span>(<span className="text-blue-300">n</span> - <span className="text-orange-400">1</span>, <span className="text-orange-400">2</span>) / ((<span className="text-blue-300">n</span> - <span className="text-orange-400">2</span>) * (<span className="text-blue-300">n</span> - <span className="text-orange-400">3</span>)));
                          </div>
                        </div>
                      </div>

                      {/* Corrélations */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">Corrélations Pearson</span>
                          <span className="text-xs text-gray-500">r = Σ((x-x̄)(y-ȳ)) / √(Σ(x-x̄)² × Σ(y-ȳ)²)</span>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-indigo-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} calculatePearsonCorrelation() - Relation linéaire entre variables {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">let</span> <span className="text-blue-300">numerator</span> = <span className="text-orange-400">0</span>, <span className="text-blue-300">sumSqX</span> = <span className="text-orange-400">0</span>, <span className="text-blue-300">sumSqY</span> = <span className="text-orange-400">0</span>;
                          </div>
                          <div className="mt-2">
                            <span className="text-purple-400">for</span> (<span className="text-purple-400">let</span> <span className="text-blue-300">i</span> = <span className="text-orange-400">0</span>; <span className="text-blue-300">i</span> &lt; <span className="text-blue-300">x</span>.<span className="text-yellow-300">length</span>; <span className="text-blue-300">i</span>++) {'{'}
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">diffX</span> = <span className="text-blue-300">x</span>[<span className="text-blue-300">i</span>] - <span className="text-blue-300">meanX</span>;
                          </div>
                          <div className="ml-4">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">diffY</span> = <span className="text-blue-300">y</span>[<span className="text-blue-300">i</span>] - <span className="text-blue-300">meanY</span>;
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">numerator</span> += <span className="text-blue-300">diffX</span> * <span className="text-blue-300">diffY</span>;
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">sumSqX</span> += <span className="text-blue-300">diffX</span> * <span className="text-blue-300">diffX</span>;
                          </div>
                          <div className="ml-4">
                            <span className="text-blue-300">sumSqY</span> += <span className="text-blue-300">diffY</span> * <span className="text-blue-300">diffY</span>;
                          </div>
                          <div>{'}'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">return</span> <span className="text-blue-300">numerator</span> / <span className="text-yellow-300">Math.sqrt</span>(<span className="text-blue-300">sumSqX</span> * <span className="text-blue-300">sumSqY</span>);
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Calculées pour: playtime ↔ price, playtime ↔ rating, price ↔ rating
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <strong>Machine Learning & IA</strong> : Analyse via Groq LLM
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded mt-2 text-sm space-y-3">
                      {/* Construction prompt */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                          <strong className="text-gray-900 dark:text-white">Construction du prompt optimisé</strong>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-green-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} groqUnifiedService.ts - buildPrompt() {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">topGames</span> = <span className="text-blue-300">games</span>
                          </div>
                          <div className="ml-4">
                            .<span className="text-yellow-300">sort</span>((<span className="text-blue-300">a</span>, <span className="text-blue-300">b</span>) =&gt; (<span className="text-blue-300">b</span>.<span className="text-yellow-300">playtime_forever</span> || <span className="text-orange-400">0</span>) - (<span className="text-blue-300">a</span>.<span className="text-yellow-300">playtime_forever</span> || <span className="text-orange-400">0</span>))
                          </div>
                          <div className="ml-4">
                            .<span className="text-yellow-300">slice</span>(<span className="text-orange-400">0</span>, <span className="text-orange-400">8</span>)  <span className="text-gray-500">{'/*'} Top 8 seulement {'*/'}</span>
                          </div>
                          <div className="ml-4">
                            .<span className="text-yellow-300">map</span>((<span className="text-blue-300">g</span>) =&gt; <span className="text-green-400">&apos;`$</span>{'{'}<span className="text-blue-300">g</span>.<span className="text-yellow-300">name</span>.<span className="text-yellow-300">substring</span>(<span className="text-orange-400">0</span>, <span className="text-orange-400">25</span>)<span className="text-green-400">{'}'}</span><span className="text-green-400">(`$</span>{'{'}<span className="text-yellow-300">Math.round</span>((<span className="text-blue-300">g</span>.<span className="text-yellow-300">playtime_forever</span> || <span className="text-orange-400">0</span>) / <span className="text-orange-400">60</span>)<span className="text-green-400">{'}'}h)`&apos;</span>)
                          </div>
                          <div className="ml-4">
                            .<span className="text-yellow-300">join</span>(<span className="text-green-400">&apos;,&apos;</span>);
                          </div>
                          <div className="mt-3 text-gray-500">{'/*'} Format compact pour économiser tokens {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">topEnriched</span> = <span className="text-blue-300">enrichedGames</span>
                          </div>
                          <div className="ml-4">
                            .<span className="text-yellow-300">filter</span>(<span className="text-blue-300">g</span> =&gt; <span className="text-blue-300">g</span>.<span className="text-yellow-300">playtime_forever</span> &gt; <span className="text-orange-400">0</span>)
                          </div>
                          <div className="ml-4">
                            .<span className="text-yellow-300">slice</span>(<span className="text-orange-400">0</span>, <span className="text-orange-400">10</span>)
                          </div>
                          <div className="ml-4">
                            .<span className="text-yellow-300">map</span>(<span className="text-blue-300">g</span> =&gt; ({' {'}
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">n</span>: <span className="text-blue-300">g</span>.<span className="text-yellow-300">name</span>.<span className="text-yellow-300">substring</span>(<span className="text-orange-400">0</span>, <span className="text-orange-400">25</span>),  <span className="text-gray-500">{'/*'} nom {'*/'}</span>
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">h</span>: <span className="text-yellow-300">Math.round</span>((<span className="text-blue-300">g</span>.<span className="text-yellow-300">playtime_forever</span> || <span className="text-orange-400">0</span>) / <span className="text-orange-400">60</span>),  <span className="text-gray-500">{'/*'} heures {'*/'}</span>
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">p</span>: <span className="text-yellow-300">Math.round</span>((<span className="text-blue-300">g</span>.<span className="text-blue-300">price</span>?.<span className="text-yellow-300">final</span> || <span className="text-orange-400">0</span>) / <span className="text-orange-400">100</span>),  <span className="text-gray-500">{'/*'} prix {'*/'}</span>
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">r</span>: <span className="text-yellow-300">Math.round</span>((<span className="text-blue-300">g</span>.<span className="text-yellow-300">rating_ratio</span> || <span className="text-orange-400">0</span>) * <span className="text-orange-400">100</span>),  <span className="text-gray-500">{'/*'} rating % {'*/'}</span>
                          </div>
                          <div className="ml-4">{'});'}</div>
                        </div>
                      </div>

                      {/* Appel API */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                          <strong className="text-gray-900 dark:text-white">Appel API Groq unifié</strong>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-purple-500 overflow-x-auto">
                          <div className="text-gray-500">{'/*'} groqUnifiedService.ts - analyzeComplete() {'*/'}</div>
                          <div className="mt-2">
                            <span className="text-purple-400">const</span> <span className="text-blue-300">response</span> = <span className="text-purple-400">await</span> <span className="text-blue-300">axios</span>.<span className="text-yellow-300">post</span>(
                          </div>
                          <div className="ml-4 text-green-300">
                            <span className="text-green-400">&apos;https://api.groq.com/openai/v1/chat/completions&apos;</span>,
                          </div>
                          <div className="ml-4">{'{'}</div>
                          <div className="ml-8">
                            <span className="text-blue-300">model</span>: <span className="text-green-400">&apos;llama-3.3-70b-versatile&apos;</span>,
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">messages</span>: [
                          </div>
                          <div className="ml-12">
                            {'{'} <span className="text-blue-300">role</span>: <span className="text-green-400">&apos;system&apos;</span>, <span className="text-blue-300">content</span>: <span className="text-green-400">&apos;Expert analyse Steam...&apos;</span> {'}'},
                          </div>
                          <div className="ml-12">
                            {'{'} <span className="text-blue-300">role</span>: <span className="text-green-400">&apos;user&apos;</span>, <span className="text-blue-300">content</span>: <span className="text-blue-300">prompt</span> {'}'}
                          </div>
                          <div className="ml-8">],</div>
                          <div className="ml-8">
                            <span className="text-blue-300">temperature</span>: <span className="text-orange-400">0.3</span>,
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">max_tokens</span>: <span className="text-orange-400">800</span>,  <span className="text-gray-500">{'/*'} Optimisé {'*/'}</span>
                          </div>
                          <div className="ml-8">
                            <span className="text-blue-300">response_format</span>: {'{'} <span className="text-blue-300">type</span>: <span className="text-green-400">&apos;json_object&apos;</span> {'}'}
                          </div>
                          <div className="ml-4">{'}'}</div>
                          <div>);</div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          <strong>Optimisation</strong> : Un seul appel unifié (classification + clustering + facteurs + prédictions) au lieu de 4 appels séparés → économie ~70% tokens
                        </div>
                      </div>

                      {/* Réponse */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                          <strong className="text-gray-900 dark:text-white">Réponse JSON structurée</strong>
                        </div>
                        <div className="bg-gray-900 dark:bg-black text-green-400 font-mono text-xs p-3 rounded border-l-4 border-yellow-500 overflow-x-auto">
                          <div className="text-yellow-200">{'{'}</div>
                          <div className="ml-4 text-yellow-200">
                            <span className="text-green-400">&quot;classification&quot;</span>: {'{'}
                          </div>
                          <div className="ml-8 text-yellow-200">
                            <span className="text-green-400">&quot;type&quot;</span>: <span className="text-green-400">&quot;Hardcore&quot;</span>,
                          </div>
                          <div className="ml-8 text-yellow-200">
                            <span className="text-green-400">&quot;probability&quot;</span>: <span className="text-orange-400">0.85</span>
                          </div>
                          <div className="ml-4 text-yellow-200">{'},'}</div>
                          <div className="ml-4 text-yellow-200">
                            <span className="text-green-400">&quot;clustering&quot;</span>: {'{'}
                          </div>
                          <div className="ml-8 text-yellow-200">
                            <span className="text-green-400">&quot;cluster&quot;</span>: <span className="text-orange-400">2</span>,
                          </div>
                          <div className="ml-8 text-yellow-200">
                            <span className="text-green-400">&quot;clusterLabel&quot;</span>: <span className="text-green-400">&quot;Hardcore&quot;</span>
                          </div>
                          <div className="ml-4 text-yellow-200">{'},'}</div>
                          <div className="ml-4 text-yellow-200">
                            <span className="text-green-400">&quot;successFactors&quot;</span>: {'{'} <span className="text-green-400">&quot;topFactors&quot;</span>: [...], <span className="text-green-400">&quot;summary&quot;</span>: <span className="text-green-400">&quot;...&quot;</span> {'},'}
                          </div>
                          <div className="ml-4 text-yellow-200">
                            <span className="text-green-400">&quot;predictions&quot;</span>: [...]
                          </div>
                          <div className="text-yellow-200">{'}'}</div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <strong>Recommandations</strong> : Génération basée sur profil
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-2 text-sm">
                      <div>Basées sur : genre dominant, cluster, style de jeu</div>
                      <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                        Genre: RPG → Recommande ELDEN RING, Baldur&apos;s Gate 3<br />
                        Cluster: Hardcore → Recommande jeux difficiles/exigeants
                        <br />
                        Score de correspondance calculé et tri décroissant
                      </div>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Méthodologie statistique */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🔬 Méthodologie & Analyse Statistique</h3>
                <p className="mb-2">
                  L&apos;application implémente des <strong>statistiques descriptives et inférentielles</strong> équivalentes à R :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Statistiques descriptives de base</strong> : moyenne, médiane, min, max, écart-type
                  </li>
                  <li>
                    <strong>Quartiles (Q1, Q2, Q3) et IQR</strong> : division des données en 4 parties égales pour analyser la dispersion
                  </li>
                  <li>
                    <strong>Coefficient de variation (CV)</strong> : mesure de la variabilité relative (σ/μ)
                  </li>
                  <li>
                    <strong>Skewness (asymétrie)</strong> : mesure de l&apos;asymétrie de la distribution des temps de jeu
                  </li>
                  <li>
                    <strong>Kurtosis (aplatissement)</strong> : mesure de l&apos;aplatissement et détection des valeurs extrêmes
                  </li>
                  <li>
                    <strong>Corrélations de Pearson</strong> : analyse des relations linéaires entre variables (temps de jeu, prix, notes)
                  </li>
                </ul>
                <p className="mt-2 text-sm italic">
                  Toutes ces statistiques sont calculées manuellement en JavaScript selon les formules mathématiques standards, équivalentes aux fonctions R :{" "}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">quantile()</code>,
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">sd()</code>,
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">skewness()</code>,
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">kurtosis()</code>,
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">cor()</code>.
                </p>
              </div>

              {/* Machine Learning */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🤖 Machine Learning & IA</h3>
                <p className="mb-2">
                  Utilisation de <strong>Groq API (LLM Llama-3.3-70b)</strong> pour l&apos;analyse avancée :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Classification</strong> : identification du type de joueur (Hardcore / Casual) avec probabilité de confiance
                  </li>
                  <li>
                    <strong>Clustering</strong> : regroupement par style de jeu (Explorateur, Spécialisé, Hardcore, Casual)
                  </li>
                  <li>
                    <strong>Analyse des facteurs de succès</strong> : identification des éléments qui font qu&apos;un jeu fonctionne sur Steam
                  </li>
                  <li>
                    <strong>Prédictions</strong> : évaluation du succès potentiel des jeux basée sur les données Steam
                  </li>
                </ul>
                <p className="mt-2 text-sm">
                  <strong>Optimisations</strong> : Tous les appels Groq sont unifiés en un seul appel pour réduire la consommation de tokens (~70%
                  d&apos;économie). Un système de cache en mémoire (TTL 24h) évite les appels redondants. En cas de rate limit ou d&apos;indisponibilité, un
                  fallback heuristique basique est utilisé.
                </p>
              </div>

              {/* Technologies */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🛠️ Technologies & Stack Technique</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold mb-1">Frontend</p>
                    <ul className="list-disc list-inside text-sm ml-4">
                      <li>Next.js 14 (App Router)</li>
                      <li>React 18 avec TypeScript</li>
                      <li>Tailwind CSS pour le styling</li>
                      <li>Plotly.js pour visualisations interactives</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Backend</p>
                    <ul className="list-disc list-inside text-sm ml-4">
                      <li>Next.js API Routes</li>
                      <li>Node.js runtime</li>
                      <li>Axios pour requêtes HTTP</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">APIs Externes</p>
                    <ul className="list-disc list-inside text-sm ml-4">
                      <li>Steam Web API (données joueur/jeux)</li>
                      <li>Steam Store API (métadonnées jeux)</li>
                      <li>Groq API (LLM Llama-3.3-70b)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Déploiement</p>
                    <ul className="list-disc list-inside text-sm ml-4">
                      <li>Vercel (serverless functions)</li>
                      <li>Variables d&apos;environnement pour clés API</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Détails d'implémentation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">💻 Détails d&apos;Implémentation</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Gestion des erreurs</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                      <li>Try-catch avec fallback automatique si Groq est indisponible</li>
                      <li>Gestion silencieuse des erreurs 403 de l&apos;API Steam (rate limits) avec timeout de 5s</li>
                      <li>Retry avec backoff exponentiel (1s, 2s, 4s) pour Groq en cas de rate limit</li>
                      <li>Fallback heuristique si Groq échoue : classification basée sur seuil (500h = Hardcore)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Performance & Optimisations</p>
                    <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2">
                      {`// gameEnrichmentService.ts - enrichGames()
const topGames = games
  .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
  .slice(0, 20);  // Limité aux 20 plus joués

for (const game of topGames) {
  await enrichGame(game, steamService);
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));
  // Délai 200-300ms pour éviter rate limits
}`}
                    </div>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                      <li>Enrichissement limité aux 20 jeux les plus joués (au lieu de tous)</li>
                      <li>Délais séquentiels de 200-300ms entre appels Steam API pour éviter rate limits</li>
                      <li>Prompt Groq optimisé : noms tronqués à 25 caractères, format compact (n, h, p, r, t, j)</li>
                      <li>Un seul appel Groq unifié au lieu de 4 appels séparés (économie ~70% tokens)</li>
                      <li>Limitation à 8 jeux top pour classification, 10 pour enrichissement</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Système de Cache</p>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-1 text-xs">
                      <div className="font-mono mb-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        {`// cacheService.ts
private cache = new Map<string, CacheEntry>();
private ttl = 24 * 60 * 60 * 1000; // 24h

set(key: string, value: Partial<AnalysisResult>, type: string): void {
  const fullKey = \`\${key}:\${type}\`;
  this.cache.set(fullKey, {
    data: value,
    timestamp: Date.now()
  });
}

get(key: string, type: string): Partial<AnalysisResult> | null {
  const fullKey = \`\${key}:\${type}\`;
  const entry = this.cache.get(fullKey);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > this.ttl) {
    this.cache.delete(fullKey);
    return null;
  }
  return entry.data;
}`}
                      </div>
                      <div className="text-xs">
                        Clé: <code>steamId:type</code> (ex: &quot;76561198012345678:groq&quot;)
                        <br />
                        Valeur: <code>{`{classification, clustering, successFactors, gamePredictions}`}</code>
                        <br />
                        Nettoyage automatique des entrées expirées
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">TypeScript & Typage</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                      <li>
                        Interfaces strictes pour tous les types de données (<code>SteamGame</code>, <code>EnrichedGame</code>, <code>ProcessedFeatures</code>)
                      </li>
                      <li>
                        Gestion explicite des types optionnels (<code>number | undefined</code> vs <code>number | null</code>)
                      </li>
                      <li>Validation des réponses Groq avec conversion de types sécurisée</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Architecture Modulaire</p>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded mt-1 text-xs">
                      <div>Chaque service a une responsabilité unique :</div>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>
                          <code>SteamService</code> : Communication API Steam uniquement
                        </li>
                        <li>
                          <code>PreprocessingService</code> : Transformation données brutes → features
                        </li>
                        <li>
                          <code>AdvancedStatsService</code> : Calculs statistiques avancés uniquement
                        </li>
                        <li>
                          <code>GroqUnifiedService</code> : Orchestration appels Groq
                        </li>
                        <li>
                          <code>CacheService</code> : Gestion cache isolée
                        </li>
                      </ul>
                      <div className="mt-2">Facilite les tests unitaires et la maintenance</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note pédagogique */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm">
                  <strong>💡 Note pédagogique</strong> : Ce projet démontre qu&apos;il est possible de réaliser des analyses statistiques complètes en
                  JavaScript, équivalentes à R, tout en bénéficiant d&apos;un déploiement web moderne et d&apos;une intégration avec des modèles d&apos;IA
                  générative pour l&apos;interprétation des résultats. L&apos;architecture modulaire permet une maintenance facile et une extension future des
                  fonctionnalités.
                </p>
              </div>
            </div>
          </div>
        )}

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
        {results &&
          (results as any).groqStatus &&
          (() => {
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
              {results.advancedStats && <AdvancedStatsView advancedStats={results.advancedStats} />}
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
                {results.successFactors && <SuccessFactorsView successFactors={results.successFactors} />}

                {/* Prédictions des jeux */}
                {results.gamePredictions && results.gamePredictions.length > 0 && <GamePredictionsView predictions={results.gamePredictions} />}
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
