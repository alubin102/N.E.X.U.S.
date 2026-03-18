/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./js/config.js
const CONFIG = {
    app: {
        name: 'Super-Héros Directory',
        version: '1.0.0',
        description: 'Application de répertoire de super-héros avec notation et favoris'
    },
    
    api: {
        baseUrl: 'https://www.superheroapi.com/api.php',
        apiKey: '7bea7e85f7979785a2773ca78db33d53',
        dataFile: '/data.json',
        maxHeroId: 731,
        requestBatchSize: 8
    },
    
    storage: {
        favorites: 'hero_favorites',
        ratings: 'hero_ratings',
        theme: 'app_theme'
    },
    
    cache: {
        enabled: true,
        ttl: 3600000,
        apiHeroesTtl: 86400000
    },

    ui: {
        pageSize: 9,
        debounceSearchDelay: 500,
        ratingMaxLength: 200
    },

    routes: [
        { path: '/', page: 'Home' },
        { path: '/heroes', page: 'HeroesList' },
        { path: '/heroes/:page', page: 'HeroesList' },
        { path: '/hero/:id', page: 'HeroDetail' },
        { path: '/favorites', page: 'Favorites' },
        { path: '/about', page: 'About' },
        { path: '*', page: 'Error404' }
    ]
};

/* harmony default export */ const config = (CONFIG);

;// ./js/services/HeroProvider.js


class HeroProvider {
    constructor() {
        this.apiKey = config.api.apiKey;
        this.baseUrl = config.api.baseUrl;
        this.cache = new Map();
        this.heroes = [];
        this.ratings = [];
        this.favoritesKey = 'hero_favorites';
        this.ratingsKey = 'hero_ratings';
        this.apiHeroesCacheKey = 'hero_api_cache';
        this.apiHeroesCacheMetaKey = 'hero_api_cache_meta';
        this.favorites = this.loadFavorites();
    }

    async loadHeroes() {
        const localHeroes = await this.loadLocalHeroes();
        let apiHeroes = this.loadApiHeroesFromCache();

        if (apiHeroes.length === 0) {
            apiHeroes = await this.fetchAllApiHeroes();
            if (apiHeroes.length > 0) {
                this.saveApiHeroesToCache(apiHeroes);
            }
        }

        this.heroes = this.mergeHeroes(localHeroes, apiHeroes);
        return this.heroes;
    }

    async loadLocalHeroes() {
        try {
            const response = await fetch(config.api.dataFile || '/data.json');
            if (response.ok) {
                const data = await response.json();
                return data.heroes || [];
            }
        } catch (error) {
            console.error('Erreur chargement data.json:', error);
        }
        return [];
    }

