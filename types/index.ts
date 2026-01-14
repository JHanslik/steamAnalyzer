export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

export interface SteamPlayerData {
  steamid: string;
  games: SteamGame[];
  totalGames: number;
  totalPlaytime: number;
  accountAge?: number;
}

export interface ProcessedFeatures {
  totalPlaytime: number;
  averagePlaytime: number;
  totalGames: number;
  freeToPlayRatio: number;
  accountAge: number;
  dominantGenre: string;
  gameStyle: string;
  genreDistribution: Record<string, number>;
}

export interface PlayerStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
  trends: {
    topGenres: Array<{ genre: string; playtime: number }>;
    playtimeDistribution: Array<{ range: string; count: number }>;
  };
}

export interface ClassificationResult {
  type: 'Hardcore' | 'Casual';
  probability: number;
  threshold: number;
}

export interface ClusteringResult {
  cluster: number;
  clusterLabel: string;
  characteristics: string[];
}

export interface GameRecommendation {
  appid: number;
  name: string;
  reason: string;
  matchScore: number;
}

export interface AnalysisResult {
  playerData: SteamPlayerData;
  features: ProcessedFeatures;
  stats: PlayerStats;
  classification: ClassificationResult;
  clustering: ClusteringResult;
  recommendations: GameRecommendation[];
}
