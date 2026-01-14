// Danfo.js utilisé uniquement dans analysisService
import { SteamGame, ProcessedFeatures } from '@/types';

export class PreprocessingService {
  /**
   * Récupère les genres d'un jeu depuis les détails Steam
   */
  private async getGameGenres(appid: number, steamService: any): Promise<string[]> {
    try {
      const details = await steamService.getGameDetails(appid);
      if (details?.genres) {
        return details.genres.map((g: any) => g.description);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des genres pour ${appid}`);
    }
    return [];
  }

  /**
   * Calcule toutes les features nécessaires pour le ML
   */
  async computeFeatures(
    games: SteamGame[],
    totalPlaytime: number,
    accountAge: number,
    steamService: any
  ): Promise<ProcessedFeatures> {
    // Features quantitatives
    const totalGames = games.length;
    const averagePlaytime = totalGames > 0 ? totalPlaytime / totalGames : 0;

    // Calculer le ratio de jeux free-to-play (approximation basée sur le prix)
    // Pour simplifier, on considère les jeux avec très peu de temps comme potentiellement F2P
    const freeToPlayCount = games.filter(g => g.playtime_forever < 10).length;
    const freeToPlayRatio = totalGames > 0 ? freeToPlayCount / totalGames : 0;

    // Calculer la distribution des genres
    const genreDistribution: Record<string, number> = {};
    
    // Pour chaque jeu, récupérer les genres et accumuler le temps de jeu
    for (const game of games.slice(0, 50)) { // Limiter pour éviter trop d'appels API
      const genres = await this.getGameGenres(game.appid, steamService);
      const playtime = game.playtime_forever || 0;
      
      genres.forEach(genre => {
        if (!genreDistribution[genre]) {
          genreDistribution[genre] = 0;
        }
        genreDistribution[genre] += playtime;
      });
    }

    // Trouver le genre dominant
    let dominantGenre = 'Unknown';
    let maxPlaytime = 0;
    for (const [genre, playtime] of Object.entries(genreDistribution)) {
      if (playtime > maxPlaytime) {
        maxPlaytime = playtime;
        dominantGenre = genre;
      }
    }

    // Déterminer le style de jeu
    const gameStyle = this.determineGameStyle(games, genreDistribution, totalPlaytime);

    return {
      totalPlaytime,
      averagePlaytime,
      totalGames,
      freeToPlayRatio,
      accountAge,
      dominantGenre,
      gameStyle,
      genreDistribution
    };
  }

  /**
   * Détermine le style de jeu basé sur les caractéristiques
   */
  private determineGameStyle(
    games: SteamGame[],
    genreDistribution: Record<string, number>,
    totalPlaytime: number
  ): string {
    // Analyser les patterns de jeu
    const avgPlaytimePerGame = totalPlaytime / games.length;
    
    // Si beaucoup de jeux avec peu de temps = explorateur
    const shortGames = games.filter(g => g.playtime_forever < 20).length;
    if (shortGames / games.length > 0.5) {
      return 'Explorateur';
    }

    // Si temps moyen élevé = investi
    if (avgPlaytimePerGame > 100) {
      return 'Investi';
    }

    // Si beaucoup de genres différents = varié
    if (Object.keys(genreDistribution).length > 10) {
      return 'Varié';
    }

    // Si focus sur un genre = spécialisé
    if (Object.keys(genreDistribution).length < 3) {
      return 'Spécialisé';
    }

    return 'Équilibré';
  }

  /**
   * Encode les features catégorielles en numériques
   */
  encodeCategoricalFeatures(features: ProcessedFeatures): number[] {
    // Mapping des genres (top 10 genres communs)
    const genreMap: Record<string, number> = {
      'Action': 0,
      'Adventure': 1,
      'RPG': 2,
      'Strategy': 3,
      'Simulation': 4,
      'Sports': 5,
      'Racing': 6,
      'Indie': 7,
      'Casual': 8,
      'Unknown': 9
    };

    // Mapping des styles
    const styleMap: Record<string, number> = {
      'Explorateur': 0,
      'Investi': 1,
      'Varié': 2,
      'Spécialisé': 3,
      'Équilibré': 4
    };

    const genreEncoded = genreMap[features.dominantGenre] || 9;
    const styleEncoded = styleMap[features.gameStyle] || 4;

    // Retourner un vecteur de features numériques
    return [
      features.totalPlaytime,
      features.averagePlaytime,
      features.totalGames,
      features.freeToPlayRatio,
      features.accountAge,
      genreEncoded,
      styleEncoded
    ];
  }
}