    loadApiHeroesFromCache() {
        try {
            if (!config.cache.enabled) return [];

            const metaRaw = localStorage.getItem(this.apiHeroesCacheMetaKey);
            const cacheRaw = localStorage.getItem(this.apiHeroesCacheKey);
            if (!metaRaw || !cacheRaw) return [];

            const meta = JSON.parse(metaRaw);
            const ttl = config.cache.apiHeroesTtl || 86400000;
            if (!meta.savedAt || Date.now() - meta.savedAt > ttl) {
                return [];
            }

            const parsed = JSON.parse(cacheRaw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Erreur lecture cache API:', error);
            return [];
        }
    }

    saveApiHeroesToCache(heroes) {
        try {
            if (!config.cache.enabled) return;

            localStorage.setItem(this.apiHeroesCacheKey, JSON.stringify(heroes));
            localStorage.setItem(this.apiHeroesCacheMetaKey, JSON.stringify({
                savedAt: Date.now(),
                count: heroes.length
            }));
        } catch (error) {
            console.error('Erreur sauvegarde cache API:', error);
        }
    }

    async fetchAllApiHeroes() {
        const maxHeroId = config.api.maxHeroId || 731;
        const batchSize = config.api.requestBatchSize || 8;
        const heroes = [];

        for (let start = 1; start <= maxHeroId; start += batchSize) {
            const end = Math.min(start + batchSize - 1, maxHeroId);
            const ids = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
            const batch = await Promise.all(ids.map(id => this.fetchHeroById(id)));
            batch.forEach(hero => {
                if (hero) heroes.push(hero);
            });
        }

        return heroes;
    }

    async fetchHeroById(id) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.apiKey}/${id}`);
            if (!response.ok) return null;

            const apiHero = await response.json();
            if (!apiHero || apiHero.response !== 'success') return null;

            return this.normalizeApiHero(apiHero);
        } catch (error) {
            return null;
        }
    }

    normalizeApiHero(apiHero) {
        const fullName = apiHero.biography?.['full-name'] || '';
        const occupation = apiHero.work?.occupation || '';
        const placeOfBirth = apiHero.biography?.['place-of-birth'] || '';
        const descriptionParts = [occupation, placeOfBirth].filter(Boolean);

        return {
            id: parseInt(apiHero.id),
            name: apiHero.name || 'Inconnu',
            alias: fullName || apiHero.name || 'Inconnu',
            publisher: apiHero.biography?.publisher || 'Inconnu',
            description: descriptionParts.join(' | ') || 'Aucune description disponible',
            image: apiHero.image?.url || '',
            stats: {
                intelligence: this.toNumber(apiHero.powerstats?.intelligence),
                strength: this.toNumber(apiHero.powerstats?.strength),
                speed: this.toNumber(apiHero.powerstats?.speed),
                durability: this.toNumber(apiHero.powerstats?.durability),
                power: this.toNumber(apiHero.powerstats?.power),
                combat: this.toNumber(apiHero.powerstats?.combat)
            },
            ratings: [],
            averageRating: 0
        };
    }

    toNumber(value) {
        const n = parseInt(value, 10);
        return Number.isNaN(n) ? 0 : n;
    }

    mergeHeroes(localHeroes, apiHeroes) {
        const merged = new Map();

        localHeroes.forEach(hero => {
            merged.set(hero.id, hero);
        });

        apiHeroes.forEach(hero => {
            if (!merged.has(hero.id)) {
                merged.set(hero.id, hero);
                return;
            }

            const existing = merged.get(hero.id);
            merged.set(hero.id, {
                ...hero,
                ...existing,
                name: existing.name || hero.name,
                alias: existing.alias || hero.alias,
                publisher: existing.publisher || hero.publisher,
                description: existing.description || hero.description,
                image: existing.image || hero.image,
                stats: {
                    ...hero.stats,
                    ...(existing.stats || {})
                }
            });
        });

        return Array.from(merged.values());
    }

    getAllHeroes() {
        return this.heroes;
    }

    getHeroById(id) {
        return this.heroes.find(hero => hero.id === parseInt(id)) || null;
    }

    searchHeroes(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        const q = query.toLowerCase();
        return this.heroes.filter(hero =>
            (hero.name || '').toLowerCase().includes(q) ||
            (hero.alias || '').toLowerCase().includes(q) ||
            (hero.description || '').toLowerCase().includes(q) ||
            (hero.publisher || '').toLowerCase().includes(q)
        );
    }

    getHeroesByPublisher(publisher) {
        return this.heroes.filter(hero => hero.publisher === publisher);
    }

    getPublishers() {
        return [...new Set(this.heroes.map(hero => hero.publisher).filter(Boolean))];
    }

    loadFavorites() {
        try {
            const data = localStorage.getItem(this.favoritesKey);
            return new Map(JSON.parse(data || '[]'));
        } catch (error) {
            console.error('Erreur chargement favoris:', error);
            return new Map();
        }
    }

    saveFavorites() {
        try {
            const data = JSON.stringify(Array.from(this.favorites.entries()));
            localStorage.setItem(this.favoritesKey, data);
        } catch (error) {
            console.error('Erreur sauvegarde favoris:', error);
        }
    }

    addFavorite(hero) {
        this.favorites.set(hero.id, hero);
        this.saveFavorites();
    }

    removeFavorite(heroId) {
        this.favorites.delete(heroId);
        this.saveFavorites();
    }

    isFavorite(heroId) {
        return this.favorites.has(heroId);
    }

    getFavoriteHeroes() {
        return Array.from(this.favorites.values());
    }

    toggleFavorite(hero) {
        if (this.isFavorite(hero.id)) {
            this.removeFavorite(hero.id);
            return false;
        } else {
            this.addFavorite(hero);
            return true;
        }
    }

    addRating(heroId, score, comment = '') {
        const hero = this.getHeroById(heroId);
        if (!hero) return;

        const rating = {
            score: Math.max(1, Math.min(5, score)),
            comment,
            date: new Date().toISOString()
        };

        if (!hero.ratings) hero.ratings = [];
        hero.ratings.push(rating);
        this.updateAverageRating(heroId);
        this.saveRatings();
    }

    getRatings(heroId) {
        const hero = this.getHeroById(heroId);
        return hero ? (hero.ratings || []) : [];
    }

    updateAverageRating(heroId) {
        const hero = this.getHeroById(heroId);
        if (!hero || !hero.ratings || hero.ratings.length === 0) {
            if (hero) hero.averageRating = 0;
            return;
        }
        const average = hero.ratings.reduce((sum, r) => sum + r.score, 0) / hero.ratings.length;
        hero.averageRating = Math.round(average * 10) / 10;
    }

    saveRatings() {
        try {
            const ratingsData = this.heroes.map(h => ({
                id: h.id,
                ratings: h.ratings || [],
                averageRating: h.averageRating || 0
            }));
            localStorage.setItem(this.ratingsKey, JSON.stringify(ratingsData));
        } catch (error) {
            console.error('Erreur sauvegarde notations:', error);
        }
    }

    loadRatings() {
        try {
            const data = localStorage.getItem(this.ratingsKey);
            if (!data) return;
            const ratingsData = JSON.parse(data);
            ratingsData.forEach(rd => {
                const hero = this.getHeroById(rd.id);
                if (hero) {
                    hero.ratings = rd.ratings || [];
                    hero.averageRating = rd.averageRating || 0;
                }
            });
        } catch (error) {
            console.error('Erreur chargement notations:', error);
        }
    }

    getFavoriteCount() {
        return this.favorites.size;
    }

    clearFavorites() {
        this.favorites.clear();
        this.saveFavorites();
    }
}

/* harmony default export */ const services_HeroProvider = (new HeroProvider());

;// ./js/services/Utils.js
class Utils {
    static escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    static formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    static highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    static escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static paginate(items, page = 1, pageSize = 10) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            items: items.slice(start, end),
            totalPages: Math.ceil(items.length / pageSize),
            currentPage: page,
            totalItems: items.length
        };
    }

    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

/* harmony default export */ const services_Utils = (Utils);

;// ./js/views/pages/Home.js
/**
 * Page d'accueil
 */


class Home {
    render() {
        const heroCount = services_HeroProvider.getAllHeroes().length;
        const favoriteCount = services_HeroProvider.getFavoriteCount();
        
        return `
            <section class="home-section">
                <div class="home-hero">
                    <h2>Bienvenue sur N.E.X.U.S.</h2>
                </div>
                    
                
            
