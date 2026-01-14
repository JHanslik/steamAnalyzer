import { ClassificationResult, ClusteringResult, ProcessedFeatures, SteamGame } from '@/types';
import { GroqService } from './groqService';

export class MLService {
  private groqService: GroqService | null = null;

  constructor() {
    // Initialiser Groq si la clé API est disponible
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      this.groqService = new GroqService(groqApiKey);
    }
  }

  /**
   * Classification : Hardcore vs Casual
   * Utilise Groq si disponible, sinon fallback vers logique basique
   */
  async classifyPlayer(
    features: number[],
    totalPlaytime: number,
    games?: SteamGame[],
    processedFeatures?: ProcessedFeatures
  ): Promise<ClassificationResult> {
    // Si Groq est disponible et qu'on a les données nécessaires, l'utiliser
    if (this.groqService && games && processedFeatures) {
      try {
        const result = await this.groqService.analyzePlayer(games, processedFeatures, totalPlaytime);
        return result.classification;
      } catch (error) {
        console.error('Erreur Groq, fallback:', error);
        // Fallback vers logique basique
      }
    }

    // Fallback : logique basique
    return this.basicClassifyPlayer(features, totalPlaytime);
  }

  /**
   * Clustering pour regrouper les joueurs
   * Utilise Groq si disponible, sinon fallback vers logique basique
   */
  async clusterPlayer(
    features: number[],
    games?: SteamGame[],
    processedFeatures?: ProcessedFeatures
  ): Promise<ClusteringResult> {
    // Si Groq est disponible et qu'on a les données nécessaires, l'utiliser
    if (this.groqService && games && processedFeatures) {
      try {
        const totalPlaytime = games.reduce((sum, g) => sum + (g.playtime_forever || 0), 0);
        const result = await this.groqService.analyzePlayer(games, processedFeatures, totalPlaytime);
        return result.clustering;
      } catch (error) {
        console.error('Erreur Groq, fallback:', error);
        // Fallback vers logique basique
      }
    }

    // Fallback : logique basique
    return this.basicClusterPlayer(features);
  }

  /**
   * Classification basique (fallback)
   */
  private basicClassifyPlayer(features: number[], totalPlaytime: number): ClassificationResult {
    const threshold = 500;
    const hours = totalPlaytime / 60;
    const probability = Math.min(0.95, Math.max(0.05, hours / 1000));

    return {
      type: hours > threshold ? 'Hardcore' : 'Casual',
      probability,
      threshold,
      usingGroq: false
    };
  }

  /**
   * Clustering basique (fallback)
   */
  private basicClusterPlayer(features: number[]): ClusteringResult {
    const hours = (features[0] || 0) / 60;
    const totalGames = features[2] || 0;
    const genreCount = Object.keys({}).length; // Approximatif

    let clusterLabel = 'Casual';
    let cluster = 1;
    const characteristics: string[] = [];

    if (hours > 1000) {
      clusterLabel = 'Hardcore';
      cluster = 2;
      characteristics.push('Temps de jeu très élevé');
    } else if (totalGames > 100) {
      clusterLabel = 'Explorateur';
      cluster = 0;
      characteristics.push('Grand collectionneur');
    } else if (genreCount < 3) {
      clusterLabel = 'Spécialisé';
      cluster = 3;
      characteristics.push('Focus sur un genre');
    }

    if (characteristics.length === 0) {
      characteristics.push('Profil équilibré');
    }

    return {
      cluster,
      clusterLabel,
      characteristics,
      usingGroq: false
    };
  }

}
