# Guide d'utilisation

## Obtenir votre SteamID

Pour utiliser l'application, vous devez fournir votre SteamID64. Voici comment l'obtenir :

### Méthode 1 : Via steamid.io
1. Allez sur https://steamid.io
2. Entrez votre nom d'utilisateur Steam ou URL de profil
3. Copiez le **SteamID64** (format : 76561198000000000)

### Méthode 2 : Via votre profil Steam
1. Ouvrez votre profil Steam dans le navigateur
2. L'URL ressemble à : `https://steamcommunity.com/profiles/76561198000000000`
3. Le nombre à la fin est votre SteamID64

### Méthode 3 : Via l'application Steam
1. Ouvrez Steam
2. Allez dans Paramètres > Interface
3. Cochez "Afficher l'adresse web quand c'est disponible"
4. Votre SteamID64 apparaîtra dans l'URL de votre profil

## Utilisation de l'application

1. **Lancer l'application**
   ```bash
   npm run dev
   ```
   L'application sera accessible sur http://localhost:3000

2. **Entrer votre SteamID**
   - Collez votre SteamID64 dans le champ prévu
   - Cliquez sur "Analyser mon profil"

3. **Consulter les résultats**
   - Statistiques principales (temps de jeu, nombre de jeux, etc.)
   - Graphiques interactifs (temps par jeu, répartition par genre)
   - Classification (Hardcore/Casual)
   - Clustering (style de jeu)
   - Recommandations personnalisées

## Notes importantes

- **Profil privé** : Si votre profil Steam est privé, l'API ne pourra pas récupérer vos données
- **Jeux sans temps** : Seuls les jeux avec du temps de jeu sont analysés
- **Temps de chargement** : L'analyse peut prendre quelques secondes selon le nombre de jeux

## Résolution de problèmes

### Erreur "Aucun jeu trouvé"
- Vérifiez que votre profil Steam est public
- Vérifiez que vous avez au moins un jeu avec du temps de jeu enregistré
- Vérifiez que votre SteamID est correct

### Erreur "Clé API Steam non configurée"
- Vérifiez que vous avez créé un fichier `.env.local`
- Vérifiez que la variable `STEAM_API_KEY` est définie
- Redémarrez le serveur de développement

### Les graphiques ne s'affichent pas
- Vérifiez que vous avez installé toutes les dépendances (`npm install`)
- Vérifiez la console du navigateur pour les erreurs