        `;
    }
}

/* harmony default export */ const pages_Home = (Home);

;// ./js/views/pages/HeroesList.js



class HeroesList {
    constructor(page = 1) {
        this.page = parseInt(page) || 1;
        this.pageSize = 9;
        this.heroes = services_HeroProvider.getAllHeroes();
        this.filteredHeroes = this.heroes;
        this.currentPublisher = null;
    }

    render() {
        const totalPages = Math.ceil(this.filteredHeroes.length / this.pageSize);
        if (this.page > totalPages && totalPages > 0) {
            this.page = totalPages;
        }

        const pagination = services_Utils.paginate(this.filteredHeroes, this.page, this.pageSize);
        const publishers = services_HeroProvider.getPublishers();

        if (this.filteredHeroes.length === 0) {
            return `
                <section class="heroes-section">
                    <div class="section-header">
                        <h2>Super-Héros</h2>
                        <div class="filters">
                            <select id="publisher-filter" class="filter-select">
                                <option value="">Tous les éditeurs</option>
                                ${publishers.map(pub => `
                                    <option value="${pub}">${pub}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="message info">
                        📭 Aucun super-héro trouvé
                    </div>
                </section>
            `;
        }

        let html = `
            <section class="heroes-section">
                <div class="section-header">
                    <h2>Super-Héros</h2>
                    <div class="filters">
                        <select id="publisher-filter" class="filter-select">
                            <option value="">Tous les éditeurs</option>
                            ${publishers.map(pub => `
                                <option value="${pub}" ${this.currentPublisher === pub ? 'selected' : ''}>${pub}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="heroes-count">
                    ${this.filteredHeroes.length} super-héro${this.filteredHeroes.length > 1 ? 's' : ''} trouvé${this.filteredHeroes.length > 1 ? 's' : ''}
                </div>

                <div class="heroes-grid">
        `;

        pagination.items.forEach(hero => {
            const isFav = services_HeroProvider.isFavorite(hero.id);
            const avgRating = hero.averageRating || 0;
            
            html += `
                <article class="hero-card">
                    <div class="hero-card-image">
                        <img 
                            src="${hero.image || 'https://via.placeholder.com/300x400?text=No+Image'}"
                            alt="${hero.name}"
                            class="lazy-load"
                            data-src="${hero.image || 'https://via.placeholder.com/300x400?text=No+Image'}"
                            loading="lazy"
                        >
                        <button class="favorite-btn ${isFav ? 'active' : ''}" 
                                data-hero-id="${hero.id}"
                                title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            ♥
                        </button>
                    </div>
                    <div class="hero-card-body">
                        <h3>${services_Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-alias">${services_Utils.escapeHtml(hero.alias)}</p>
                        <p class="hero-publisher">${services_Utils.escapeHtml(hero.publisher)}</p>
                        
                        ${avgRating > 0 ? `
                            <div class="hero-rating">
                                <span class="stars">${this.renderStars(avgRating)}</span>
                                <span class="rating-value">${avgRating.toFixed(1)}/5</span>
                            </div>
                        ` : ''}
                        
                        <a href="#/hero/${hero.id}" class="btn btn-small">Détails</a>
                    </div>
                </article>
            `;
        });

        html += '</div>';

        // Pagination
        if (totalPages > 1) {
            html += `
                <div class="pagination">
                    ${this.page > 1 ? `
                        <a href="#/heroes/1" class="btn-page">« Première</a>
                        <a href="#/heroes/${this.page - 1}" class="btn-page">‹ Précédent</a>
                    ` : ''}
                    
                    <span class="page-info">Page ${this.page} / ${totalPages}</span>
                    
                    ${this.page < totalPages ? `
                        <a href="#/heroes/${this.page + 1}" class="btn-page">Suivant ›</a>
                        <a href="#/heroes/${totalPages}" class="btn-page">Dernière »</a>
                    ` : ''}
                </div>
            `;
        }

        html += '</section>';
        return html;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalf) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    async after_render() {
        const appElement = document.getElementById('app');

        const publisherFilter = appElement.querySelector('#publisher-filter');
        if (publisherFilter) {
            publisherFilter.addEventListener('change', (e) => {
                this.currentPublisher = e.target.value;
                this.filteredHeroes = this.currentPublisher 
                    ? services_HeroProvider.getHeroesByPublisher(this.currentPublisher)
                    : this.heroes;
                this.page = 1;
                window.location.hash = '#/heroes';
            });
        }

        appElement.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const heroId = parseInt(btn.dataset.heroId);
                const hero = services_HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    const isFav = services_HeroProvider.toggleFavorite(hero);
                    btn.classList.toggle('active');
                }
            });
        });

        this.initLazyLoading();
    }

    attachListeners() {
        this.after_render();
    }

    // Compatibilité: ancien nom
    attachListeners() {
        this.after_render();
    }

    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const images = document.querySelectorAll('img.lazy-load');
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy-load');
                        observer.unobserve(img);
                    }
                });
            });
            images.forEach(img => imageObserver.observe(img));
        }
    }
}

/* harmony default export */ const pages_HeroesList = (HeroesList);

;// ./js/views/pages/HeroDetail.js



class HeroDetail {
    constructor(heroId) {
        this.heroId = parseInt(heroId);
        this.hero = services_HeroProvider.getHeroById(this.heroId);
    }

    render() {
        if (!this.hero) {
            return `
                <div class="message error">
                    ⚠️ Super-héro non trouvé
                </div>
            `;
        }

        const isFav = services_HeroProvider.isFavorite(this.hero.id);
        const ratings = services_HeroProvider.getRatings(this.hero.id) || [];
        const avgRating = this.hero.averageRating || 0;
        const stats = this.hero.stats || {};

        return `
            <section class="hero-detail">
                <div class="hero-detail-header">
                    <a href="#/heroes" class="back-link">← Retour aux super-héros</a>
                </div>
                
                <div class="hero-detail-container">
                    <div class="hero-detail-image">
                        <img 
                            src="${this.hero.image || 'https://via.placeholder.com/400x500?text=No+Image'}"
                            alt="${this.hero.name}"
                            class="hero-main-image"
                            loading="lazy"
                        >
                        <button class="favorite-btn large ${isFav ? 'active' : ''}" 
                                data-hero-id="${this.hero.id}">
                            ♥ ${isFav ? 'Retiré des favoris' : 'Ajouter aux favoris'}
                        </button>
                    </div>

                    <div class="hero-detail-content">
                        <h1>${services_Utils.escapeHtml(this.hero.name)}</h1>
                        <p class="hero-alias">Alias: ${services_Utils.escapeHtml(this.hero.alias)}</p>
                        <p class="hero-publisher">Éditeur: ${services_Utils.escapeHtml(this.hero.publisher)}</p>
                        
                        <div class="hero-description">
                            ${services_Utils.escapeHtml(this.hero.description)}
                        </div>

                        <div class="hero-stats">
                            <h2>Statistiques de Puissance</h2>
                            ${this.renderStats(stats)}
                        </div>

                        <div class="rating-section">
                            <h2>Notation (${ratings.length > 0 ? ratings.length + ' avis' : 'Soyez le premier à noter'})</h2>
                            
                            ${avgRating > 0 ? `
                                <div class="rating-summary">
                                    <div class="average-rating">
                                        <span class="stars-big">${this.renderStarsBig(avgRating)}</span>
                                        <span class="rating-number">${avgRating.toFixed(1)}/5</span>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="rating-form">
                                <h3>Donnez votre avis</h3>
                                <div class="form-group">
                                    <label>Note:</label>
                                    <div class="rating-stars">
                                        ${[1, 2, 3, 4, 5].map(star => `
                                            <button class="star-btn" data-value="${star}">★</button>
                                        `).join('')}
                                    </div>
                                    <span id="selected-rating" class="selected-rating"></span>
                                </div>
                                <div class="form-group">
                                    <label>Commentaire:</label>
                                    <textarea id="rating-comment" 
                                              placeholder="Partagez votre avis..." 
                                              maxlength="200" 
                                              rows="3"></textarea>
                                </div>
                                <button id="submit-rating" class="btn btn-primary">Soumettre l'avis</button>
                            </div>

                            ${ratings.length > 0 ? `
                                <div class="ratings-list">
                                    <h3>Avis récents</h3>
                                    ${ratings.map((rating, idx) => `
                                        <div class="rating-item">
                                            <div class="rating-item-header">
                                                <span class="rating-stars-display">${this.renderStars(rating.score)}</span>
                                                <span class="rating-score">${rating.score}/5</span>
                                            </div>
                                            ${rating.comment ? `
                                                <p class="rating-comment">${services_Utils.escapeHtml(rating.comment)}</p>
                                            ` : ''}
                                            <span class="rating-date">${new Date(rating.date).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    renderStats(stats) {
        const statLabels = {
            intelligence: 'Intelligence',
            strength: 'Force',
            speed: 'Vitesse',
            durability: 'Durabilité',
            power: 'Pouvoir',
            combat: 'Combat'
        };

        return Object.entries(stats).map(([key, value]) => `
            <div class="stat">
                <span class="stat-label">${statLabels[key] || key}</span>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: ${value || 0}%">
                        <span class="stat-value">${value || 0}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalf) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    renderStarsBig(rating) {
        return this.renderStars(rating);
    }

    async after_render() {
        const appElement = document.getElementById('app');

        const favBtn = appElement.querySelector('.favorite-btn');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isFav = services_HeroProvider.toggleFavorite(this.hero);
                favBtn.classList.toggle('active');
                favBtn.textContent = isFav ? '♥ Retiré des favoris' : '♥ Ajouter aux favoris';
            });
        }

        let selectedRating = 0;
        const starBtns = appElement.querySelectorAll('.star-btn');
        const selectedRatingDisplay = appElement.querySelector('#selected-rating');

        starBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                selectedRating = parseInt(btn.dataset.value);
                selectedRatingDisplay.textContent = `${selectedRating}/5 sélectionné`;
                
                starBtns.forEach((b, idx) => {
                    b.classList.toggle('active', idx < selectedRating);
                });
            });

