# Guide de déploiement

## Déploiement sur Vercel

### Prérequis

- Compte Vercel
- Clé API Steam (obtenez-la sur https://steamcommunity.com/dev/apikey)

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

## Notes

- Le projet utilise Next.js 14 avec App Router
- Les API Routes sont dans `/app/api`
- Les calculs ML sont effectués côté serveur uniquement
- Assurez-vous que votre clé API Steam est valide et active
