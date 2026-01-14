import { AnalysisResult } from '@/types';

interface CacheEntry {
  data: Partial<AnalysisResult>;
  timestamp: number;
  steamId: string;
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

  /**
   * Génère une clé de cache basée sur le SteamID
   */
  private getCacheKey(steamId: string, type: 'full' | 'groq' = 'full'): string {
    return `${type}:${steamId}`;
  }

  /**
   * Vérifie si une entrée existe et est valide
   */
  get(steamId: string, type: 'full' | 'groq' = 'full'): Partial<AnalysisResult> | null {
    const key = this.getCacheKey(steamId, type);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Stocke une entrée dans le cache
   */
  set(steamId: string, data: Partial<AnalysisResult>, type: 'full' | 'groq' = 'full'): void {
    const key = this.getCacheKey(steamId, type);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      steamId,
    });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(steamId: string, type: 'full' | 'groq' = 'full'): void {
    const key = this.getCacheKey(steamId, type);
    this.cache.delete(key);
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retourne la taille du cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Instance singleton
export const cacheService = new CacheService();

// Nettoyage automatique toutes les heures
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cacheService.cleanup();
  }, 60 * 60 * 1000); // Toutes les heures
}