            btn.addEventListener('mouseenter', (e) => {
                const value = parseInt(btn.dataset.value);
                starBtns.forEach((b, idx) => {
                    b.style.color = idx < value ? '#FFD700' : '#999';
                });
            });
        });

        appElement.querySelectorAll('.rating-stars').forEach(container => {
            container.addEventListener('mouseleave', () => {
                starBtns.forEach((b, idx) => {
                    b.style.color = idx < selectedRating ? '#FFD700' : '#999';
                });
            });
        });

        const submitBtn = appElement.querySelector('#submit-rating');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (selectedRating === 0) {
                    alert('Veuillez sélectionner une note');
                    return;
                }

                const comment = appElement.querySelector('#rating-comment').value;
                services_HeroProvider.addRating(this.hero.id, selectedRating, comment);
                
                alert('Merci pour votre avis ! Recharger la page pour voir les changements.');
                window.location.hash = `#/hero/${this.hero.id}`;
            });
        }

        const backLink = appElement.querySelector('.back-link');
        if (backLink) {
            backLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = '#/heroes';
            });
        }
    }

    attachListeners() {
        this.after_render();
    }
}

/* harmony default export */ const pages_HeroDetail = (HeroDetail);

;// ./js/views/pages/Favorites.js
/**
 * Page des super-héros favoris
 */



