# Steam Player Analysis & Game Recommendation

Application web full JavaScript pour analyser le comportement des joueurs Steam, produire des statistiques détaillées, effectuer du Machine Learning (classification et clustering) et proposer des recommandations de jeux personnalisées.

## 🚀 Technologies

- **Frontend**: Next.js 14 (React, TypeScript, Tailwind CSS)
- **Backend**: Next.js API Routes (Node.js)
- **Data Science**: Calculs statistiques manuels (moyenne, médiane, écart-type)
- **Machine Learning**: ml-kmeans (clustering), fonction sigmoïde (classification)
- **Visualisation**: Plotly.js via react-plotly.js
- **Déploiement**: Vercel/Railway

## 📋 Prérequis

- Node.js 18+ 
- Clé API Steam (obtenez-la sur https://steamcommunity.com/dev/apikey)

## 🛠️ Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp env.example .env.local
```

Puis éditez `.env.local` et ajoutez votre clé API Steam :
```
STEAM_API_KEY=your_steam_api_key_here
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 📁 Structure du projet

Voir [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) pour une description détaillée.

Structure principale :
- `app/` : Pages et API Routes Next.js
- `components/` : Composants React réutilisables
- `lib/services/` : Services backend (Steam, ML, analyse, recommandations)
- `types/` : Définitions TypeScript

## 🎯 Fonctionnalités

1. **Analyse de profil Steam** : Récupération et analyse des jeux possédés
2. **Statistiques descriptives** : Moyenne, médiane, tendances
3. **Classification** : Détection Hardcore/Casual
4. **Clustering** : Regroupement par style de jeu
5. **Recommandations** : Suggestions de jeux personnalisées
6. **Visualisations** : Graphiques interactifs

## 📝 Notes

- Le projet utilise uniquement JavaScript/TypeScript
- Aucune dépendance Python ou R
- Pipeline Data Science complet en JS
- Les calculs ML sont simplifiés pour la démonstration
- En production, un dataset d'entraînement améliorerait les modèles

## 📚 Documentation supplémentaire

- [Guide d'utilisation](./USAGE.md) : Comment utiliser l'application
- [Guide de déploiement](./DEPLOYMENT.md) : Instructions pour déployer
- [Structure du projet](./PROJECT_STRUCTURE.md) : Architecture détaillée
