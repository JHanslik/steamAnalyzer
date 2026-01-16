import { SteamGame, EnrichedGame } from '@/types';

export interface AdvancedStats {
  quartiles: {
    q1: number;
    q2: number; // médiane
    q3: number;
    iqr: number; // Interquartile Range
  };
  coefficientOfVariation: number;
  skewness: number;
  kurtosis: number;
  correlations: {
    playtimeVsPrice?: number;
    playtimeVsRating?: number;
    priceVsRating?: number;
  };
  explanations: {
    quartiles: string;
    coefficientOfVariation: string;
    skewness: string;
    kurtosis: string;
    correlations: string;
  };
}

export class AdvancedStatsService {
  /**
   * Calcule toutes les statistiques avancées
   */
  computeAdvancedStats(
    games: SteamGame[],
    enrichedGames: EnrichedGame[]
  ): AdvancedStats {
    const playtimes = games.map(g => (g.playtime_forever || 0) / 60); // en heures
    
    // Quartiles
    const quartiles = this.calculateQuartiles(playtimes);
    
    // Coefficient de variation
    const mean = this.calculateMean(playtimes);
    const std = this.calculateStd(playtimes, mean);
    const coefficientOfVariation = mean > 0 ? std / mean : 0;
    
    // Skewness (asymétrie)
    const skewness = this.calculateSkewness(playtimes, mean, std);
    
    // Kurtosis (aplatissement)
    const kurtosis = this.calculateKurtosis(playtimes, mean, std);
    
    // Corrélations (si données enrichies disponibles)
    const correlations = this.calculateCorrelations(enrichedGames);
    
    // Explications pédagogiques
    const explanations = this.generateExplanations(
      quartiles,
      coefficientOfVariation,
      skewness,
      kurtosis,
      correlations
    );

    return {
      quartiles,
      coefficientOfVariation,
      skewness,
      kurtosis,
      correlations,
      explanations,
    };
  }

