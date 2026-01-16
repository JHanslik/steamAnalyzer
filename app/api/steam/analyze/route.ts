import { NextRequest, NextResponse } from "next/server";
import { SteamService } from "@/lib/services/steamService";
import { PreprocessingService } from "@/lib/services/preprocessingService";
import { AnalysisService } from "@/lib/services/analysisService";
import { MLService } from "@/lib/services/mlService";
import { RecommendationService } from "@/lib/services/recommendationService";
import { GameEnrichmentService } from "@/lib/services/gameEnrichmentService";
import { GroqUnifiedService } from "@/lib/services/groqUnifiedService";
import { cacheService } from "@/lib/services/cacheService";
import { AdvancedStatsService } from "@/lib/services/advancedStatsService";

export async function POST(request: NextRequest) {
  try {
    const { steamId } = await request.json();
    if (!steamId) {
      return NextResponse.json({ error: "SteamID requis" }, { status: 400 });
    }

    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
      return NextResponse.json({ error: "Clé API Steam non configurée" }, { status: 500 });
    }

    // Initialiser les services
    const services = initializeServices(steamApiKey);

    // 1. Récupérer les données Steam
    const playerData = await services.steam.getPlayerData(steamId);
    if (playerData.games.length === 0) {
      return NextResponse.json({ error: "Aucun jeu trouvé pour ce SteamID" }, { status: 404 });
    }

    // 2. Enrichir les jeux avec les données Steam Store
    const enrichedGames = await services.enrichment.enrichGames(
      playerData.games,
      services.steam,
      50
    );

    // 3. Préprocessing et analyse statistique
    const features = await services.preprocessing.computeFeatures(
      playerData.games,
      playerData.totalPlaytime,
      playerData.accountAge || 0,
      services.steam,
      enrichedGames // Passer les jeux enrichis pour calculer le ratio F2P correctement
    );
    const stats = services.analysis.computeStats(playerData.games, features);
    const advancedStats = new AdvancedStatsService().computeAdvancedStats(
      playerData.games,
      enrichedGames
    );

    // 4. Analyse IA (Groq ou fallback)
    const encodedFeatures = services.preprocessing.encodeCategoricalFeatures(features);
    const aiAnalysis = await performAIAnalysis(
      steamId,
      playerData,
      enrichedGames,
      features,
      encodedFeatures,
      services
    );

    // 5. Générer les recommandations
    const recommendations = await services.recommendation.generateRecommendations(
      playerData.games,
      features,
      aiAnalysis.clustering,
      services.steam
    );

    // Retourner tous les résultats
    return NextResponse.json({
      playerData: {
        steamid: playerData.steamid,
        games: playerData.games,
        totalGames: playerData.totalGames,
        totalPlaytime: playerData.totalPlaytime,
        accountAge: playerData.accountAge,
      },
      features,
      stats,
      advancedStats,
      classification: aiAnalysis.classification,
      clustering: aiAnalysis.clustering,
      recommendations,
      successFactors: aiAnalysis.successFactors,
      gamePredictions: aiAnalysis.gamePredictions,
      groqStatus: aiAnalysis.groqStatus,
    });
  } catch (error: any) {
    console.error("Erreur lors de l'analyse:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'analyse" },
      { status: 500 }
    );
  }
}

/**
 * Initialise tous les services nécessaires
 */
function initializeServices(steamApiKey: string) {
  return {
    steam: new SteamService(steamApiKey),
    preprocessing: new PreprocessingService(),
    analysis: new AnalysisService(),
    ml: new MLService(),
    recommendation: new RecommendationService(),
    enrichment: new GameEnrichmentService(),
  };
}

/**
 * Effectue l'analyse IA (Groq si disponible, sinon fallback)
 */
async function performAIAnalysis(
  steamId: string,
  playerData: any,
  enrichedGames: any[],
  features: any,
  encodedFeatures: any,
  services: ReturnType<typeof initializeServices>
) {
  const groqApiKey = process.env.GROQ_API_KEY;
  let groqStatus: 'available' | 'unavailable' | 'rate_limited' | 'cached' = 'unavailable';

  // Si pas de clé Groq, utiliser le fallback directement
  if (!groqApiKey) {
    const classification = await services.ml.classifyPlayer(
      encodedFeatures,
      playerData.totalPlaytime,
      playerData.games,
      features
    );
    const clustering = await services.ml.clusterPlayer(encodedFeatures, playerData.games, features);
    return {
      classification,
      clustering,
      successFactors: null,
      gamePredictions: null,
      groqStatus,
    };
  }

  // Essayer Groq
  try {
    const groqService = new GroqUnifiedService(groqApiKey);
    const groqResult = await groqService.analyzeComplete(
      steamId,
      playerData.games,
      enrichedGames,
      features,
      playerData.totalPlaytime
    );

    // Déterminer le statut
    if (groqResult.classification.usingGroq) {
      const cached = cacheService.get(steamId, 'groq');
      groqStatus = cached ? 'cached' : 'available';
    } else {
      groqStatus = 'rate_limited';
    }

    return {
      ...groqResult,
      groqStatus,
    };
  } catch (error: any) {
    // En cas d'erreur, utiliser le fallback
    const isRateLimit = error.response?.data?.error?.code === 'rate_limit_exceeded';
    groqStatus = isRateLimit ? 'rate_limited' : 'unavailable';

    console.error('Erreur lors de l\'analyse Groq:', error);

    const classification = await services.ml.classifyPlayer(
      encodedFeatures,
      playerData.totalPlaytime,
      playerData.games,
      features
    );
    const clustering = await services.ml.clusterPlayer(encodedFeatures, playerData.games, features);

    return {
      classification,
      clustering,
      successFactors: null,
      gamePredictions: null,
      groqStatus,
    };
  }
}
