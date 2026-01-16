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
    // Explication quartiles (détaillée)
    const quartilesExplanation = `Les quartiles divisent les données en 4 parties égales selon leur ordre croissant :
• Q1 (${Math.round(quartiles.q1)}h) : Premier quartile - 25% des jeux ont un temps de jeu inférieur à cette valeur
• Q2 (${Math.round(quartiles.q2)}h) : Deuxième quartile (médiane) - 50% des jeux sont en dessous, 50% au-dessus
• Q3 (${Math.round(quartiles.q3)}h) : Troisième quartile - 75% des jeux ont un temps de jeu inférieur à cette valeur
• IQR (${Math.round(quartiles.iqr)}h) : Écart interquartile (Q3 - Q1) - mesure la dispersion des 50% centraux des données, utile pour détecter les valeurs aberrantes. Plus l'IQR est grand, plus les données sont dispersées.`;

    // Explication CV (détaillée)
    const cvPercent = Math.round(cv * 100);
    let cvInterpretation = '';
    if (cv < 0.15) {
      cvInterpretation = 'Dispersion faible : les temps de jeu sont relativement homogènes';
    } else if (cv <= 0.35) {
      cvInterpretation = 'Dispersion modérée : variabilité acceptable dans les temps de jeu';
    } else {
      cvInterpretation = 'Dispersion forte : grande hétérogénéité dans les temps de jeu (certains jeux très joués, d\'autres peu)';
    }
    const cvExplanation = `Le coefficient de variation (CV = ${cvPercent}%) mesure la variabilité relative des données par rapport à la moyenne. Il permet de comparer la dispersion entre différents jeux, indépendamment de l'échelle. ${cvInterpretation}. Formule: CV = σ/μ où σ est l'écart-type et μ la moyenne.`;

    // Explication skewness (détaillée)
    let skewnessInterpretation = '';
    let skewnessVisual = '';
    if (skewness > 0.5) {
      skewnessInterpretation = 'Distribution asymétrique à droite (asymétrie positive) : la queue de la distribution s\'étend vers les valeurs élevées. Cela signifie que vous avez quelques jeux avec beaucoup de temps de jeu, mais la majorité des jeux ont peu de temps.';
      skewnessVisual = 'Graphiquement, la courbe est décalée vers la gauche avec une longue queue à droite.';
    } else if (skewness < -0.5) {
      skewnessInterpretation = 'Distribution asymétrique à gauche (asymétrie négative) : la queue s\'étend vers les valeurs faibles. Cela signifie que vous avez beaucoup de jeux avec peu de temps de jeu, et quelques jeux avec beaucoup de temps.';
      skewnessVisual = 'Graphiquement, la courbe est décalée vers la droite avec une longue queue à gauche.';
    } else {
      skewnessInterpretation = 'Distribution approximativement symétrique : les données sont équilibrées autour de la médiane.';
      skewnessVisual = 'Graphiquement, la courbe ressemble à une cloche centrée.';
    }
    const skewnessExplanation = `Le coefficient d'asymétrie (Skewness = ${skewness.toFixed(2)}) mesure l'asymétrie de la distribution des temps de jeu. 
• Skewness ≈ 0 : distribution symétrique (comme une courbe normale)
• Skewness > 0 : queue à droite (valeurs élevées plus fréquentes)
• Skewness < 0 : queue à gauche (valeurs faibles plus fréquentes)
${skewnessInterpretation} ${skewnessVisual}
Formule: Skewness = (n/(n-1)(n-2)) × Σ((x - μ)³) / σ³ où n est le nombre d'observations, μ la moyenne et σ l'écart-type.`;

    // Explication kurtosis (détaillée)
    let kurtosisInterpretation = '';
    let kurtosisVisual = '';
    if (kurtosis > 0.5) {
      kurtosisInterpretation = 'Distribution leptokurtique : la distribution a des pics plus pointus et des queues plus lourdes que la distribution normale. Cela indique que vous avez beaucoup de jeux avec des temps de jeu similaires (pic pointu) mais aussi quelques valeurs extrêmes (queues lourdes).';
      kurtosisVisual = 'Graphiquement, la courbe est plus pointue au centre et a des queues plus épaisses que la normale.';
    } else if (kurtosis < -0.5) {
      kurtosisInterpretation = 'Distribution platykurtique : la distribution est plus plate que la normale, avec des queues plus légères. Cela indique une grande variabilité dans les temps de jeu, sans valeurs extrêmes marquées.';
      kurtosisVisual = 'Graphiquement, la courbe est plus aplatie et étalée que la normale.';
    } else {
      kurtosisInterpretation = 'Distribution mésokurtique : la distribution ressemble à la distribution normale en termes d\'aplatissement.';
      kurtosisVisual = 'Graphiquement, la courbe a une forme similaire à la courbe normale.';
    }
    const kurtosisExplanation = `Le coefficient d'aplatissement (Kurtosis = ${kurtosis.toFixed(2)}) mesure l'aplatissement de la distribution et la présence de valeurs extrêmes.
• Kurtosis ≈ 0 : distribution mésokurtique (similaire à la normale)
• Kurtosis > 0 : distribution leptokurtique (plus pointue, queues plus lourdes)
• Kurtosis < 0 : distribution platykurtique (plus plate, queues plus légères)
${kurtosisInterpretation} ${kurtosisVisual}
Formule: Kurtosis = [n(n+1)/(n-1)(n-2)(n-3)] × Σ((x - μ)⁴) / σ⁴ - 3(n-1)²/(n-2)(n-3) où n est le nombre d'observations, μ la moyenne et σ l'écart-type. Le "-3" permet d'obtenir un kurtosis de 0 pour la distribution normale.`;

    // Explication corrélations (détaillée)
    let correlationsExplanation = 'Les corrélations de Pearson (r) mesurent la force et la direction de la relation linéaire entre deux variables. Le coefficient varie de -1 à +1 :\n';
    correlationsExplanation += '• r = +1 : corrélation positive parfaite (quand une variable augmente, l\'autre augmente proportionnellement)\n';
    correlationsExplanation += '• r = 0 : aucune corrélation linéaire\n';
    correlationsExplanation += '• r = -1 : corrélation négative parfaite (quand une variable augmente, l\'autre diminue)\n\n';
    
    if (correlations.playtimeVsPrice !== undefined) {
      const r1 = correlations.playtimeVsPrice;
      const direction = r1 > 0 ? 'positive' : 'négative';
      correlationsExplanation += `• Temps de jeu ↔ Prix: r = ${r1.toFixed(3)} (${this.interpretCorrelation(r1)}, ${direction})\n`;
      correlationsExplanation += `  Interprétation: ${r1 > 0 ? 'Les jeux plus chers tendent à être joués plus longtemps' : 'Les jeux moins chers tendent à être joués plus longtemps'}\n\n`;
    }
    if (correlations.playtimeVsRating !== undefined) {
      const r2 = correlations.playtimeVsRating;
      const direction = r2 > 0 ? 'positive' : 'négative';
      correlationsExplanation += `• Temps de jeu ↔ Notes: r = ${r2.toFixed(3)} (${this.interpretCorrelation(r2)}, ${direction})\n`;
      correlationsExplanation += `  Interprétation: ${r2 > 0 ? 'Les jeux mieux notés tendent à être joués plus longtemps' : 'Les jeux moins bien notés tendent à être joués plus longtemps'}\n\n`;
    }
    if (correlations.priceVsRating !== undefined) {
      const r3 = correlations.priceVsRating;
      const direction = r3 > 0 ? 'positive' : 'négative';
      correlationsExplanation += `• Prix ↔ Notes: r = ${r3.toFixed(3)} (${this.interpretCorrelation(r3)}, ${direction})\n`;
      correlationsExplanation += `  Interprétation: ${r3 > 0 ? 'Les jeux plus chers tendent à être mieux notés' : 'Les jeux moins chers tendent à être mieux notés'}\n\n`;
    }
    correlationsExplanation += 'Formule de Pearson: r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² × Σ(y - ȳ)²)\n';
    correlationsExplanation += 'Note: Une corrélation n\'implique pas une causalité. Deux variables peuvent être corrélées sans qu\'il y ait un lien de cause à effet direct.';

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
