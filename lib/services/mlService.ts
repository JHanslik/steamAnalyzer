import { ClassificationResult, ClusteringResult } from '@/types';

/**
 * Implémentation simple de KMeans pour le clustering
 */
function simpleKMeans(data: number[][], k: number, maxIterations: number = 100): { clusters: number[], centroids: number[][] } {
  if (data.length === 0) {
    return { clusters: [], centroids: [] };
  }

  // Initialiser les centroïdes de manière aléatoire
  const centroids: number[][] = [];
  const dimension = data[0].length;
  
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * data.length);
    centroids.push([...data[randomIndex]]);
  }

  let clusters: number[] = [];
  let iterations = 0;

  while (iterations < maxIterations) {
    // Assigner chaque point au cluster le plus proche
    const newClusters: number[] = data.map(point => {
      let minDistance = Infinity;
      let closestCluster = 0;

      centroids.forEach((centroid, idx) => {
        const distance = point.reduce((sum, val, i) => {
          return sum + Math.pow(val - centroid[i], 2);
        }, 0);

        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = idx;
        }
      });

      return closestCluster;
    });

    // Vérifier la convergence
    let converged = true;
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i] !== newClusters[i]) {
        converged = false;
        break;
      }
    }

    if (converged) break;

    clusters = newClusters;

    // Mettre à jour les centroïdes
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, idx) => clusters[idx] === i);
      
      if (clusterPoints.length > 0) {
        centroids[i] = clusterPoints[0].map((_, dim) => {
          return clusterPoints.reduce((sum, point) => sum + point[dim], 0) / clusterPoints.length;
        });
      }
    }

    iterations++;
  }

  return { clusters, centroids };
}

export class MLService {
  /**
   * Classification : Hardcore vs Casual
   * Utilise une fonction sigmoïde pour simuler une régression logistique
   */
  classifyPlayer(features: number[], totalPlaytime: number): ClassificationResult {
    // Seuil pour déterminer Hardcore (500h total minimum)
    const threshold = 500;

    // Features normalisées pour la classification
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Score basé sur les features principales (simulation de régression logistique)
    const score = this.calculateHardcoreScore(normalizedFeatures, totalPlaytime);
    
    // Fonction sigmoïde pour obtenir une probabilité entre 0 et 1
    const finalProbability = 1 / (1 + Math.exp(-score));

    return {
      type: finalProbability > 0.5 ? 'Hardcore' : 'Casual',
      probability: finalProbability,
      threshold
    };
  }

  /**
   * Clustering KMeans pour regrouper les joueurs
   */
  clusterPlayer(features: number[]): ClusteringResult {
    // Normaliser les features
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Créer un dataset avec le joueur et des centroïdes de référence
    // Pour un vrai système, on aurait un dataset de joueurs historiques
    const dataset = this.createReferenceDataset(normalizedFeatures);
    
    // Appliquer KMeans
    const k = 4; // 4 clusters
    const result = simpleKMeans(dataset, k);
    
    // Le cluster du joueur est le premier élément
    const playerCluster = result.clusters[0];
    
    // Déterminer les caractéristiques du cluster
    const characteristics = this.getClusterCharacteristics(playerCluster, normalizedFeatures);
    const clusterLabel = this.getClusterLabel(playerCluster);

    return {
      cluster: playerCluster,
      clusterLabel,
      characteristics
    };
  }

  /**
   * Normalise les features entre 0 et 1
   */
  private normalizeFeatures(features: number[]): number[] {
    // Normalisation min-max simplifiée
    // En production, on utiliserait les stats du dataset d'entraînement
    const maxValues = [10000, 500, 1000, 1, 5000, 9, 4]; // Max estimés
    return features.map((val, idx) => {
      const max = maxValues[idx] || 1;
      return Math.min(val / max, 1);
    });
  }

  /**
   * Calcule un score Hardcore basé sur les features
   */
  private calculateHardcoreScore(features: number[], totalPlaytime: number): number {
    // Poids pour chaque feature
    const weights = [0.3, 0.2, 0.1, -0.1, 0.1, 0.1, 0.1];
    let score = 0;
    
    features.forEach((feature, idx) => {
      score += feature * (weights[idx] || 0);
    });
    
    // Ajouter un biais basé sur le temps total
    score += (totalPlaytime / 1000) * 0.5;
    
    return score;
  }

  /**
   * Crée un dataset de référence pour le clustering
   */
  private createReferenceDataset(playerFeatures: number[]): number[][] {
    // Créer des points de référence représentant différents types de joueurs
    const referencePoints = [
      playerFeatures, // Le joueur actuel
      [0.1, 0.1, 0.1, 0.8, 0.2, 8, 0], // Casual
      [0.8, 0.6, 0.5, 0.1, 0.8, 0, 1], // Hardcore Action
      [0.6, 0.4, 0.3, 0.2, 0.6, 2, 2], // RPG Player
      [0.4, 0.3, 0.4, 0.3, 0.5, 3, 3], // Strategy Player
      [0.2, 0.2, 0.6, 0.5, 0.3, 7, 0], // Indie Explorer
    ];
    
    return referencePoints;
  }

  /**
   * Détermine les caractéristiques d'un cluster
   */
  private getClusterCharacteristics(cluster: number, features: number[]): string[] {
    const characteristics: string[] = [];
    
    if (features[0] > 0.5) characteristics.push('Temps de jeu élevé');
    if (features[1] > 0.5) characteristics.push('Jeux approfondis');
    if (features[2] > 0.3) characteristics.push('Collectionneur');
    if (features[3] > 0.5) characteristics.push('Préfère les jeux gratuits');
    if (features[4] > 0.5) characteristics.push('Compte ancien');
    
    if (characteristics.length === 0) {
      characteristics.push('Profil équilibré');
    }
    
    return characteristics;
  }

  /**
   * Donne un label au cluster
   */
  private getClusterLabel(cluster: number): string {
    const labels = [
      'Explorateur',
      'Casual',
      'Hardcore',
      'Spécialisé'
    ];
    
    return labels[cluster] || 'Inconnu';
  }
}
