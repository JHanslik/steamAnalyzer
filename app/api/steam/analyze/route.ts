import { NextRequest, NextResponse } from "next/server";
import { SteamService } from "@/lib/services/steamService";
import { PreprocessingService } from "@/lib/services/preprocessingService";
import { AnalysisService } from "@/lib/services/analysisService";
import { MLService } from "@/lib/services/mlService";
import { RecommendationService } from "@/lib/services/recommendationService";
import { GameEnrichmentService } from "@/lib/services/gameEnrichmentService";
import { GameSuccessService } from "@/lib/services/gameSuccessService";
import { GamePredictionService } from "@/lib/services/gamePredictionService";

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

    // 6. Classification (avec Groq si disponible)
    const classification = await mlService.classifyPlayer(encodedFeatures, playerData.totalPlaytime, playerData.games, features);

    // 7. Clustering (avec Groq si disponible)
    const clustering = await mlService.clusterPlayer(encodedFeatures, playerData.games, features);

    // 8. Recommandations
    const recommendations = await recommendationService.generateRecommendations(playerData.games, features, clustering, steamService);

    // 9. Analyse des facteurs de succès (avec Groq si disponible)
    let successFactors = null;
    let gamePredictions = null;
    
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const successService = new GameSuccessService(groqApiKey);
        successFactors = await successService.analyzeSuccessFactors(enrichedGames);

        // 10. Prédictions pour les jeux
        const predictionService = new GamePredictionService(groqApiKey);
        gamePredictions = await predictionService.predictGames(enrichedGames, enrichedGames, successFactors.topFactors);
      } catch (error) {
        console.error('Erreur lors de l\'analyse des facteurs de succès:', error);
        // Continue sans ces analyses
      }
    }

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
      classification,
      clustering,
      recommendations,
      successFactors,
      gamePredictions,
    });
  } catch (error: any) {
    console.error("Erreur lors de l'analyse:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de l'analyse" }, { status: 500 });
  }
}
