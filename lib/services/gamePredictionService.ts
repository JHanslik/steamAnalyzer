import axios from 'axios';
import { EnrichedGame, GamePrediction, SuccessFactor } from '@/types';

export class GamePredictionService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Prédit si un jeu fonctionne (succès global sur Steam)
   */
  async predictGameSuccess(
    game: EnrichedGame,
    playerGames: EnrichedGame[],
    successFactors: SuccessFactor[]
  ): Promise<GamePrediction> {
    // Retry avec backoff exponentiel
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
      // Préparer les données globales du jeu (format compact)
      const price = game.price?.final ? Math.round(game.price.final / 100) : 0;
      const ratingPercent = game.rating_ratio ? Math.round(game.rating_ratio * 100) : 0;
      const totalRatings = game.total_ratings || 0;
      const currentPlayers = game.current_players || 0;
      const genres = game.genres?.slice(0, 2).join(',') || 'U';
      
      // Envoyer seulement les 3 facteurs les plus importants
      const topFactors = successFactors.slice(0, 3).map(f => `${f.name}(${Math.round(f.importance * 100)}%)`).join(',');

      const prompt = `Jeu:${game.name.substring(0, 40)}|Prix:${price}€|Notes:${ratingPercent}%(${totalRatings})|Joueurs:${currentPlayers}|Genres:${genres}. Facteurs:${topFactors}. Détermine si succès (>70% notes, >1000 notes/joueurs). JSON:{"willSucceed":bool,"probability":0-1,"factors":[{"name":"court","importance":0-1,"impact":"+|-|=","description":"court"}],"explanation":"1 phrase"}. Max 3 facteurs.`;

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en prédiction. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 350, // Réduit de 600 à 350
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Réponse vide de Groq');
      }

      // Parser
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Impossible de parser la réponse JSON de Groq');
        }
      }

      // Valider et formater
      const factors: SuccessFactor[] = (parsed.factors || []).slice(0, 3).map((f: any) => ({
        name: f.name || 'Facteur',
        importance: Math.max(0, Math.min(1, f.importance || 0.5)),
        impact: f.impact === 'negative' ? 'negative' : f.impact === 'neutral' ? 'neutral' : 'positive',
        description: f.description || ''
      }));

        return {
          appid: game.appid,
          gameName: game.name,
          willSucceed: parsed.willSucceed === true,
          probability: Math.max(0, Math.min(1, parsed.probability || 0.5)),
          factors,
          explanation: parsed.explanation || 'Prédiction basée sur les facteurs de succès',
          usingGroq: true,
          model: 'llama-3.3-70b-versatile'
        };

      } catch (error: any) {
        lastError = error;
        
        // Si c'est un rate limit, attendre avant de réessayer
        if (error.response?.data?.error?.code === 'rate_limit_exceeded' && attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponentiel : 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Si ce n'est pas un rate limit ou si on a épuisé les tentatives, sortir
        if (error.response?.data?.error?.code !== 'rate_limit_exceeded' || attempt === maxRetries - 1) {
          break;
        }
      }
    }

    // Si toutes les tentatives ont échoué, utiliser le fallback
    if (lastError && lastError.response?.data?.error?.code !== 'rate_limit_exceeded') {
      console.error('Erreur Groq pour prédiction:', lastError.response?.data || lastError.message);
    }
    
    return this.fallbackPrediction(game);
  }

  /**
   * Prédit pour plusieurs jeux (avec limitation pour éviter rate limiting)
   */
  async predictGames(
    games: EnrichedGame[],
    playerGames: EnrichedGame[],
    successFactors: SuccessFactor[]
  ): Promise<GamePrediction[]> {
    // Prédire seulement pour les jeux les plus importants (top 5 pour économiser tokens)
    const topGames = games
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, 5);

    // Prédire séquentiellement avec délai pour éviter rate limiting
    const predictions: GamePrediction[] = [];
    for (const game of topGames) {
      const prediction = await this.predictGameSuccess(game, playerGames, successFactors);
      predictions.push(prediction);
      // Délai entre chaque prédiction pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return predictions;
  }

  /**
   * Extrait les genres les plus joués
   */
  private extractTopGenres(games: EnrichedGame[]): string[] {
    const genreCount: Record<string, number> = {};
    
    games.forEach(game => {
      game.genres?.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + (game.playtime_forever || 0);
      });
    });

    return Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);
  }

  /**
   * Fallback vers prédiction basique basée sur les données globales
   */
  private fallbackPrediction(game: EnrichedGame): GamePrediction {
    const ratingRatio = game.rating_ratio || 0;
    const totalRatings = game.total_ratings || 0;
    const currentPlayers = game.current_players || 0;
    
    // Critères basiques pour déterminer le succès
    const hasGoodRatings = ratingRatio >= 0.7 && totalRatings >= 1000;
    const hasActivePlayers = currentPlayers >= 1000;
    const hasSignificantReviews = totalRatings >= 500;
    
    const willSucceed = hasGoodRatings || (hasActivePlayers && hasSignificantReviews);
    const probability = Math.min(0.95, Math.max(0.05, 
      (ratingRatio * 0.5) + 
      (Math.min(totalRatings / 10000, 1) * 0.3) + 
      (Math.min(currentPlayers / 10000, 1) * 0.2)
    ));

    const factors: SuccessFactor[] = [];
    
    if (totalRatings > 0) {
      factors.push({
        name: 'Ratio de notes positives',
        importance: 0.5,
        impact: ratingRatio >= 0.7 ? 'positive' : 'negative',
        description: `${Math.round(ratingRatio * 100)}% de notes positives (${totalRatings.toLocaleString()} notes)`
      });
    }
    
    if (currentPlayers > 0) {
      factors.push({
        name: 'Joueurs actuels',
        importance: 0.3,
        impact: currentPlayers >= 1000 ? 'positive' : 'neutral',
        description: `${currentPlayers.toLocaleString()} joueurs en ligne`
      });
    }

    return {
      appid: game.appid,
      gameName: game.name,
      willSucceed,
      probability,
      factors,
      explanation: willSucceed 
        ? `Le jeu est considéré comme un succès sur Steam (${Math.round(ratingRatio * 100)}% de notes positives, ${totalRatings.toLocaleString()} notes)`
        : `Le jeu n'a pas encore atteint un niveau de succès significatif sur Steam`,
      usingGroq: false
    };
  }
}
