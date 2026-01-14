# Structure du projet

## Vue d'ensemble

Ce projet est une application web full JavaScript pour analyser les profils Steam et proposer des recommandations de jeux personnalisées.

## Architecture

```
steamAnalyzer/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (backend)
│   │   ├── health/               # Health check endpoint
│   │   └── steam/                # Endpoints Steam
│   │       ├── analyze/          # Endpoint principal d'analyse
│   │       └── games/            # Endpoint pour récupérer les jeux
│   ├── globals.css               # Styles globaux
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Page d'accueil
│
├── components/                   # Composants React
│   ├── GenreChart.tsx            # Graphique en camembert des genres
│   ├── PlaytimeChart.tsx         # Graphique en barres du temps de jeu
│   ├── RecommendationsList.tsx   # Liste des recommandations
│   ├── StatsCard.tsx             # Carte de statistique
│   └── SteamIdForm.tsx           # Formulaire SteamID
│
├── lib/                          # Bibliothèques et services
│   └── services/
│       ├── analysisService.ts    # Service d'analyse statistique
│       ├── groqService.ts        # Service Groq (IA pour ML)
│       ├── mlService.ts          # Service Machine Learning
│       ├── preprocessingService.ts # Service de preprocessing
│       ├── recommendationService.ts # Service de recommandation
│       └── steamService.ts       # Service API Steam
│
├── types/                        # Types TypeScript
│   └── index.ts                  # Définitions de types
│
├── .eslintrc.json                # Configuration ESLint
├── .gitignore                    # Fichiers ignorés par Git
├── DEPLOYMENT.md                 # Guide de déploiement
├── env.example                   # Exemple de variables d'environnement
├── next.config.js                # Configuration Next.js
├── package.json                  # Dépendances npm
├── postcss.config.js             # Configuration PostCSS
├── README.md                     # Documentation principale
├── tailwind.config.ts            # Configuration Tailwind CSS
├── tsconfig.json                 # Configuration TypeScript
├── USAGE.md                      # Guide d'utilisation
└── vercel.json                   # Configuration Vercel
```

## Flux de données

1. **Utilisateur entre SteamID** → `SteamIdForm`
2. **Appel API** → `/api/steam/analyze`
3. **Récupération données** → `SteamService.getPlayerData()`
4. **Preprocessing** → `PreprocessingService.computeFeatures()`
5. **Analyse** → `AnalysisService.computeStats()`
6. **ML** → `MLService.classifyPlayer()` + `MLService.clusterPlayer()`
7. **Recommandations** → `RecommendationService.generateRecommendations()`
8. **Affichage** → Composants React avec visualisations

## Technologies utilisées

- **Frontend** : Next.js 14, React, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes
- **Data Science** : Calculs statistiques manuels
- **Machine Learning** : Groq (llama-3.3-70b-versatile) pour classification et clustering, avec fallback basique
- **Visualisation** : Plotly.js via react-plotly.js
- **API** : Steam Web API via axios, Groq API pour l'IA

## Points d'attention

- L'analyse ML utilise Groq si `GROQ_API_KEY` est configurée, sinon fallback vers logique basique
- L'API Steam a des limites de taux, gérer les erreurs appropriément
- Les genres sont récupérés via l'API Steam Store (peut être lent)
- Groq est gratuit avec un plan généreux, mais nécessite une clé API
