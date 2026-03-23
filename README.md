# 🦸 Super-Héros Directory

Application web moderne de répertoire de super-héros avec notation, système de favoris et pagination.

**Stack:** Vanilla JavaScript (ES6) | Webpack | SPA avec routeur personnalisé | JSON relationnel

---

## 🚀 Installation et Démarrage

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

---

## 📖 Routes de l'Application

| Route | Description |
|-------|-------------|
| `#/` | Accueil |
| `#/heroes` | Liste des héros |
| `#/heroes/:page` | Liste page N |
| `#/hero/:id` | Détail du héro |
| `#/favorites` | Mes favoris |
| `#/about` | À propos |

---

## ✨ Fonctionnalités

### 📱 Interface Responsive
- Adaptation desktop, tablette, mobile
- Grille 3x3 pour la liste des héros

### 🔍 Recherche
- Recherche en temps réel (debounce 500ms)
- Filtrage par nom, alias, description, éditeur

### ⭐ Système de Notation
- Notation de 1 à 5 étoiles
- Commentaires optionnels (max 200 caractères)
- Calcul automatique de la note moyenne
- Stockage persistant en localStorage

### ❤️ Favoris
- Ajout/suppression avec bouton ♥
- Stockage en localStorage
- Page dédiée aux favoris

### 📊 Statistiques
- 6 stats de puissance par héro
- Barres de progression visuelles

### 🖼️ Lazy Loading
- Images chargées à la demande
- Optimisation des performances

### 📄 Pagination
- 9 héros par page (grid 3x3)
- Navigation complète

### 🏢 Filtrage
- Par éditeur (DC Comics, Marvel, etc.)

---

## 📦 Structure du Projet

```
nexus-database/
├── index.html                    # SPA unique
├── data.json                     # Données héros
├── webpack.config.js             # Configuration bundler
├── package.json                  # Dépendances

├── js/
│   ├── app.js                   # Application principale
│   ├── config.js                # Configuration
│   ├── services/
│   │   ├── HeroProvider.js      # Service héros
│   │   └── Utils.js             # Utilitaires
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
    └── bundle.js                # Bundle généré
```

---

## ⚙️ Configuration Webpack

### webpack.config.js

Fichier de configuration pour Webpack :

```javascript
// Mode développement/production
mode: process.env.NODE_ENV || 'development'

// Entry point
entry: './js/app.js'

// Output
output: {
    path: 'dist/',
    filename: 'bundle.js'
}

// Dev Server
devServer: { 
    port: 8080, 
    hot: true,
    historyApiFallback: true  // SPA routing
}

// Source maps
devtool: 'source-map' (dev only)

// Loaders
module.rules: [CSS, images, JSON]
```

### Utiliser le bundle ou les modules

**En développement (modules ES6):**
```html
<script type="module" src="js/app.js"></script>
```

**En production (bundle Webpack):**
```html
<script src="dist/bundle.js"></script>
```

---

## 💾 Données JSON Relationnel

### data.json

```json
{
  "heroes": [
    {
      "id": 1,
      "name": "Superman",
      "publisher": "DC Comics",
      "stats": { "intelligence": 94, "strength": 100, ... },
      "ratings": [],
      "averageRating": 0
    }
  ],
  "teams": [
    {
      "id": 1,
      "name": "Justice League",
      "heroIds": [1, 2],    # Relation n-n
      "publisher": "DC Comics"
    }
  ]
}
```

### Relations:
- **1 Héro → N Notations** (1-n)
- **1 Team → N Héros** (n-n via heroIds)

### Stockage localStorage:
- **Favoris:** `hero_favorites`
- **Notations:** `hero_ratings`

---

## 📚 Utilisation HeroProvider

```javascript
import HeroProvider from './services/HeroProvider.js';

// Charger
await HeroProvider.loadHeroes();
HeroProvider.loadRatings();

// Récupérer
const hero = HeroProvider.getHeroById(1);
const heroes = HeroProvider.getAllHeroes();
const results = HeroProvider.searchHeroes('Batman');

// Favoris
HeroProvider.addFavorite(hero);
HeroProvider.toggleFavorite(hero);
HeroProvider.getFavoriteHeroes();

// Notations
HeroProvider.addRating(heroId, 5, 'Excellent !');
HeroProvider.getRatings(heroId);
```

---

## 🎨 Design & Couleurs

```css
:root {
    --primary-color: #1a1a2e;
    --secondary-color: #16213e;
    --accent-color: #0f3460;
    --highlight-color: #e94560;
    --success-color: #00d4ff;
}
```

Modifiez ces variables CSS pour personnaliser le design.

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| Port 8080 occupé | `npm start -- --port 3001` |
| Favoris ne se sauvent pas | Vérifier que localStorage est activé |
| Images ne s'affichent pas | Vérifier URLs dans data.json |
| Bundle vide | Vérifier que `dist/bundle.js` existe |
| Routes ne fonctionnent pas | Vérifier la config historyApiFallback |

---

## ✅ Fonctionnalités Implémentées

- ✅ Listing pagéiné (9 par page)
- ✅ Détail d'un héro
- ✅ Système de notation 1-5 stars
- ✅ Mise en favoris (localStorage)
- ✅ Recherche temps réel
- ✅ JSON relationnel (héros, teams, ratings)
- ✅ Lazy loading images
- ✅ Routeur SPA
- ✅ Webpack bundler
- ✅ Architecture modulaire (classes, services)
- ✅ README exemplaire

---

## 🚀 Déploiement Production

1. Générer le bundle:
```bash
npm run build
```

2. Uploader `dist/bundle.js` et modifier `index.html`:
```html
<script src="dist/bundle.js"></script>
```

3. Configurer la redirection 404 → `index.html`

---

**Version:** 1.0.0 | **Année:** 2026 | **Développement:** IUT
