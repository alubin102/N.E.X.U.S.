# 🦸 Super-Héros Directory - Architecture

## 📐 Structure du Projet

```
nexus-database/
├── index.html                    # SPA - Seul fichier HTML
├── data.json                     # Données héros + teams + ratings
├── package.json                  # Dépendances, scripts npm
├── webpack.config.js             # Configuration buildersexu développement/production
│
├── assets/
│   └── style.css                 # Feuille de styles complète
│
├── js/                           # Code JavaScript modularisé
│   ├── app.js                    # Application principale (routeur)
│   ├── config.js                 # Configuration centralisée
│   ├── services/
│   │   ├── HeroProvider.js       # Service héros, favoris, notations
│   │   └── Utils.js              # Utilitaires (debounce, escape HTML, etc.)
│   └── views/pages/
│       ├── Home.js               # Accueil
│       ├── HeroesList.js         # Liste héros (pagination 9/page)
│       ├── HeroDetail.js         # Détail héro (notations)
│       ├── Favorites.js          # Page favoris
│       ├── About.js              # À propos
│       └── Error404.js           # Page erreur 404
│
└── dist/                         # Output Webpack (après npm run build)
    └── bundle.js                 # Bundle minifié production
```

## 🎯 Concepts Architecturaux

### 1. Single Page Application (SPA)
- **1 seul fichier HTML**: `index.html`
- **Routeur personnalisé**: Gestion des hash (#/heroes, #/hero/1, etc.)
- **Chargement dynamique**: Pages rendues via JavaScript

### 2. Architecture Modulaire
```
App (app.js)
├── Initialisation (async)
├── Routeur (hashchange listener)
├── Pages (render + attachListeners)
└── Services (HeroProvider, Utils)
```

### 3. Services
- **HeroProvider**: CRUD héros, recherche, favoris, notations
- **Utils**: Débounce, escape HTML, formatage, pagination, lazy loading

### 4. Pages (Vue Pattern)
Chaque page (classe) implémente:
```javascript
class PageName {
    render() { return HTML string }
    attachListeners() { ... }
}
```

## 💾 Flux de Données

```
data.json
    ↓
HeroProvider.loadHeroes()
    ↓
App (état global)
    ↓
Pages (rendu)
    ↓
localStorage (favoris, notations)
```

## 🔀 Routes et Navigation

| Route | Handler | Page | Fonction |
|-------|---------|------|----------|
| `#/` | handleHashChange | Home.js | Accueil |
| `#/heroes` | path === 'heroes' | HeroesList.js | Liste (page 1) |
| `#/heroes/:page` | params[0] | HeroesList.js | Liste (page N) |
| `#/hero/:id` | params[0] | HeroDetail.js | Détail + notation |
| `#/favorites` | path === 'favorites' | Favorites.js | Favoris |
| `#/about` | path === 'about' | About.js | À propos |
| `#/*` | default | Error404.js | 404 |

## 🔄 Cycle de Vie d'une Page

1. **URL change** → hashchange event
2. **Parser route** → extraire path et paramètres
3. **Créer page** → new PageClass(params)
4. **Rendre** → page.render() → HTML string
5. **Injecter** → appElement.innerHTML = content
6. **Attacher écouteurs** → page.attachListeners()

## 🛠️ Services Disponibles

### HeroProvider (Singleton)
```javascript
// Chargement
loadHeroes()
loadRatings()

// Récupération
getAllHeroes()
getHeroById(id)
searchHeroes(query)
getHeroesByPublisher(publisher)
getPublishers()

// Favoris
addFavorite(hero)
removeFavorite(heroId)
toggleFavorite(hero)
isFavorite(heroId)
getFavoriteHeroes()
clearFavorites()

// Notations
addRating(heroId, score, comment)
getRatings(heroId)
updateAverageRating(heroId)
saveRatings()
```

### Utils
```javascript
escapeHtml(text)
debounce(func, delay)
throttle(func, limit)
formatDate(date, format)
highlightText(text, query)
paginate(items, page, pageSize)
deepClone(obj)
```

## 📊 Données JSON Relationnel

### Structure data.json

```json
{
  "heroes": [
    {
      "id": 1,
      "name": "Superman",
      "alias": "Clark Kent",
      "description": "...",
      "image": "url",
      "publisher": "DC Comics",
      "stats": {
        "intelligence": 94,
        "strength": 100,
        "speed": 100,
        "durability": 100,
        "power": 100,
        "combat": 85
      },
      "ratings": [
        {
          "score": 5,
          "comment": "Excellent !",
          "date": "2026-03-18T..."
        }
      ],
      "averageRating": 5
    }
  ],
  "teams": [
    {
      "id": 1,
      "name": "Justice League",
      "description": "...",
      "heroIds": [1, 2],
      "publisher": "DC Comics"
    }
  ],
  "ratings": []
}
```

### Relations:
- **1 Héro → N Ratings** (relation 1-n via array)
- **1 Team → N Héros** (relation n-n via heroIds)

## 💾 Stockage Local (localStorage)

### Favoris
```javascript
key: 'hero_favorites'
format: [[1, heroObject], [2, heroObject], ...]
```

### Notations
```javascript
key: 'hero_ratings'
format: [
  { id: 1, ratings: [...], averageRating: 4.5 },
  { id: 2, ratings: [...], averageRating: 3.8 }
]
```

## 🌐 Webpack & Build

### Configuration (webpack.config.js)
- **Entry**: `js/app.js`
- **Output**: `dist/bundle.js`
- **Loaders**: CSS, images, JSON
- **Dev Server**: port 8080, hot reload
- **Mode**: development ou production

### Scripts npm

```bash
npm start        # Dev server + hot reload
npm run build    # Bundle production
npm run dev      # Bundle développement
npm run watch    # Surveillance fichiers
```

### De modules ES6 à bundle

**Modules (développement):**
```html
<script type="module" src="js/app.js"></script>
```

**Bundle (production):**
```html
<script src="dist/bundle.js"></script>
```

## 🎨 Système de Design

### Couleurs CSS
```css
--primary-color: #1a1a2e       (noir)
--secondary-color: #16213e     (bleu foncé)
--accent-color: #0f3460        (bleu)
--highlight-color: #e94560     (rouge/rose)
--text-color: #eaeaea          (texte blanc)
--success-color: #00d4ff       (cyan)
```

### Composants Réutilisables
- `.btn` - Bouton standard
- `.hero-card` - Carte héro
- `.rating-stars` - Système étoiles
- `.pagination` - Pagination
- `.message` - Messages (info, error)

## 🔍 Recherche et Filtrage

### Recherche (app.js)
- **Trigger**: Input avec debounce 500ms
- **Filtrage**: HeroProvider.searchHeroes(query)
- **Champs**: name, alias, description, publisher

### Filtrage par éditeur (HeroesList.js)
- **Trigger**: Select éditeur
- **Filtrage**: HeroProvider.getHeroesByPublisher(publisher)
- **Réinitialise**: Retour page 1

## 🖼️ Optimisations

### Lazy Loading
```javascript
// IntersectionObserver pour chargement à la demande
if ('IntersectionObserver' in window) {
    // Observer images et charger au scroll
}
```

### Pagination
```javascript
// Grid 3x3 = 9 héros par page
// Navigation: première, précédent, suivant, dernière
```

### Cache (Optionnel)
```javascript
// HeroProvider.cache (Map)
// Stockage API responses
```

## 🚀 Déploiement

### Production Checklist
- [ ] `npm run build` généré
- [ ] `dist/bundle.js` existe
- [ ] `index.html` référence bundle
- [ ] 404 redirige vers index.html
- [ ] CORS géré si API externe
- [ ] localStorage accessible

---

**Version:** 1.0.0 | **Année:** 2026
