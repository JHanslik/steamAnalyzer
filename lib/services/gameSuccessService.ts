import axios from 'axios';
import { EnrichedGame, SuccessFactorsAnalysis, SuccessFactor } from '@/types';

export class GameSuccessService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyse les jeux pour identifier les facteurs de succès
   */
  async analyzeSuccessFactors(games: EnrichedGame[]): Promise<SuccessFactorsAnalysis> {
    try {
      // Préparer les données pour Groq
      const gamesData = games
        .filter(g => g.playtime_forever > 0)
        .slice(0, 30) // Limiter pour éviter trop de tokens
        .map(g => ({
          name: g.name,
          playtime: Math.round(g.playtime_forever / 60),
          price: g.price?.final || 0,
          rating_ratio: g.rating_ratio || 0,
          genres: g.genres?.join(', ') || 'Unknown',
          release_date: g.release_date || 'Unknown',
          achievements_total: g.achievements?.total || 0
        }));

      // Définir ce qu'est un "jeu qui fonctionne"
      const successfulGames = games.filter(g => (g.playtime_forever || 0) / 60 > 20);
      const failedGames = games.filter(g => (g.playtime_forever || 0) / 60 < 5);

      const prompt = `Tu es un expert en analyse statistique de jeux vidéo. Analyse ce dataset de jeux Steam et identifie les FACTEURS qui font qu'un jeu "fonctionne" (est bien joué) vs ceux qui ne fonctionnent pas.

Dataset (${gamesData.length} jeux):
${JSON.stringify(gamesData, null, 2)}

Jeux qui fonctionnent (temps > 20h): ${successfulGames.length}
Jeux qui ne fonctionnent pas (temps < 5h): ${failedGames.length}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "topFactors": [
    {
      "name": "nom du facteur",
      "importance": nombre entre 0 et 1,
      "impact": "positive" ou "negative" ou "neutral",
      "description": "explication du facteur"
    }
  ],
  "summary": "Résumé de l'analyse en 2-3 phrases"
}

Critères pour identifier les facteurs:
- Compare les jeux qui fonctionnent vs ceux qui ne fonctionnent pas
- Identifie les corrélations (prix, notes, genres, date, etc.)
- Donne une importance (0-1) à chaque facteur
- Maximum 8 facteurs les plus importants
- Les descriptions doivent être en français`;

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en statistiques et analyse de données. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
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

      // Parser la réponse JSON
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
      const topFactors: SuccessFactor[] = (parsed.topFactors || []).slice(0, 8).map((f: any) => ({
        name: f.name || 'Facteur inconnu',
        importance: Math.max(0, Math.min(1, f.importance || 0.5)),
        impact: f.impact === 'negative' ? 'negative' : f.impact === 'neutral' ? 'neutral' : 'positive',
        description: f.description || ''
      }));

      return {
        topFactors,
        summary: parsed.summary || 'Analyse des facteurs de succès des jeux',
        usingGroq: true,
        model: 'llama-3.3-70b-versatile'
      };

    } catch (error: any) {
      console.error('Erreur Groq pour facteurs de succès:', error.response?.data || error.message);
      
      // Fallback vers facteurs basiques
      return this.fallbackFactors();
    }
  }

  /**
   * Fallback vers des facteurs basiques
   */
  private fallbackFactors(): SuccessFactorsAnalysis {
    return {
      topFactors: [
        {
          name: 'Temps de jeu',
          importance: 0.9,
          impact: 'positive',
          description: 'Les jeux avec plus de temps de jeu sont considérés comme plus réussis'
        },
        {
          name: 'Note positive',
          importance: 0.7,
          impact: 'positive',
          description: 'Les jeux mieux notés ont tendance à être plus joués'
        },
        {
          name: 'Prix',
          importance: 0.5,
          impact: 'neutral',
          description: 'Le prix peut influencer l\'engagement selon le type de jeu'
        }
      ],
      summary: 'Analyse basique des facteurs de succès basée sur le temps de jeu et les notes',
      usingGroq: false
    };
  }
}
