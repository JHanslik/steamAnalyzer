import axios from 'axios';
import { 
  ClassificationResult, 
  ClusteringResult, 
  ProcessedFeatures, 
  SteamGame, 
  EnrichedGame,
  SuccessFactorsAnalysis,
  GamePrediction,
  SuccessFactor
} from '@/types';
import { cacheService } from './cacheService';

export class GroqUnifiedService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyse complète en un seul appel Groq (classification, clustering, facteurs, prédictions)
   */
  async analyzeComplete(
    steamId: string,
    games: SteamGame[],
    enrichedGames: EnrichedGame[],
    features: ProcessedFeatures,
    totalPlaytime: number
  ): Promise<{
    classification: ClassificationResult;
    clustering: ClusteringResult;
    successFactors: SuccessFactorsAnalysis | null;
    gamePredictions: GamePrediction[] | null;
  }> {
    // Vérifier le cache
    const cached = cacheService.get(steamId, 'groq');
    if (cached?.classification && cached?.clustering) {
      return {
        classification: cached.classification as ClassificationResult,
        clustering: cached.clustering as ClusteringResult,
        successFactors: cached.successFactors as SuccessFactorsAnalysis | null,
        gamePredictions: cached.gamePredictions as GamePrediction[] | null,
      };
    }

    try {
      // Préparer les données pour le prompt
      const prompt = this.buildPrompt(games, enrichedGames, features, totalPlaytime);

      // Appel API Groq
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Expert analyse Steam. Réponds UNIQUEMENT JSON valide, sans texte avant/après.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Parser la réponse JSON
      const parsed = this.parseGroqResponse(response.data.choices[0]?.message?.content);

      // Formater les résultats
      const classification = this.formatClassification(parsed);
      const clustering = this.formatClustering(parsed);
      const successFactors = this.formatSuccessFactors(parsed);
      const gamePredictions = this.formatGamePredictions(parsed, enrichedGames);

      // Mettre en cache
      const result = {
        classification,
        clustering,
        successFactors: successFactors ?? undefined,
        gamePredictions: gamePredictions ?? undefined,
      };
      cacheService.set(steamId, result, 'groq');

      return {
        classification,
        clustering,
        successFactors: successFactors ?? null,
        gamePredictions: gamePredictions ?? null,
      };

    } catch (error: any) {
      const isRateLimit = error.response?.data?.error?.code === 'rate_limit_exceeded';
      if (isRateLimit) {
        console.warn('Rate limit Groq atteint, utilisation du fallback');
      } else {
        console.error('Erreur Groq unifié:', error.response?.data || error.message);
      }
      return this.fallbackAnalysis(features, totalPlaytime, enrichedGames);
    }
  }

  /**
   * Construit le prompt compact pour Groq
   */
  private buildPrompt(
    games: SteamGame[],
    enrichedGames: EnrichedGame[],
    features: ProcessedFeatures,
    totalPlaytime: number
  ): string {
    // Top jeux par temps de jeu
    const topGames = games
      .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
      .slice(0, 8)
      .map((g) => `${g.name.substring(0, 25)}(${Math.round((g.playtime_forever || 0) / 60)}h)`)
      .join(',');

    // Top jeux enrichis (format compact)
    const topEnriched = enrichedGames
      .filter(g => g.playtime_forever > 0)
      .slice(0, 10)
      .map(g => ({
        n: g.name.substring(0, 25),
        h: Math.round((g.playtime_forever || 0) / 60),
        p: Math.round((g.price?.final || 0) / 100),
        r: Math.round((g.rating_ratio || 0) * 100),
        t: g.total_ratings || 0,
        j: g.current_players || 0
      }));

    return `Analyse complète Steam. Profil:${Math.round(totalPlaytime / 60)}h,${features.totalGames}j,${Math.round(features.averagePlaytime / 60)}h/j,${features.dominantGenre},${features.gameStyle},${features.accountAge}j. Top:${topGames}. Jeux:${JSON.stringify(topEnriched)}. JSON:{"classification":{"type":"Hardcore|Casual","probability":0-1,"threshold":500},"clustering":{"cluster":0-3,"clusterLabel":"Explorateur|Casual|Hardcore|Spécialisé","characteristics":["c1","c2","c3"]},"successFactors":{"topFactors":[{"name":"f","importance":0-1,"impact":"+|-|=","description":"court"}],"summary":"2 phrases"},"predictions":[{"gameName":"n","willSucceed":bool,"probability":0-1,"factors":[{"name":"f","importance":0-1,"impact":"+|-|="}],"explanation":"1 phrase"}]}. Max 5 facteurs, 5 prédictions, 3 facteurs par prédiction.`;
  }

  /**
   * Parse la réponse JSON de Groq (gère les cas où il y a du texte autour)
   */
  private parseGroqResponse(content: string | undefined): any {
    if (!content) {
      throw new Error('Réponse vide de Groq');
    }

    try {
      return JSON.parse(content);
    } catch {
      // Essayer d'extraire le JSON si entouré de texte
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Impossible de parser la réponse JSON de Groq');
    }
  }

  /**
   * Formate la classification depuis la réponse Groq
   */
  private formatClassification(parsed: any): ClassificationResult {
    return {
      type: parsed.classification?.type === 'Hardcore' ? 'Hardcore' : 'Casual',
      probability: Math.max(0, Math.min(1, parsed.classification?.probability || 0.5)),
      threshold: parsed.classification?.threshold || 500,
      usingGroq: true,
      model: 'llama-3.3-70b-versatile',
    };
  }

  /**
   * Formate le clustering depuis la réponse Groq
   */
  private formatClustering(parsed: any): ClusteringResult {
    return {
      cluster: Math.max(0, Math.min(3, parsed.clustering?.cluster || 0)),
      clusterLabel: parsed.clustering?.clusterLabel || 'Casual',
      characteristics: Array.isArray(parsed.clustering?.characteristics)
        ? parsed.clustering.characteristics.slice(0, 3)
        : ['Profil équilibré'],
      usingGroq: true,
      model: 'llama-3.3-70b-versatile',
    };
  }

  /**
   * Formate les facteurs de succès depuis la réponse Groq
   */
  private formatSuccessFactors(parsed: any): SuccessFactorsAnalysis | null {
    if (!parsed.successFactors?.topFactors) {
      return null;
    }

    const factors: SuccessFactor[] = parsed.successFactors.topFactors.slice(0, 5).map((f: any) => ({
      name: f.name || 'Facteur',
      importance: Math.max(0, Math.min(1, f.importance || 0.5)),
      impact: f.impact === 'negative' ? 'negative' : f.impact === 'neutral' ? 'neutral' : 'positive',
      description: f.description || ''
    }));

    return {
      topFactors: factors,
      summary: parsed.successFactors.summary || 'Analyse des facteurs de succès',
      usingGroq: true,
      model: 'llama-3.3-70b-versatile'
    };
  }

  /**
   * Formate les prédictions de jeux depuis la réponse Groq
   */
  private formatGamePredictions(parsed: any, enrichedGames: EnrichedGame[]): GamePrediction[] | null {
    if (!Array.isArray(parsed.predictions) || parsed.predictions.length === 0) {
      return null;
    }

    return parsed.predictions.slice(0, 5).map((p: any, idx: number) => {
      const game = enrichedGames[idx] || enrichedGames[0];
      return {
        appid: game?.appid || 0,
        gameName: p.gameName || game?.name || 'Jeu inconnu',
        willSucceed: p.willSucceed === true,
        probability: Math.max(0, Math.min(1, p.probability || 0.5)),
        factors: (p.factors || []).slice(0, 3).map((f: any) => ({
          name: f.name || 'Facteur',
          importance: Math.max(0, Math.min(1, f.importance || 0.5)),
          impact: f.impact === 'negative' ? 'negative' : f.impact === 'neutral' ? 'neutral' : 'positive',
          description: f.description || ''
        })),
        explanation: p.explanation || 'Prédiction basée sur les données Steam',
        usingGroq: true,
        model: 'llama-3.3-70b-versatile'
      };
    });
  }

  /**
   * Fallback vers logique basique
   */
  private fallbackAnalysis(
    features: ProcessedFeatures,
    totalPlaytime: number,
    enrichedGames: EnrichedGame[]
  ): {
    classification: ClassificationResult;
    clustering: ClusteringResult;
    successFactors: SuccessFactorsAnalysis | null;
    gamePredictions: GamePrediction[] | null;
  } {
    const threshold = 500;
    const hours = totalPlaytime / 60;
    const probability = Math.min(0.95, Math.max(0.05, hours / 1000));

    const classification: ClassificationResult = {
      type: hours > threshold ? 'Hardcore' : 'Casual',
      probability,
      threshold,
      usingGroq: false,
    };

    let clusterLabel = 'Casual';
    let cluster = 1;
    const characteristics: string[] = [];

    if (hours > 1000) {
      clusterLabel = 'Hardcore';
      cluster = 2;
      characteristics.push('Temps de jeu très élevé');
    } else if (features.totalGames > 100) {
      clusterLabel = 'Explorateur';
      cluster = 0;
      characteristics.push('Grand collectionneur');
    } else if (Object.keys(features.genreDistribution).length < 3) {
      clusterLabel = 'Spécialisé';
      cluster = 3;
      characteristics.push('Focus sur un genre');
    }

    if (characteristics.length === 0) {
      characteristics.push('Profil équilibré');
    }

    const clustering: ClusteringResult = {
      cluster,
      clusterLabel,
      characteristics,
      usingGroq: false,
    };

    // Facteurs basiques
    const successFactors: SuccessFactorsAnalysis = {
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
        }
      ],
      summary: 'Analyse basique des facteurs de succès (mode fallback - quota Groq atteint)',
      usingGroq: false
    };

    // Prédictions basiques
    const gamePredictions: GamePrediction[] = enrichedGames
      .slice(0, 5)
      .map(game => {
        const ratingRatio = game.rating_ratio || 0;
        const totalRatings = game.total_ratings || 0;
        const willSucceed = ratingRatio >= 0.7 && totalRatings >= 1000;
        const prob = Math.min(0.95, Math.max(0.05, ratingRatio * 0.7 + (Math.min(totalRatings / 10000, 1) * 0.3)));

        return {
          appid: game.appid,
          gameName: game.name,
          willSucceed,
          probability: prob,
          factors: [
            {
              name: 'Ratio de notes',
              importance: 0.6,
              impact: ratingRatio >= 0.7 ? 'positive' : 'negative',
              description: `${Math.round(ratingRatio * 100)}% de notes positives`
            }
          ],
          explanation: willSucceed 
            ? `Jeu considéré comme un succès (${Math.round(ratingRatio * 100)}% de notes positives)`
            : 'Jeu n\'a pas encore atteint un niveau de succès significatif',
          usingGroq: false
        };
      });

    return {
      classification,
      clustering,
      successFactors,
      gamePredictions,
    };
  }
}
