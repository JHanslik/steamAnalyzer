import { NextRequest, NextResponse } from 'next/server';
import { SteamService } from '@/lib/services/steamService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const steamId = searchParams.get('steamId');

    if (!steamId) {
      return NextResponse.json(
        { error: 'SteamID requis' },
        { status: 400 }
      );
    }

    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Steam non configurée' },
        { status: 500 }
      );
    }

    const steamService = new SteamService(apiKey);
    const games = await steamService.getOwnedGames(steamId);

    return NextResponse.json({ games });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des jeux:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des jeux' },
      { status: 500 }
    );
  }
}
