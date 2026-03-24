

## Installation et Démarrage

### 1. Installation des dépendances

```bash
cd nexus-database
npm install
```

Installe Webpack et ses dépendances pour la compilation.

### 2. Lancer en développement (avec serveur)

```bash
npm start
```

- Lance le serveur de développement sur `http://localhost:8080`
- Active le hot-reload (recharge auto à chaque changement)
- Génère les source maps pour le débogage

### 3. Compiler pour la production

```bash
npm run build
```

- Génère `dist/bundle.js` optimisé et minifié
- Prêt pour déploiement en production

### 4. Compiler en mode développement

```bash
npm run dev
```

- Génère `dist/bundle.js` sans minification
- Inclut les source maps

### 5. Surveillance automatique

```bash
npm run watch
```

- Recompile automatiquement à chaque changement
- Utile pour développement sans serveur


## Structure du Projet

```
nexus-database/
├── index.html                    
├── data.json                    
├── webpack.config.js             
├── package.json                  

├── js/
│   ├── app.js                   
│   ├── config.js                
│   ├── services/
│   │   ├── HeroProvider.js     
│   │   └── Utils.js             
│   └── views/pages/
│       ├── Home.js
│       ├── HeroesList.js
│       ├── HeroDetail.js
│       ├── Favorites.js
│       ├── About.js
│       └── Error404.js

├── assets/
│   └── style.css

└── dist/
    └── bundle.js               

