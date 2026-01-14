import axios from 'axios';
import { ClassificationResult, ClusteringResult, ProcessedFeatures, SteamGame } from '@/types';

export class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyse le profil d'un joueur avec Groq pour classification et clustering
   */
  async analyzePlayer(
    games: SteamGame[],
    features: ProcessedFeatures,
    totalPlaytime: number
  ): Promise<{ classification: ClassificationResult; clustering: ClusteringResult }> {
    try {
      // Préparer le contexte pour Groq
      const topGames = games
        .sort((a, b) => (b.playtime_forever || 0) - (a.playtime_forever || 0))
        .slice(0, 15)
        .map(g => `${g.name} (${Math.round((g.playtime_forever || 0) / 60)}h)`)
        .join(', ');

      const prompt = `Tu es un expert en analyse de profils de joueurs Steam. Analyse ce profil et réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.

Profil du joueur:
- Temps de jeu total: ${Math.round(totalPlaytime / 60)} heures
- Nombre de jeux: ${features.totalGames}
- Temps moyen par jeu: ${Math.round(features.averagePlaytime / 60)} heures
- Genre dominant: ${features.dominantGenre}
- Style de jeu: ${features.gameStyle}
- Ancienneté du compte: ${features.accountAge} jours
- Top jeux joués: ${topGames}

Réponds avec un JSON dans ce format exact:
{
  "classification": {
    "type": "Hardcore" ou "Casual",
    "probability": nombre entre 0 et 1,
    "threshold": 500
  },
  "clustering": {
    "cluster": 0, 1, 2 ou 3,
    "clusterLabel": "Explorateur", "Casual", "Hardcore" ou "Spécialisé",
    "characteristics": ["caractéristique 1", "caractéristique 2", ...]
  }
}

Critères:
- Hardcore: temps total élevé (>500h), jeux approfondis, engagement fort
- Casual: temps modéré, jeux variés, engagement occasionnel
- Explorateur: beaucoup de jeux différents, temps par jeu faible
- Spécialisé: focus sur un genre/style, temps élevé sur quelques jeux
- Les caractéristiques doivent être en français et pertinentes (2-4 max)`;

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en analyse de profils de joueurs. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
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

      // Parser la réponse JSON (peut contenir du markdown ou du texte avant/après)
      let parsed;
      try {
        // Essayer de parser directement
        parsed = JSON.parse(content);
      } catch (e) {
        // Si échec, essayer d'extraire le JSON du texte
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Impossible de parser la réponse JSON de Groq');
        }
      }

      const modelName = 'llama-3.3-70b-versatile';

      // Valider et formater la réponse
      const classification: ClassificationResult = {
        type: parsed.classification?.type === 'Hardcore' ? 'Hardcore' : 'Casual',
        probability: Math.max(0, Math.min(1, parsed.classification?.probability || 0.5)),
        threshold: parsed.classification?.threshold || 500,
        usingGroq: true,
        model: modelName
      };

      const clustering: ClusteringResult = {
        cluster: Math.max(0, Math.min(3, parsed.clustering?.cluster || 0)),
        clusterLabel: parsed.clustering?.clusterLabel || 'Casual',
        characteristics: Array.isArray(parsed.clustering?.characteristics)
          ? parsed.clustering.characteristics.slice(0, 4)
          : ['Profil équilibré'],
        usingGroq: true,
        model: modelName
      };

      return { classification, clustering };

    } catch (error: any) {
      console.error('Erreur Groq:', error.response?.data || error.message);
      
      // Fallback vers la logique basique en cas d'erreur
      return this.fallbackAnalysis(features, totalPlaytime);
    }
  }

  /**
   * Fallback vers une logique basique si Groq échoue
   */
  private fallbackAnalysis(
    features: ProcessedFeatures,
    totalPlaytime: number
  ): { classification: ClassificationResult; clustering: ClusteringResult } {
    const threshold = 500;
    const hours = totalPlaytime / 60;
    const probability = Math.min(0.95, Math.max(0.05, hours / 1000));

    const classification: ClassificationResult = {
      type: hours > threshold ? 'Hardcore' : 'Casual',
      probability,
      threshold,
      usingGroq: false
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

    if (features.averagePlaytime > 100) {
      characteristics.push('Jeux approfondis');
    }

    if (characteristics.length === 0) {
      characteristics.push('Profil équilibré');
    }

    const clustering: ClusteringResult = {
      cluster,
      clusterLabel,
      characteristics,
      usingGroq: false
    };

    return { classification, clustering };
  }
}
