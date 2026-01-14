import axios from 'axios';
import { EnrichedGame, GamePrediction, SuccessFactor } from '@/types';

export class GamePredictionService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Prédit si un jeu va fonctionner pour le joueur
   */
  async predictGameSuccess(
    game: EnrichedGame,
    playerGames: EnrichedGame[],
    successFactors: SuccessFactor[]
  ): Promise<GamePrediction> {
    try {
      // Préparer le contexte
      const playerTopGenres = this.extractTopGenres(playerGames);
      const avgPlaytime = playerGames.reduce((sum, g) => sum + (g.playtime_forever || 0), 0) / playerGames.length;

      const prompt = `Tu es un expert en prédiction de succès de jeux vidéo. Prédit si ce jeu va "fonctionner" (être bien joué) pour ce joueur.

Jeu à prédire:
- Nom: ${game.name}
- Prix: ${game.price?.final || 0} ${game.price?.currency || 'EUR'}
- Note ratio: ${(game.rating_ratio || 0) * 100}%
- Genres: ${game.genres?.join(', ') || 'Unknown'}
- Date de sortie: ${game.release_date || 'Unknown'}
- Achievements: ${game.achievements?.total || 0}

Profil du joueur:
- Genres préférés: ${playerTopGenres.join(', ')}
- Temps de jeu moyen: ${Math.round(avgPlaytime / 60)}h
- Nombre de jeux: ${playerGames.length}

Facteurs de succès identifiés:
${successFactors.map(f => `- ${f.name} (importance: ${f.importance}, impact: ${f.impact})`).join('\n')}

Un jeu "fonctionne" si le joueur y joue > 20h.

Réponds UNIQUEMENT avec un JSON valide:
{
  "willSucceed": true ou false,
  "probability": nombre entre 0 et 1,
  "factors": [
    {
      "name": "nom du facteur",
      "importance": nombre 0-1,
      "impact": "positive" ou "negative" ou "neutral",
      "description": "explication"
    }
  ],
  "explanation": "explication de la prédiction en 2-3 phrases"
}`;

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
          max_tokens: 600,
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
      const factors: SuccessFactor[] = (parsed.factors || []).slice(0, 5).map((f: any) => ({
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
      console.error('Erreur Groq pour prédiction:', error.response?.data || error.message);
      
      // Fallback
      return this.fallbackPrediction(game);
    }
  }

  /**
   * Prédit pour plusieurs jeux
   */
  async predictGames(
    games: EnrichedGame[],
    playerGames: EnrichedGame[],
    successFactors: SuccessFactor[]
  ): Promise<GamePrediction[]> {
    // Prédire seulement pour les jeux les plus importants (top 15)
    const topGames = games
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, 15);

    const predictions = await Promise.all(
      topGames.map(game => this.predictGameSuccess(game, playerGames, successFactors))
    );

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
   * Fallback vers prédiction basique
   */
  private fallbackPrediction(game: EnrichedGame): GamePrediction {
    const hours = (game.playtime_forever || 0) / 60;
    const willSucceed = hours > 20;
    const probability = Math.min(0.95, Math.max(0.05, hours / 50));

    return {
      appid: game.appid,
      gameName: game.name,
      willSucceed,
      probability,
      factors: [
        {
          name: 'Temps de jeu actuel',
          importance: 0.8,
          impact: willSucceed ? 'positive' : 'negative',
          description: `Le jeu a ${Math.round(hours)}h de temps de jeu`
        }
      ],
      explanation: willSucceed 
        ? 'Le jeu semble bien fonctionner pour ce joueur (temps de jeu élevé)'
        : 'Le jeu n\'a pas encore été beaucoup joué',
      usingGroq: false
    };
  }
}
