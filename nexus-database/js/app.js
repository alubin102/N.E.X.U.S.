import HeroProvider from './services/HeroProvider.js';
import Utils from './services/Utils.js';
import CONFIG from './config.js';
// Importer les pages
import Home from './views/pages/Home.js';
import HeroesList from './views/pages/HeroesList.js';
import HeroDetail from './views/pages/HeroDetail.js';
import Favorites from './views/pages/Favorites.js';
import About from './views/pages/About.js';
import Error404 from './views/pages/Error404.js';

class App {
    constructor() {
        this.appElement = document.getElementById('app');
        this.searchInput = document.getElementById('search-input');
        this.mainNav = document.getElementById('main-nav');
        
        this.currentPage = null;
        this.heroes = [];
        this.searchResults = [];
        
        this.init();
    }

    async init() {
        console.log(`🦸 ${CONFIG.app.name} v${CONFIG.app.version}`);

        // Charger les données
        this.heroes = await HeroProvider.loadHeroes();
        HeroProvider.loadRatings();
        this.setupEventListeners();
        await this.handleHashChange();

        console.log(`✅ ${this.heroes.length} super-héros chargés`);
    }

    setupEventListeners() {
        // Navigation par liens
        this.mainNav.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-link')) {
                e.preventDefault();
                const href = e.target.getAttribute('href').substring(1);
                this.navigate(href);
            }
        });

        // Recherche avec debounce
        const debouncedSearch = Utils.debounce((query) => {
            this.performSearch(query);
        }, CONFIG.ui.debounceSearchDelay);

        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length === 0) {
                this.navigate('/heroes');
                return;
            }
            debouncedSearch(query);
        });

        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }

    navigate(path) {
        if (!path.startsWith('/')) path = '/' + path;
        window.location.hash = `#${path}`;
    }

    async handleHashChange() {
        const hash = window.location.hash.substring(1) || '/';
        const cleanedHash = hash.replace(/^\/+/, '');
        const segments = cleanedHash ? cleanedHash.split('/') : [];
        const path = segments[0] || '';
        const params = segments.slice(1);
        
        this.updateNavigation();
        this.searchInput.value = '';

        let page = null;

        switch (path) {
            case '':
            case 'home':
                page = new Home();
                break;
            
            case 'heroes':
                // /heroes ou /heroes/:page
                const pageNum = params[0] || 1;
                page = new HeroesList(pageNum);
                break;
            
            case 'hero':
                // /hero/:id
                const heroId = params[0];
                page = new HeroDetail(heroId);
                break;
            
            case 'favorites':
                page = new Favorites();
                break;
            
            case 'about':
                page = new About();
                break;
            
            default:
                page = new Error404();
        }

        if (page) {
            await this.renderPage(page);
        }
    }

    async renderPage(page) {
        this.appElement.innerHTML = '';
        this.currentPage = page;

        const content = page.render();
        this.appElement.innerHTML = content;

        // Appeler after_render si disponible (nouveau pattern)
        if (typeof page.after_render === 'function') {
            try {
                await page.after_render();
            } catch (err) {
                console.error('Erreur dans after_render:', err);
            }
        }

        // Compatibilité: appeler attachListeners si encore présent
        if (typeof page.attachListeners === 'function') {
            try {
                page.attachListeners();
            } catch (err) {
                console.error('Erreur dans attachListeners:', err);
            }
        }
    }

    performSearch(query) {
        this.searchResults = HeroProvider.searchHeroes(query);
        
        if (this.searchResults.length === 0) {
            this.appElement.innerHTML = `
                <section class="search-results">
                    <div class="message info">
                        📭 Aucun super-héro trouvé pour "${Utils.escapeHtml(query)}"
                    </div>
                </section>
            `;
            return;
        }

        this.displaySearchResults(this.searchResults, query);
    }

    displaySearchResults(results, query) {
        let html = `
            <section class="search-results">
                <div class="search-header">
                    <h2>Résultats pour "${Utils.escapeHtml(query)}"</h2>
                    <p>${results.length} super-héro${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
                </div>
                <div class="heroes-grid">
        `;

        results.forEach(hero => {
            const isFav = HeroProvider.isFavorite(hero.id);
            const avgRating = hero.averageRating || 0;
            
            html += `
                <article class="hero-card">
                    <div class="hero-card-image">
                        <img 
                            src="${hero.image || 'https://via.placeholder.com/300x400?text=No+Image'}"
                            alt="${hero.name}"
                            loading="lazy"
                        >
                        <button class="favorite-btn ${isFav ? 'active' : ''}" 
                                data-hero-id="${hero.id}"
                                title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            ♥
                        </button>
                    </div>
                    <div class="hero-card-body">
                        <h3>${Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-publisher">${Utils.escapeHtml(hero.publisher)}</p>
                        ${avgRating > 0 ? `
                            <div class="hero-rating">
                                <span class="stars">★${avgRating.toFixed(1)}</span>
                            </div>
                        ` : ''}
                        <a href="#/hero/${hero.id}" class="btn btn-small">Détails</a>
                    </div>
                </article>
            `;
        });

        html += '</div></section>';
        this.appElement.innerHTML = html;
        
        this.attachSearchListeners();
    }

    attachSearchListeners() {
        // Boutons favoris
        this.appElement.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const heroId = parseInt(btn.dataset.heroId);
                const hero = HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    const isFav = HeroProvider.toggleFavorite(hero);
                    btn.classList.toggle('active');
                }
            });
        });
    }

    updateNavigation() {
        const hash = window.location.hash.substring(1) || '/';
        this.mainNav.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href').substring(1);
            
            if ((hash === '' || hash === '/') && href === '') {
                link.classList.add('active');
            } else if (hash.startsWith(href) && href !== '') {
                link.classList.add('active');
            }
        });
    }
}

/**
 * Démarrer l'application au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
