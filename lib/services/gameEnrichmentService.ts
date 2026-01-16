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

        // Récupérer les vraies notes depuis l'API Reviews (avec délai pour éviter rate limit)
        try {
          // Petit délai pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          const reviews = await steamService.getGameReviews(game.appid);
          if (reviews) {
            enriched.positive_ratings = reviews.positive;
            enriched.negative_ratings = reviews.negative;
            enriched.total_ratings = reviews.total;
            
            if (reviews.total > 0) {
              enriched.rating_ratio = reviews.positive / reviews.total;
            } else {
              enriched.rating_ratio = 0;
            }
          }
        } catch (error) {
          // Si l'API Reviews échoue, essayer depuis les détails
          if (details.positive_ratings !== undefined) {
            enriched.positive_ratings = details.positive_ratings;
          }
          if (details.negative_ratings !== undefined) {
            enriched.negative_ratings = details.negative_ratings;
          }
          
          if (enriched.positive_ratings !== undefined || enriched.negative_ratings !== undefined) {
            enriched.positive_ratings = enriched.positive_ratings || 0;
            enriched.negative_ratings = enriched.negative_ratings || 0;
            enriched.total_ratings = enriched.positive_ratings + enriched.negative_ratings;
            
            if (enriched.total_ratings > 0) {
              enriched.rating_ratio = enriched.positive_ratings / enriched.total_ratings;
            }
          } else if (details.recommendations?.total) {
            // Fallback : utiliser recommendations comme approximation
            enriched.positive_ratings = details.recommendations.total;
            enriched.total_ratings = details.recommendations.total;
            enriched.rating_ratio = 0.85; // Approximation conservatrice
          }
        }
      }

      // Récupérer le nombre de joueurs actuels
      try {
        const currentPlayers = await steamService.getCurrentPlayers(game.appid);
        enriched.current_players = currentPlayers ?? undefined;
      } catch (error) {
        // Silencieux si échec
      }

    } catch (error) {
      console.error(`Erreur lors de l'enrichissement du jeu ${game.appid}:`, error);
    }

    return enriched;
  }

  /**
   * Enrichit plusieurs jeux (avec limitation pour éviter trop d'appels API)
   */
  async enrichGames(games: SteamGame[], steamService: SteamService, limit: number = 50): Promise<EnrichedGame[]> {
    // Enrichir seulement les jeux les plus joués pour éviter trop d'appels API
    const topGames = games
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, limit);

    // Enrichir séquentiellement avec délai pour éviter rate limiting
    const enrichedGames: EnrichedGame[] = [];
    for (const game of topGames) {
      const enriched = await this.enrichGame(game, steamService);
      enrichedGames.push(enriched);
      // Délai entre chaque jeu pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Ajouter les jeux non enrichis
    const enrichedAppIds = new Set(enrichedGames.map(g => g.appid));
    const remainingGames = games
      .filter(g => !enrichedAppIds.has(g.appid))
      .map(g => ({ ...g } as EnrichedGame));

    return [...enrichedGames, ...remainingGames];
  }
}
