import { SteamGame, GameRecommendation, ProcessedFeatures, ClusteringResult } from '@/types';

export class RecommendationService {
  /**
   * Génère des recommandations de jeux basées sur l'analyse
   */
  async generateRecommendations(
    playerGames: SteamGame[],
    features: ProcessedFeatures,
    clustering: ClusteringResult,
    steamService: any
  ): Promise<GameRecommendation[]> {
    const recommendations: GameRecommendation[] = [];
    
    // Récupérer les jeux déjà possédés (appids)
    const ownedAppIds = new Set(playerGames.map(g => g.appid));
    
    // Recommandations basées sur le genre dominant
    const genreRecommendations = await this.recommendByGenre(
      features.dominantGenre,
      ownedAppIds,
      steamService
    );
    recommendations.push(...genreRecommendations);
    
    // Recommandations basées sur le cluster
    const clusterRecommendations = await this.recommendByCluster(
      clustering,
      features,
      ownedAppIds,
      steamService
    );
    recommendations.push(...clusterRecommendations);
    
    // Trier par score de correspondance et limiter à 10
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  /**
   * Recommande des jeux basés sur le genre dominant
   */
  private async recommendByGenre(
    dominantGenre: string,
    ownedAppIds: Set<number>,
    steamService: any
  ): Promise<GameRecommendation[]> {
    // Liste de jeux populaires par genre (exemples)
    // En production, on utiliserait l'API Steam pour chercher des jeux par genre
    const genreGames: Record<string, Array<{ appid: number; name: string; reason: string }>> = {
      'Action': [
        { appid: 730, name: 'Counter-Strike 2', reason: 'Jeu d\'action compétitif très populaire' },
        { appid: 1174180, name: 'Red Dead Redemption 2', reason: 'Action-aventure immersive' },
        { appid: 271590, name: 'Grand Theft Auto V', reason: 'Action en monde ouvert' }
      ],
      'RPG': [
        { appid: 1245620, name: 'ELDEN RING', reason: 'RPG à monde ouvert acclamé' },
        { appid: 292030, name: 'The Witcher 3: Wild Hunt', reason: 'RPG narratif exceptionnel' },
        { appid: 1086940, name: 'Baldur\'s Gate 3', reason: 'RPG tactique moderne' }
      ],
      'Strategy': [
        { appid: 289070, name: 'Sid Meier\'s Civilization VI', reason: 'Stratégie au tour par tour' },
        { appid: 236390, name: 'Warhammer 40,000: Dawn of War II', reason: 'Stratégie temps réel' }
      ],
      'Adventure': [
        { appid: 1091500, name: 'Cyberpunk 2077', reason: 'Aventure futuriste immersive' },
        { appid: 1174180, name: 'Red Dead Redemption 2', reason: 'Aventure western' }
      ]
    };

    const games = genreGames[dominantGenre] || genreGames['Action'];
    const recommendations: GameRecommendation[] = [];

    for (const game of games) {
      if (!ownedAppIds.has(game.appid)) {
        recommendations.push({
          appid: game.appid,
          name: game.name,
          reason: `Basé sur votre préférence pour ${dominantGenre}: ${game.reason}`,
          matchScore: 0.8
        });
      }
    }

    return recommendations;
  }

  /**
   * Recommande des jeux basés sur le cluster
   */
  private async recommendByCluster(
    clustering: ClusteringResult,
    features: ProcessedFeatures,
    ownedAppIds: Set<number>,
    steamService: any
  ): Promise<GameRecommendation[]> {
    const recommendations: GameRecommendation[] = [];
    
    // Recommandations selon le type de cluster
    const clusterGames: Record<string, Array<{ appid: number; name: string; reason: string }>> = {
      'Explorateur': [
        { appid: 413150, name: 'Stardew Valley', reason: 'Jeu relaxant pour explorer à votre rythme' },
        { appid: 367520, name: 'Hollow Knight', reason: 'Métroidvania à explorer' }
      ],
      'Hardcore': [
        { appid: 730, name: 'Counter-Strike 2', reason: 'Jeu compétitif exigeant' },
        { appid: 1245620, name: 'ELDEN RING', reason: 'Défi difficile et engageant' }
      ],
      'Spécialisé': [
        { appid: 289070, name: 'Sid Meier\'s Civilization VI', reason: 'Approfondissement stratégique' },
        { appid: 292030, name: 'The Witcher 3: Wild Hunt', reason: 'RPG profond et narratif' }
      ],
      'Casual': [
        { appid: 413150, name: 'Stardew Valley', reason: 'Jeu décontracté et accessible' },
        { appid: 367520, name: 'Hollow Knight', reason: 'Aventure accessible mais engageante' }
      ]
    };

    const games = clusterGames[clustering.clusterLabel] || clusterGames['Casual'];
    
    for (const game of games) {
      if (!ownedAppIds.has(game.appid)) {
        recommendations.push({
          appid: game.appid,
          name: game.name,
          reason: `Pour un joueur ${clustering.clusterLabel}: ${game.reason}`,
          matchScore: 0.7
        });
      }
    }

    // Recommandations basées sur le style de jeu
    if (features.gameStyle === 'Investi') {
      recommendations.push({
        appid: 1245620,
        name: 'ELDEN RING',
        reason: 'Jeu profond nécessitant un investissement en temps',
        matchScore: 0.75
      });
    }

    return recommendations.filter(r => !ownedAppIds.has(r.appid));
  }
}
