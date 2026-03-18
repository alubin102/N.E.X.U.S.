import CONFIG from '../config.js';

class HeroProvider {
    constructor() {
        this.apiKey = CONFIG.api.apiKey;
        this.baseUrl = CONFIG.api.baseUrl;
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
            const response = await fetch(CONFIG.api.dataFile || '/data.json');
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
            if (!CONFIG.cache.enabled) return [];

            const metaRaw = localStorage.getItem(this.apiHeroesCacheMetaKey);
            const cacheRaw = localStorage.getItem(this.apiHeroesCacheKey);
            if (!metaRaw || !cacheRaw) return [];

            const meta = JSON.parse(metaRaw);
            const ttl = CONFIG.cache.apiHeroesTtl || 86400000;
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
            if (!CONFIG.cache.enabled) return;

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
        const maxHeroId = CONFIG.api.maxHeroId || 731;
        const batchSize = CONFIG.api.requestBatchSize || 8;
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

export default new HeroProvider();