class Favorites {
    render() {
        const favorites = services_HeroProvider.getFavoriteHeroes();

        if (favorites.length === 0) {
            return `
                <section class="favorites-section">
                    <h2>Mes Favoris</h2>
                    <div class="message info">
                        💔 Vous n'avez pas encore de favoris.
                        <p><a href="#/heroes" class="link">Découvrez les super-héros</a></p>
                    </div>
                </section>
            `;
        }

        let html = `
            <section class="favorites-section">
                <h2>Mes Favoris</h2>
                <p class="favorites-count">${favorites.length} super-héro${favorites.length > 1 ? 's' : ''}</p>
                <div class="heroes-grid">
        `;

        favorites.forEach(hero => {
            const avgRating = hero.averageRating || 0;
            html += `
                <article class="hero-card">
                    <div class="hero-card-image">
                        <img 
                            src="${hero.image || 'https://via.placeholder.com/300x400?text=No+Image'}"
                            alt="${hero.name}"
                            loading="lazy"
                        >
                        <button class="favorite-btn active" 
                                data-hero-id="${hero.id}"
                                title="Retirer des favoris">
                            ♥
                        </button>
                    </div>
                    <div class="hero-card-body">
                        <h3>${services_Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-alias">${services_Utils.escapeHtml(hero.alias)}</p>
                        <p class="hero-publisher">${services_Utils.escapeHtml(hero.publisher)}</p>
                        
                        ${avgRating > 0 ? `
                            <div class="hero-rating">
                                <span class="stars">${this.renderStars(avgRating)}</span>
                                <span class="rating-value">${avgRating.toFixed(1)}/5</span>
                            </div>
                        ` : ''}
                        
                        <a href="#/hero/${hero.id}" class="btn btn-small">Détails</a>
                    </div>
                </article>
            `;
        });

        html += '</div></section>';
        return html;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (hasHalf) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    attachListeners() {
        const appElement = document.getElementById('app');

        appElement.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const heroId = parseInt(btn.dataset.heroId);
                const hero = services_HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    services_HeroProvider.toggleFavorite(hero);
                    window.location.hash = '#/favorites';
                }
            });
        });
    }
}

