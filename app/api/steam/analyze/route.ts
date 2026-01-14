import { NextRequest, NextResponse } from 'next/server';
import { SteamService } from '@/lib/services/steamService';
import { PreprocessingService } from '@/lib/services/preprocessingService';
import { AnalysisService } from '@/lib/services/analysisService';
import { MLService } from '@/lib/services/mlService';
import { RecommendationService } from '@/lib/services/recommendationService';

export async function POST(request: NextRequest) {
  try {
    const { steamId } = await request.json();

    if (!steamId) {
      return NextResponse.json(
        { error: 'SteamID requis' },
        { status: 400 }
      );
    }

    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Steam non configurée' },
        { status: 500 }
      );
    }

    // Initialiser les services
    const steamService = new SteamService(apiKey);
    const preprocessingService = new PreprocessingService();
    const analysisService = new AnalysisService();
    const mlService = new MLService();
    const recommendationService = new RecommendationService();

    // 1. Récupérer les données Steam
    const playerData = await steamService.getPlayerData(steamId);

    if (playerData.games.length === 0) {
      return NextResponse.json(
        { error: 'Aucun jeu trouvé pour ce SteamID' },
        { status: 404 }
      );
    }

    // 2. Préprocessing
    const features = await preprocessingService.computeFeatures(
      playerData.games,
      playerData.totalPlaytime,
      playerData.accountAge || 0,
      steamService
    );

    // 3. Analyse statistique
    const stats = analysisService.computeStats(playerData.games, features);

    // 4. Encoder les features pour le ML
    const encodedFeatures = preprocessingService.encodeCategoricalFeatures(features);

    // 5. Classification
    const classification = mlService.classifyPlayer(
      encodedFeatures,
      playerData.totalPlaytime
    );

    // 6. Clustering
    const clustering = mlService.clusterPlayer(encodedFeatures);

    // 7. Recommandations
    const recommendations = await recommendationService.generateRecommendations(
      playerData.games,
      features,
      clustering,
      steamService
    );

    // Retourner tous les résultats
    return NextResponse.json({
      playerData: {
        steamid: playerData.steamid,
        games: playerData.games,
        totalGames: playerData.totalGames,
        totalPlaytime: playerData.totalPlaytime,
        accountAge: playerData.accountAge
      },
      features,
      stats,
      classification,
      clustering,
      recommendations
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'analyse:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}
