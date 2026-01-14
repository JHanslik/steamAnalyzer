import { SteamGame, EnrichedGame } from '@/types';
import { SteamService } from './steamService';

export class GameEnrichmentService {
  /**
   * Enrichit un jeu avec les données du Steam Store
   */
  async enrichGame(game: SteamGame, steamService: SteamService): Promise<EnrichedGame> {
    const enriched: EnrichedGame = { ...game };

    try {
      const details = await steamService.getGameDetails(game.appid);
      
      if (details) {
        // Prix
        if (details.price_overview) {
          enriched.price = {
            initial: details.price_overview.initial,
            final: details.price_overview.final,
            currency: details.price_overview.currency,
            discount_percent: details.price_overview.discount_percent || 0
          };
        } else if (details.is_free) {
          enriched.price = {
            initial: 0,
            final: 0,
            currency: 'EUR',
            discount_percent: 0
          };
        }

        // Date de sortie
        if (details.release_date?.date) {
          enriched.release_date = details.release_date.date;
        }

        // Notes
        if (details.recommendations) {
          enriched.positive_ratings = details.recommendations.total || 0;
        }
        if (details.steamspy_tags) {
          // Approximation si pas disponible directement
        }

        // Genres
        if (details.genres) {
          enriched.genres = details.genres.map((g: any) => g.description);
        }

        // Catégories
        if (details.categories) {
          enriched.categories = details.categories.map((c: any) => c.description);
        }

        // Achievements
        if (details.achievements) {
          enriched.achievements = {
            total: details.achievements.total || 0
          };
        }

        // Notes (positive_ratings et negative_ratings)
        if (details.recommendations) {
          enriched.positive_ratings = details.recommendations.total || 0;
          // Les recommendations.total sont généralement positives, mais on peut avoir plus de détails
        }
        
        // Essayer de récupérer les vraies notes si disponibles dans l'API
        // Note: L'API Steam Store ne donne pas toujours negative_ratings directement
        // On utilise recommendations.total comme approximation des notes positives
        if (details.recommendations?.total) {
          enriched.positive_ratings = details.recommendations.total;
          enriched.total_ratings = details.recommendations.total;
          // Approximation : on assume que la plupart sont positives (ratio élevé)
          enriched.rating_ratio = 0.85; // Approximation conservatrice
        }
      }

      // Récupérer le nombre de joueurs actuels (optionnel, peut être lent)
      // const currentPlayers = await steamService.getCurrentPlayers(game.appid);
      // enriched.current_players = currentPlayers;

    } catch (error) {
      console.error(`Erreur lors de l'enrichissement du jeu ${game.appid}:`, error);
    }

    return enriched;
  }

  /**
   * Enrichit plusieurs jeux (avec limitation pour éviter trop d'appels API)
   */
  async enrichGames(games: SteamGame[], steamService: SteamService, limit: number = 20): Promise<EnrichedGame[]> {
    // Enrichir seulement les jeux les plus joués pour éviter trop d'appels API
    const topGames = games
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, limit);

    const enrichedGames = await Promise.all(
      topGames.map(game => this.enrichGame(game, steamService))
    );

    // Ajouter les jeux non enrichis
    const enrichedAppIds = new Set(enrichedGames.map(g => g.appid));
    const remainingGames = games
      .filter(g => !enrichedAppIds.has(g.appid))
      .map(g => ({ ...g } as EnrichedGame));

    return [...enrichedGames, ...remainingGames];
  }
}
