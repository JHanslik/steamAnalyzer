import { NextRequest, NextResponse } from "next/server";
import { SteamService } from "@/lib/services/steamService";
import { PreprocessingService } from "@/lib/services/preprocessingService";
import { AnalysisService } from "@/lib/services/analysisService";
import { MLService } from "@/lib/services/mlService";
import { RecommendationService } from "@/lib/services/recommendationService";
import { GameEnrichmentService } from "@/lib/services/gameEnrichmentService";
import { GroqUnifiedService } from "@/lib/services/groqUnifiedService";
import { cacheService } from "@/lib/services/cacheService";

export async function POST(request: NextRequest) {
  try {
    const { steamId } = await request.json();

    if (!steamId) {
      return NextResponse.json({ error: "SteamID requis" }, { status: 400 });
    }

    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API Steam non configurée" }, { status: 500 });
    }

    // Initialiser les services
    const steamService = new SteamService(apiKey);
    const preprocessingService = new PreprocessingService();
    const analysisService = new AnalysisService();
    const mlService = new MLService();
    const recommendationService = new RecommendationService();
    const enrichmentService = new GameEnrichmentService();

    // 1. Récupérer les données Steam
    const playerData = await steamService.getPlayerData(steamId);

    if (playerData.games.length === 0) {
      return NextResponse.json({ error: "Aucun jeu trouvé pour ce SteamID" }, { status: 404 });
    }

    // 2. Enrichir les jeux avec les données Steam Store
    const enrichedGames = await enrichmentService.enrichGames(playerData.games, steamService, 20);

    // 3. Préprocessing
    const features = await preprocessingService.computeFeatures(playerData.games, playerData.totalPlaytime, playerData.accountAge || 0, steamService);

    // 4. Analyse statistique
    const stats = analysisService.computeStats(playerData.games, features);

    // 5. Encoder les features pour le ML
    const encodedFeatures = preprocessingService.encodeCategoricalFeatures(features);

    // 6. Analyse Groq unifiée (classification, clustering, facteurs, prédictions en 1 seul appel)
    let classification;
    let clustering;
    let successFactors = null;
    let gamePredictions = null;
    let groqStatus = 'unavailable'; // 'available', 'unavailable', 'rate_limited', 'cached'
    
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const groqUnified = new GroqUnifiedService(groqApiKey);
        const groqResult = await groqUnified.analyzeComplete(
          steamId,
          playerData.games,
          enrichedGames,
          features,
          playerData.totalPlaytime
        );

        classification = groqResult.classification;
        clustering = groqResult.clustering;
        successFactors = groqResult.successFactors;
        gamePredictions = groqResult.gamePredictions;

        // Déterminer le statut
        if (classification.usingGroq) {
          const cached = cacheService.get(steamId, 'groq');
          groqStatus = cached ? 'cached' : 'available';
        } else {
          groqStatus = 'rate_limited';
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'analyse Groq unifiée:', error);
        
        // Si rate limit, utiliser fallback
        if (error.response?.data?.error?.code === 'rate_limit_exceeded') {
          groqStatus = 'rate_limited';
        } else {
          groqStatus = 'unavailable';
        }

        // Fallback vers MLService
        classification = await mlService.classifyPlayer(encodedFeatures, playerData.totalPlaytime, playerData.games, features);
        clustering = await mlService.clusterPlayer(encodedFeatures, playerData.games, features);
      }
    } else {
      // Pas de clé Groq, utiliser MLService
      classification = await mlService.classifyPlayer(encodedFeatures, playerData.totalPlaytime, playerData.games, features);
      clustering = await mlService.clusterPlayer(encodedFeatures, playerData.games, features);
    }

    // 7. Recommandations
    const recommendations = await recommendationService.generateRecommendations(playerData.games, features, clustering, steamService);

    // Retourner tous les résultats avec le statut Groq
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
      classification,
      clustering,
      recommendations,
      successFactors,
      gamePredictions,
      groqStatus, // 'available', 'unavailable', 'rate_limited', 'cached'
    });
  } catch (error: any) {
    console.error("Erreur lors de l'analyse:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de l'analyse" }, { status: 500 });
  }
}
