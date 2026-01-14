import { SteamGame, PlayerStats, ProcessedFeatures } from '@/types';

export class AnalysisService {
  /**
   * Calcule les statistiques descriptives
   */
  computeStats(games: SteamGame[], features: ProcessedFeatures): PlayerStats {
    const playtimes = games.map(g => g.playtime_forever || 0);
    
    // Calculs statistiques manuels
    const mean = this.calculateMean(playtimes);
    const median = this.calculateMedian(playtimes);
    const min = Math.min(...playtimes);
    const max = Math.max(...playtimes);
    const std = this.calculateStd(playtimes, mean);

    // Identifier les tendances
    const topGenres = this.getTopGenres(features.genreDistribution);
    const playtimeDistribution = this.getPlaytimeDistribution(playtimes);

    return {
      mean: mean || 0,
      median: median || 0,
      min: min || 0,
      max: max || 0,
      std: std || 0,
      trends: {
        topGenres,
        playtimeDistribution
      }
    };
  }

  /**
   * Extrait les genres les plus joués
   */
  private getTopGenres(genreDistribution: Record<string, number>): Array<{ genre: string; playtime: number }> {
    return Object.entries(genreDistribution)
      .map(([genre, playtime]) => ({ genre, playtime }))
      .sort((a, b) => b.playtime - a.playtime)
      .slice(0, 5);
  }

  /**
   * Calcule la répartition du temps de jeu
   */
  private getPlaytimeDistribution(playtimes: number[]): Array<{ range: string; count: number }> {
    const ranges = [
      { label: '0-10h', min: 0, max: 10 },
      { label: '10-50h', min: 10, max: 50 },
      { label: '50-100h', min: 50, max: 100 },
      { label: '100-500h', min: 100, max: 500 },
      { label: '500h+', min: 500, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: playtimes.filter(pt => pt >= range.min && pt < range.max).length
    }));
  }

  /**
   * Calcule la moyenne
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
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
   * Calcule l'écart-type
   */
  private calculateStd(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
