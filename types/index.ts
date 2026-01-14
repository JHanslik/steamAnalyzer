export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

export interface EnrichedGame extends SteamGame {
  // Données enrichies depuis Steam Store
  price?: {
    initial?: number;
    final?: number;
    currency?: string;
    discount_percent?: number;
  };
  release_date?: string;
  positive_ratings?: number;
  negative_ratings?: number;
  total_ratings?: number;
  rating_ratio?: number; // positive / total
  genres?: string[];
  categories?: string[];
  achievements?: {
    total?: number;
    unlocked?: number;
  };
  current_players?: number;
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
  type: "Hardcore" | "Casual";
  probability: number;
  threshold: number;
  usingGroq?: boolean;
  model?: string;
}

export interface ClusteringResult {
  cluster: number;
  clusterLabel: string;
  characteristics: string[];
  usingGroq?: boolean;
  model?: string;
}

export interface GameRecommendation {
  appid: number;
  name: string;
  reason: string;
  matchScore: number;
}

export interface SuccessFactor {
  name: string;
  importance: number; // 0-1
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface GamePrediction {
  appid: number;
  gameName: string;
  willSucceed: boolean;
  probability: number; // 0-1
  factors: SuccessFactor[];
  explanation: string;
  usingGroq?: boolean;
  model?: string;
}

export interface SuccessFactorsAnalysis {
  topFactors: SuccessFactor[];
  summary: string;
  usingGroq?: boolean;
  model?: string;
}

export interface AnalysisResult {
  playerData: SteamPlayerData;
  features: ProcessedFeatures;
  stats: PlayerStats;
  classification: ClassificationResult;
  clustering: ClusteringResult;
  recommendations: GameRecommendation[];
  successFactors?: SuccessFactorsAnalysis;
  gamePredictions?: GamePrediction[];
}
