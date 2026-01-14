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
      // Préparer les données pour Groq (format compact)
      const gamesData = games
        .filter(g => g.playtime_forever > 0)
        .slice(0, 15) // Réduit de 30 à 15 jeux
        .map(g => ({
          n: g.name.substring(0, 30), // Nom tronqué à 30 caractères
          h: Math.round(g.playtime_forever / 60), // heures
          p: Math.round((g.price?.final || 0) / 100), // prix en euros
          r: Math.round((g.rating_ratio || 0) * 100), // ratio en %
          g: g.genres?.slice(0, 2).join(',') || 'U' // 2 premiers genres seulement
        }));

      // Définir ce qu'est un "jeu qui fonctionne"
      const successfulGames = games.filter(g => (g.playtime_forever || 0) / 60 > 20);
      const failedGames = games.filter(g => (g.playtime_forever || 0) / 60 < 5);

      const prompt = `Analyse ce dataset Steam et identifie les facteurs de succès. Dataset:${JSON.stringify(gamesData)}. Succès (>20h):${successfulGames.length}, Échecs (<5h):${failedGames.length}. JSON:{"topFactors":[{"name":"facteur","importance":0-1,"impact":"positive|negative|neutral","description":"court"}],"summary":"2 phrases max"}. Max 6 facteurs.`;

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
          max_tokens: 500, // Réduit de 1000 à 500
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
      const topFactors: SuccessFactor[] = (parsed.topFactors || []).slice(0, 6).map((f: any) => ({
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
