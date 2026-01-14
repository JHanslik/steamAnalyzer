# Checklist de déploiement Vercel

## ✅ Vérifications avant déploiement

### 1. Configuration Git
- [ ] Le projet est bien commité sur GitHub
- [ ] La branche `main` existe et contient tout le code
- [ ] Le fichier `.env.local` n'est PAS commité (dans `.gitignore`)

### 2. Configuration Vercel
- [ ] Le projet est connecté à Vercel
- [ ] Le repository GitHub est lié
- [ ] La branche `main` est sélectionnée pour les déploiements automatiques

### 3. Variables d'environnement
- [ ] `STEAM_API_KEY` est configurée dans Vercel
- [ ] Disponible pour : Production, Preview, Development
- [ ] La valeur est correcte (pas d'espaces avant/après)

### 4. Test local
```bash
# Testez que le build fonctionne
npm install
npm run build
npm start
```

### 5. Vérification des fichiers
- [ ] `package.json` contient les scripts nécessaires
- [ ] `next.config.js` est valide
- [ ] `tsconfig.json` est présent
- [ ] Tous les fichiers source sont commités

## 🔍 Diagnostic si le déploiement ne fonctionne pas

### Étape 1 : Vérifier les logs Vercel
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "Deployments"
4. Cliquez sur le dernier déploiement
5. Regardez les "Build Logs"

### Étape 2 : Vérifier les erreurs communes

**Erreur : "Build failed"**
- Vérifiez les logs de build
- Testez `npm run build` localement
- Vérifiez les erreurs TypeScript

**Erreur : "Environment variable missing"**
- Vérifiez que `STEAM_API_KEY` est bien configurée
- Vérifiez qu'elle est disponible pour tous les environnements

**Erreur : "Module not found"**
- Vérifiez que `package.json` contient toutes les dépendances
- Vérifiez que `package-lock.json` est commité

**Erreur : "Function timeout"**
- Les API Routes ont un timeout de 10s sur le plan gratuit
- Vérifiez que vos appels API Steam ne prennent pas trop de temps

### Étape 3 : Forcer un nouveau déploiement

**Option 1 : Via l'interface Vercel**
1. Allez dans Deployments
2. Cliquez sur les trois points (⋯)
3. Sélectionnez "Redeploy"

**Option 2 : Via Git**
```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

**Option 3 : Reconnecter le repository**
1. Allez dans Settings > Git
2. Déconnectez le repository
3. Reconnectez-le
4. Vercel redéploiera automatiquement

## 📝 Commandes utiles

```bash
# Vérifier que tout fonctionne localement
npm install
npm run build
npm start

# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Vérifier les erreurs ESLint
npm run lint

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json .next
npm install
```

## 🆘 Si rien ne fonctionne

1. Vérifiez les logs complets dans Vercel
2. Testez le build localement avec `npm run build`
3. Vérifiez que toutes les dépendances sont dans `package.json`
4. Vérifiez la version de Node.js (Vercel utilise Node 18.x par défaut)
5. Contactez le support Vercel avec les logs d'erreur
