# Guide de déploiement

## Déploiement sur Vercel

### Prérequis

- Compte Vercel
- Clé API Steam (obtenez-la sur https://steamcommunity.com/dev/apikey)
- Clé API Groq (optionnel, obtenez-la sur https://console.groq.com/) - pour une meilleure analyse ML

### Étapes

1. **Préparer le projet**

   ```bash
   npm install
   npm run build
   ```

2. **Déployer sur Vercel**

   - Connectez votre repository GitHub/GitLab à Vercel
   - Ou utilisez la CLI Vercel :
     ```bash
     npm i -g vercel
     vercel
     ```

3. **Configurer les variables d'environnement**

   - Dans le dashboard Vercel, allez dans Settings > Environment Variables
   - Si la variable `STEAM_API_KEY` existe déjà :
     * Cliquez sur la variable existante pour la modifier
     * Mettez à jour la valeur avec votre clé API Steam
     * Cliquez sur "Save"
   - Si la variable n'existe pas :
     * Cliquez sur "Add New"
     * Ajoutez : `STEAM_API_KEY` avec votre clé API Steam
     * Sélectionnez les environnements (Production, Preview, Development)
     * Cliquez sur "Save"
   - **Optionnel** : Ajoutez `GROQ_API_KEY` pour utiliser Groq (llama-3.3-70b-versatile) au lieu de la logique basique

4. **Redéployer**
   - Vercel redéploiera automatiquement avec les nouvelles variables

## Déploiement sur Railway

### Prérequis

- Compte Railway
- Clé API Steam

### Étapes

1. **Créer un nouveau projet**

   - Connectez votre repository GitHub
   - Railway détectera automatiquement Next.js

2. **Configurer les variables d'environnement**

   - Dans Variables, ajoutez : `STEAM_API_KEY`

3. **Déployer**
   - Railway déploiera automatiquement

## Variables d'environnement requises

- `STEAM_API_KEY` : Votre clé API Steam (obligatoire)
- `GROQ_API_KEY` : Votre clé API Groq (optionnel) - Si non fournie, l'application utilisera une logique basique en fallback

## Notes

- Le projet utilise Next.js 14 avec App Router
- Les API Routes sont dans `/app/api`
- L'analyse ML utilise Groq (llama-3.3-70b-versatile) si `GROQ_API_KEY` est configurée, sinon fallback vers logique basique
- Les calculs ML sont effectués côté serveur uniquement
- Assurez-vous que votre clé API Steam est valide et active