  /**
   * Calcule les quartiles (Q1, Q2=médiane, Q3) et l'IQR
   */
  private calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number; iqr: number } {
    if (values.length === 0) {
      return { q1: 0, q2: 0, q3: 0, iqr: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    // Q2 = Médiane
    const q2 = this.calculateMedian(sorted);

    // Q1 = Médiane de la première moitié
    const lowerHalf = sorted.slice(0, Math.floor(n / 2));
    const q1 = this.calculateMedian(lowerHalf);

    // Q3 = Médiane de la seconde moitié
    const upperHalf = sorted.slice(Math.ceil(n / 2));
    const q3 = this.calculateMedian(upperHalf);

    // IQR = Q3 - Q1
    const iqr = q3 - q1;

    return { q1, q2, q3, iqr };
  }

  /**
   * Calcule le coefficient de variation (CV = σ/μ)
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStd(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calcule la médiane
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calcule le coefficient d'asymétrie (Skewness)
   * Formule: (1/n) * Σ((x - μ)³) / σ³
   */
  private calculateSkewness(values: number[], mean: number, std: number): number {
    if (values.length === 0 || std === 0) return 0;
    
    const n = values.length;
    const sumCubed = values.reduce((sum, val) => {
      const diff = val - mean;
      return sum + Math.pow(diff, 3);
    }, 0);
    
    return (n / ((n - 1) * (n - 2))) * (sumCubed / Math.pow(std, 3));
  }

  /**
   * Calcule le coefficient d'aplatissement (Kurtosis)
   * Formule: (1/n) * Σ((x - μ)⁴) / σ⁴ - 3 (kurtosis excess)
   */
  private calculateKurtosis(values: number[], mean: number, std: number): number {
    if (values.length === 0 || std === 0) return 0;
    
    const n = values.length;
    const sumFourth = values.reduce((sum, val) => {
      const diff = val - mean;
      return sum + Math.pow(diff, 4);
    }, 0);
    
    const kurtosis = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * 
                     (sumFourth / Math.pow(std, 4)) - 
                     (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)));
    
    return kurtosis;
  }

  /**
   * Calcule les corrélations de Pearson entre variables
   */
  private calculateCorrelations(enrichedGames: EnrichedGame[]): {
    playtimeVsPrice?: number;
    playtimeVsRating?: number;
    priceVsRating?: number;
  } {
    const correlations: {
      playtimeVsPrice?: number;
      playtimeVsRating?: number;
      priceVsRating?: number;
    } = {};

    // Filtrer les jeux avec données complètes
    const validGames = enrichedGames.filter(g => 
      g.playtime_forever > 0 &&
      g.price?.final !== undefined &&
      g.rating_ratio !== undefined
    );

    if (validGames.length < 3) {
      return correlations; // Pas assez de données
    }

    // Préparer les données
    const playtimes = validGames.map(g => (g.playtime_forever || 0) / 60);
    const prices = validGames.map(g => (g.price?.final || 0) / 100);
    const ratings = validGames.map(g => (g.rating_ratio || 0) * 100);

    // Corrélation Playtime vs Price
    correlations.playtimeVsPrice = this.calculatePearsonCorrelation(playtimes, prices);

    // Corrélation Playtime vs Rating
    correlations.playtimeVsRating = this.calculatePearsonCorrelation(playtimes, ratings);

    // Corrélation Price vs Rating
    correlations.priceVsRating = this.calculatePearsonCorrelation(prices, ratings);

    return correlations;
  }

  /**
   * Calcule le coefficient de corrélation de Pearson
   * Formule: r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² * Σ(y - ȳ)²)
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < x.length; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      numerator += diffX * diffY;
      sumSqX += diffX * diffX;
      sumSqY += diffY * diffY;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);
    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Génère les explications pédagogiques des calculs
   */
  private generateExplanations(
    quartiles: { q1: number; q2: number; q3: number; iqr: number },
    cv: number,
    skewness: number,
    kurtosis: number,
    correlations: { playtimeVsPrice?: number; playtimeVsRating?: number; priceVsRating?: number }
  ): {
    quartiles: string;
    coefficientOfVariation: string;
    skewness: string;
    kurtosis: string;
    correlations: string;
  } {
    // Explication quartiles
    const quartilesExplanation = `Les quartiles divisent les données en 4 parties égales. Q1 (${Math.round(quartiles.q1)}h) = 25% des jeux ont moins de temps, Q2 (${Math.round(quartiles.q2)}h) = médiane (50%), Q3 (${Math.round(quartiles.q3)}h) = 75%. L'IQR (${Math.round(quartiles.iqr)}h) mesure la dispersion des 50% centraux des données.`;

    // Explication CV
    const cvPercent = Math.round(cv * 100);
    const cvExplanation = `Le coefficient de variation (CV = ${cvPercent}%) mesure la variabilité relative. CV < 15% = faible dispersion, CV > 35% = forte dispersion. Formule: CV = σ/μ (écart-type / moyenne).`;

    // Explication skewness
    let skewnessInterpretation = '';
    if (skewness > 0.5) {
      skewnessInterpretation = 'Distribution asymétrique à droite (queue longue vers les valeurs élevées)';
    } else if (skewness < -0.5) {
      skewnessInterpretation = 'Distribution asymétrique à gauche (queue longue vers les valeurs faibles)';
    } else {
      skewnessInterpretation = 'Distribution approximativement symétrique';
    }
    const skewnessExplanation = `Le coefficient d'asymétrie (Skewness = ${skewness.toFixed(2)}) mesure l'asymétrie de la distribution. ${skewnessInterpretation}. Formule: (1/n) × Σ((x - μ)³) / σ³.`;

    // Explication kurtosis
    let kurtosisInterpretation = '';
    if (kurtosis > 0.5) {
      kurtosisInterpretation = 'Distribution leptokurtique (pics plus pointus, queues plus lourdes que la normale)';
    } else if (kurtosis < -0.5) {
      kurtosisInterpretation = 'Distribution platykurtique (pics plus plats, queues plus légères que la normale)';
    } else {
      kurtosisInterpretation = 'Distribution mésokurtique (similaire à la distribution normale)';
    }
    const kurtosisExplanation = `Le coefficient d'aplatissement (Kurtosis = ${kurtosis.toFixed(2)}) mesure l'aplatissement de la distribution. ${kurtosisInterpretation}. Formule: (1/n) × Σ((x - μ)⁴) / σ⁴ - 3.`;

    // Explication corrélations
    let correlationsExplanation = 'Corrélations de Pearson (r) mesurant la relation linéaire entre variables (-1 à +1):\n';
    if (correlations.playtimeVsPrice !== undefined) {
      const r1 = correlations.playtimeVsPrice;
      correlationsExplanation += `• Temps de jeu vs Prix: r = ${r1.toFixed(3)}. ${this.interpretCorrelation(r1)}\n`;
    }
    if (correlations.playtimeVsRating !== undefined) {
      const r2 = correlations.playtimeVsRating;
      correlationsExplanation += `• Temps de jeu vs Notes: r = ${r2.toFixed(3)}. ${this.interpretCorrelation(r2)}\n`;
    }
    if (correlations.priceVsRating !== undefined) {
      const r3 = correlations.priceVsRating;
      correlationsExplanation += `• Prix vs Notes: r = ${r3.toFixed(3)}. ${this.interpretCorrelation(r3)}\n`;
    }
    correlationsExplanation += 'Formule: r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² × Σ(y - ȳ)²)';

    return {
      quartiles: quartilesExplanation,
      coefficientOfVariation: cvExplanation,
      skewness: skewnessExplanation,
      kurtosis: kurtosisExplanation,
      correlations: correlationsExplanation,
    };
  }

  /**
   * Interprète une corrélation
   */
  private interpretCorrelation(r: number): string {
    const absR = Math.abs(r);
    if (absR < 0.1) return 'Corrélation négligeable';
    if (absR < 0.3) return 'Corrélation faible';
    if (absR < 0.5) return 'Corrélation modérée';
    if (absR < 0.7) return 'Corrélation forte';
    return 'Corrélation très forte';
  }
}
