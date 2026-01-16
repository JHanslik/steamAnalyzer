// Danfo.js utilisé uniquement dans analysisService
import { SteamGame, ProcessedFeatures, EnrichedGame } from "@/types";

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
   * Vérifie si un jeu est free-to-play (gratuit)
   */
  private async isFreeToPlay(game: SteamGame, steamService: any): Promise<boolean> {
    try {
      const details = await steamService.getGameDetails(game.appid);
      // Un jeu est F2P si is_free est true OU si le prix final est 0
      if (details?.is_free === true) {
        return true;
      }
      if (details?.price_overview?.final === 0) {
        return true;
      }
    } catch (error) {
      // En cas d'erreur, on ne peut pas déterminer, on retourne false
    }
    return false;
  }

  /**
   * Calcule toutes les features nécessaires pour le ML
   */
  async computeFeatures(
    games: SteamGame[],
    totalPlaytime: number,
    accountAge: number,
    steamService: any,
    enrichedGames?: EnrichedGame[] // Optionnel : si disponible, utilise les prix réels
  ): Promise<ProcessedFeatures> {
    // Features quantitatives
    const totalGames = games.length;
    const averagePlaytime = totalGames > 0 ? totalPlaytime / totalGames : 0;

    // Calculer le ratio de jeux free-to-play (basé sur le prix réel)
    let freeToPlayCount = 0;

    if (enrichedGames && enrichedGames.length > 0) {
      // Utiliser les données enrichies si disponibles (plus précis)
      freeToPlayCount = enrichedGames.filter((g) => {
        // Un jeu est F2P si le prix final est 0 ou si is_free est true
        return g.price?.final === 0 || (g.price === undefined && g.playtime_forever > 0);
      }).length;
    } else {
      // Sinon, vérifier via API pour les jeux (limité pour éviter trop d'appels)
      const gamesToCheck = games.slice(0, Math.min(100, games.length));
      for (const game of gamesToCheck) {
        if (await this.isFreeToPlay(game, steamService)) {
          freeToPlayCount++;
        }
      }
      // Estimer pour le reste basé sur la proportion
      if (games.length > gamesToCheck.length) {
        const f2pRatio = freeToPlayCount / gamesToCheck.length;
        freeToPlayCount += Math.round((games.length - gamesToCheck.length) * f2pRatio);
      }
    }

    const freeToPlayRatio = totalGames > 0 ? freeToPlayCount / totalGames : 0;

    // Calculer la distribution des genres
    const genreDistribution: Record<string, number> = {};

    // Pour chaque jeu, récupérer les genres et accumuler le temps de jeu
    for (const game of games.slice(0, 100)) {
      // Limiter pour éviter trop d'appels API
      const genres = await this.getGameGenres(game.appid, steamService);
      const playtime = game.playtime_forever || 0;

      genres.forEach((genre) => {
        if (!genreDistribution[genre]) {
          genreDistribution[genre] = 0;
        }
        genreDistribution[genre] += playtime;
      });
    }

    // Trouver le genre dominant
    let dominantGenre = "Unknown";
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
      genreDistribution,
    };
  }

  /**
   * Détermine le style de jeu basé sur les caractéristiques
   */
  private determineGameStyle(games: SteamGame[], genreDistribution: Record<string, number>, totalPlaytime: number): string {
    // Analyser les patterns de jeu
    const avgPlaytimePerGame = totalPlaytime / games.length;

    // Si beaucoup de jeux avec peu de temps = explorateur
    const shortGames = games.filter((g) => g.playtime_forever < 20).length;
    if (shortGames / games.length > 0.5) {
      return "Explorateur";
    }

    // Si temps moyen élevé = investi
    if (avgPlaytimePerGame > 100) {
      return "Investi";
    }

    // Si beaucoup de genres différents = varié
    if (Object.keys(genreDistribution).length > 10) {
      return "Varié";
    }

    // Si focus sur un genre = spécialisé
    if (Object.keys(genreDistribution).length < 3) {
      return "Spécialisé";
    }

    return "Équilibré";
  }

  /**
   * Encode les features catégorielles en numériques
   */
  encodeCategoricalFeatures(features: ProcessedFeatures): number[] {
    // Mapping des genres (top 10 genres communs)
    const genreMap: Record<string, number> = {
      Action: 0,
      Adventure: 1,
      RPG: 2,
      Strategy: 3,
      Simulation: 4,
      Sports: 5,
      Racing: 6,
      Indie: 7,
      Casual: 8,
      Unknown: 9,
    };

    // Mapping des styles
    const styleMap: Record<string, number> = {
      Explorateur: 0,
      Investi: 1,
      Varié: 2,
      Spécialisé: 3,
      Équilibré: 4,
    };

    const genreEncoded = genreMap[features.dominantGenre] || 9;
    const styleEncoded = styleMap[features.gameStyle] || 4;

    // Retourner un vecteur de features numériques
    return [features.totalPlaytime, features.averagePlaytime, features.totalGames, features.freeToPlayRatio, features.accountAge, genreEncoded, styleEncoded];
  }
}