/* harmony default export */ const pages_Favorites = (Favorites);

;// ./js/views/pages/About.js
/**
 * Page À propos
 */
class About {
    render() {
        return `
            <section class="about-section">
                <div class="about-container">
                    <h2>À propos</h2>
                    
                    <div class="about-content">
                        <h3>🦸 Super-Héros Directory</h3>
                        <p>
                            Application web moderne pour découvrir, explorer et noter les super-héros 
                            de l'univers DC Comics et Marvel. Créez votre répertoire personnel avec 
                            vos héros préférés.
                        </p>

                        <h3>🎯 Objectifs</h3>
                        <ul>
                            <li>Fournir une base de données complète des super-héros</li>
                            <li>Permettre une notation et un système de favoris personnalisé</li>
                            <li>Offrir une expérience utilisateur intuitive et responsive</li>
                            <li>Démontrer les bonnes pratiques de développement web moderne</li>
                        </ul>

                        <h3>📚 Fonctionnalités</h3>
                        <ul>
                            <li>🎨 SPA (Single Page Application) avec routeur personnalisé</li>
                            <li>📄 Pagination de la liste des héros (9 par page)</li>
                            <li>🔍 Système de recherche en temps réel</li>
                            <li>⭐ Système de notation (1-5 étoiles avec commentaires)</li>
                            <li>❤️ Gestion des favoris avec localStorage</li>
                            <li>🖼️ Lazy loading des images</li>
                            <li>📊 Statistiques de puissance pour chaque héro</li>
                            <li>🏢 Filtrage par éditeur (DC Comics, Marvel, etc.)</li>
                            <li>📦 Architecture modulaire avec Webpack</li>
                        </ul>

                        <h3>💾 Stockage des données</h3>
                        <ul>
                            <li><strong>Héros:</strong> Fichier local data.json (charqement au démarrage)</li>
                            <li><strong>Favoris:</strong> localStorage avec clé 'hero_favorites'</li>
                            <li><strong>Notations:</strong> localStorage avec clé 'hero_ratings'</li>
                        </ul>

                        <h3>🛠️ Stack technique</h3>
                        <ul>
                            <li>HTML5 & CSS3 (responsive design)</li>
                            <li>Vanilla JavaScript (ES6 modules)</li>
                            <li>Webpack (bundler production)</li>
                            <li>API SuperHero (intégration optionnelle)</li>
                        </ul>

                        <h3>📋 Données JSON Relationnel</h3>
                        <p>
                            La structure de données utilise un format relationnel avec:
                        </p>
                        <ul>
                            <li>Table <strong>heroes</strong> (propriétés individuelles)</li>
                            <li>Table <strong>teams</strong> (relations n-n via heroIds)</li>
                            <li>Table <strong>ratings</strong> (relations 1-n avec héros)</li>
                        </ul>

                        <h3>📝 Version</h3>
                        <p><strong>1.0.0</strong> | Année 2026 | Développement académique</p>

                        <div class="about-actions">
                            <a href="#/heroes" class="btn btn-primary">Explorer les héros</a>
                            <a href="#/favorites" class="btn btn-secondary">Vos favoris</a>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

/* harmony default export */ const pages_About = (About);

;// ./js/views/pages/Error404.js
/**
 * Page d'erreur 404
 */
class Error404 {
    render() {
        return `
            <section class="error-404">
                <div class="error-container">
                    <h1>404</h1>
                    <h2>Page non trouvée</h2>
                    <p>
                        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
                    </p>
                    <div class="error-actions">
                        <a href="#/" class="btn btn-primary">Retour à l'accueil</a>
                        <a href="#/heroes" class="btn btn-secondary">Voir les super-héros</a>
                    </div>
                </div>
            </section>
        `;
    }
}

/* harmony default export */ const pages_Error404 = (Error404);

;// ./js/app.js



// Importer les pages







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
        console.log(`🦸 ${config.app.name} v${config.app.version}`);

        // Charger les données
        this.heroes = await services_HeroProvider.loadHeroes();
        services_HeroProvider.loadRatings();
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
        const debouncedSearch = services_Utils.debounce((query) => {
            this.performSearch(query);
        }, config.ui.debounceSearchDelay);

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
                page = new pages_Home();
                break;
            
            case 'heroes':
                // /heroes ou /heroes/:page
                const pageNum = params[0] || 1;
                page = new pages_HeroesList(pageNum);
                break;
            
            case 'hero':
                // /hero/:id
                const heroId = params[0];
                page = new pages_HeroDetail(heroId);
                break;
            
            case 'favorites':
                page = new pages_Favorites();
                break;
            
            case 'about':
                page = new pages_About();
                break;
            
            default:
                page = new pages_Error404();
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
        this.searchResults = services_HeroProvider.searchHeroes(query);
        
        if (this.searchResults.length === 0) {
            this.appElement.innerHTML = `
                <section class="search-results">
                    <div class="message info">
                        📭 Aucun super-héro trouvé pour "${services_Utils.escapeHtml(query)}"
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
                    <h2>Résultats pour "${services_Utils.escapeHtml(query)}"</h2>
                    <p>${results.length} super-héro${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
                </div>
                <div class="heroes-grid">
        `;

        results.forEach(hero => {
            const isFav = services_HeroProvider.isFavorite(hero.id);
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
                        <h3>${services_Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-publisher">${services_Utils.escapeHtml(hero.publisher)}</p>
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
                const hero = services_HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    const isFav = services_HeroProvider.toggleFavorite(hero);
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

/******/ })()
;
//# sourceMappingURL=main.js.map