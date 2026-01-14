# Résolution des problèmes de déploiement Vercel

## Problèmes courants et solutions

### 1. Le déploiement ne démarre pas

**Vérifications :**
- ✅ Le repository GitHub est bien connecté à Vercel
- ✅ La branche `main` est bien sélectionnée
- ✅ Le framework est détecté comme "Next.js"

**Solution :**
1. Allez dans Settings > Git
2. Vérifiez que le repository est connecté
3. Si nécessaire, reconnectez le repository

### 2. Erreur de build

**Vérifications :**
- ✅ Testez le build localement : `npm run build`
- ✅ Vérifiez les logs de build dans Vercel

**Solutions courantes :**

#### Erreur : "Module not found"
```bash
# Vérifiez que toutes les dépendances sont dans package.json
npm install
npm run build
```

#### Erreur : "Environment variable not found"
- Vérifiez que `STEAM_API_KEY` est bien configurée dans Vercel
- Vérifiez qu'elle est disponible pour Production, Preview et Development

#### Erreur : "TypeScript errors"
```bash
# Vérifiez les erreurs TypeScript localement
npm run build
```

### 3. L'application ne fonctionne pas après le déploiement

**Vérifications :**
- ✅ Les variables d'environnement sont bien configurées
- ✅ Le build s'est terminé sans erreur
- ✅ Les logs de déploiement ne montrent pas d'erreurs

**Solution :**
1. Allez dans le dashboard Vercel > Deployments
2. Cliquez sur le dernier déploiement
3. Vérifiez les logs de build et de runtime
4. Testez l'endpoint `/api/health` pour vérifier que l'API fonctionne

### 4. Redéploiement manuel

Si le déploiement automatique ne fonctionne pas :

1. Allez dans le dashboard Vercel
2. Cliquez sur "Deployments"
3. Cliquez sur les trois points (⋯) du dernier déploiement
4. Sélectionnez "Redeploy"

### 5. Forcer un nouveau déploiement

```bash
# Créez un commit vide pour forcer un nouveau déploiement
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

### 6. Vérifier la configuration

**Fichiers importants :**
- `package.json` : doit contenir les scripts `build` et `start`
- `next.config.js` : configuration Next.js
- `.gitignore` : doit exclure `.env.local` et `node_modules`
- `vercel.json` : configuration Vercel (optionnel)

### 7. Logs de débogage

Pour voir les logs en temps réel :
1. Allez dans Vercel > Votre projet > Deployments
2. Cliquez sur un déploiement
3. Consultez les onglets "Build Logs" et "Function Logs"

### 8. Test local avant déploiement

```bash
# Installer les dépendances
npm install

# Tester le build
npm run build

# Tester en production locale
npm start
```

Si tout fonctionne localement mais pas sur Vercel, vérifiez :
- Les variables d'environnement
- La version de Node.js (Vercel utilise Node 18 par défaut)
- Les limites de temps d'exécution (Vercel a des timeouts)
