import axios from 'axios';

const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_STORE_API = 'https://store.steampowered.com/api';

export class SteamService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Convertit un SteamID64 en SteamID32 si nécessaire
   */
  private normalizeSteamId(steamId: string): string {
    // Si c'est déjà un SteamID64, on le retourne tel quel
    if (steamId.length >= 17) {
      return steamId;
    }
    // Sinon, on essaie de le convertir (logique simplifiée)
    return steamId;
  }

  /**
   * Récupère la liste des jeux possédés par un joueur
   */
  async getOwnedGames(steamId: string): Promise<any[]> {
    try {
      const normalizedId = this.normalizeSteamId(steamId);
      
      const response = await axios.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/`, {
        params: {
          key: this.apiKey,
          steamid: normalizedId,
          include_appinfo: true,
          include_played_free_games: true,
          format: 'json'
        }
      });

      if (response.data?.response?.games) {
        // Filtrer les jeux sans temps de jeu
        return response.data.response.games.filter(
          (game: any) => game.playtime_forever > 0
        );
      }

      return [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des jeux:', error.message);
      throw new Error(`Impossible de récupérer les jeux: ${error.message}`);
    }
  }

  /**
   * Récupère les détails d'un jeu depuis le Steam Store API
   */
  async getGameDetails(appid: number): Promise<any> {
    try {
      const response = await axios.get(`${STEAM_STORE_API}/appdetails`, {
        params: {
          appids: appid,
          l: 'french'
        }
      });

      if (response.data && response.data[appid]?.success) {
        return response.data[appid].data;
      }

      return null;
    } catch (error: any) {
      console.error(`Erreur lors de la récupération des détails du jeu ${appid}:`, error.message);
      return null;
    }
  }

  /**
   * Récupère les informations du joueur
   */
  async getPlayerSummary(steamId: string): Promise<any> {
    try {
      const normalizedId = this.normalizeSteamId(steamId);
      
      const response = await axios.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/`, {
        params: {
          key: this.apiKey,
          steamids: normalizedId,
          format: 'json'
        }
      });

      if (response.data?.response?.players?.[0]) {
        return response.data.response.players[0];
      }

      return null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du profil:', error.message);
      return null;
    }
  }

  /**
   * Récupère toutes les données nécessaires pour l'analyse
   */
  async getPlayerData(steamId: string): Promise<any> {
    const [games, playerSummary] = await Promise.all([
      this.getOwnedGames(steamId),
      this.getPlayerSummary(steamId)
    ]);

    // Calculer l'âge du compte si possible
    let accountAge = 0;
    if (playerSummary?.timecreated) {
      const createdDate = new Date(playerSummary.timecreated * 1000);
      const now = new Date();
      accountAge = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const totalPlaytime = games.reduce((sum: number, game: any) => 
      sum + (game.playtime_forever || 0), 0
    );

    return {
      steamid: steamId,
      games,
      totalGames: games.length,
      totalPlaytime,
      accountAge,
      playerSummary
    };
  }
}
