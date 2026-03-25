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
        maxHeroId: 731,
        requestBatchSize: 8
    },
    
    storage: {
        favorites: 'hero_favorites',
        ratings: 'hero_ratings',
        theme: 'app_theme'
    },
    
    cache: {
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
        { path: '*', page: 'Error404' }
    ]
};

/* harmony default export */ const config = (CONFIG);

;// ./js/services/HeroProvider.js


class HeroProvider {
    static apiKey = config.api.apiKey;
    static baseUrl = config.api.baseUrl;
    static cache = new Map();
    static heroes = [];
    static ratings = [];
    static favoritesKey = 'hero_favorites';
    static ratingsKey = 'hero_ratings';
    static favorites = HeroProvider.loadFavorites();

    static loadFromCache() {
        try {
            const data = localStorage.getItem('hero_cache');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    static saveToCache(heroes) {
        try {
            localStorage.setItem('hero_cache', JSON.stringify(heroes));
        } catch (e) {
        }
    }

    static async loadHeroes() {
        let apiHeroes = HeroProvider.loadFromCache();

        if (apiHeroes === null) {
            apiHeroes = await HeroProvider.fetchAllApiHeroes();
            if (apiHeroes && apiHeroes.length > 0) {
                HeroProvider.saveToCache(apiHeroes);
            }
        }

        HeroProvider.heroes = HeroProvider.mergeHeroes([], apiHeroes || []);
        return HeroProvider.heroes;
    }

    static async fetchAllApiHeroes() {
        const maxHeroId = config.api.maxHeroId || 731;
        const batchSize = config.api.requestBatchSize || 8;
        const heroes = [];

        for (let start = 1; start <= maxHeroId; start += batchSize) {
            const end = Math.min(start + batchSize - 1, maxHeroId);
            const ids = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
            const batch = await Promise.all(ids.map(id => HeroProvider.fetchHeroById(id)));
            batch.forEach(hero => {
                if (hero) heroes.push(hero);
            });
        }

        return heroes;
    }

    static async fetchHeroById(id) {
        try {
            const response = await fetch(`${HeroProvider.baseUrl}/${HeroProvider.apiKey}/${id}`);
            if (!response.ok) return null;

            const apiHero = await response.json();
            if (!apiHero || apiHero.response !== 'success') return null;

            return HeroProvider.normalizeApiHero(apiHero);
        } catch (error) {
            return null;
        }
    }

    static normalizeApiHero(apiHero) {
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
            
            // Biography details
            biography: {
                fullName: apiHero.biography?.['full-name'] || '-',
                alterEgos: apiHero.biography?.['alter-egos'] || '-',
                firstAppearance: apiHero.biography?.['first-appearance'] || '-',
                placeOfBirth: apiHero.biography?.['place-of-birth'] || '-',
                publisher: apiHero.biography?.publisher || '-',
                alignment: apiHero.biography?.alignment || '-'
            },
            
            // Appearance details
            appearance: {
                gender: apiHero.appearance?.gender || '-',
                race: apiHero.appearance?.race || '-',
                height: apiHero.appearance?.height?.[0] || '-',
                weight: apiHero.appearance?.weight?.[0] || '-',
                eyeColor: apiHero.appearance?.['eye-color'] || '-',
                hairColor: apiHero.appearance?.['hair-color'] || '-'
            },
            
            // Work details
            work: {
                occupation: apiHero.work?.occupation || '-',
                base: apiHero.work?.base || '-'
            },
            
            // Connections
            connections: {
                groupAffiliation: apiHero.connections?.['group-affiliation'] || '-',
                relatives: apiHero.connections?.relatives || '-'
            },
            
            stats: {
                intelligence: HeroProvider.toNumber(apiHero.powerstats?.intelligence),
                strength: HeroProvider.toNumber(apiHero.powerstats?.strength),
                speed: HeroProvider.toNumber(apiHero.powerstats?.speed),
                durability: HeroProvider.toNumber(apiHero.powerstats?.durability),
                power: HeroProvider.toNumber(apiHero.powerstats?.power),
                combat: HeroProvider.toNumber(apiHero.powerstats?.combat)
            },
            ratings: [],
            averageRating: 0
        };
    }

    static toNumber(value) {
        const n = parseInt(value, 10);
        return Number.isNaN(n) ? 0 : n;
    }

    static mergeHeroes(localHeroes, apiHeroes) {
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

    static getAllHeroes() {
        return HeroProvider.heroes;
    }

    static getHeroById(id) {
        return HeroProvider.heroes.find(hero => hero.id === parseInt(id)) || null;
    }

    static searchHeroes(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        const q = query.toLowerCase();
        return HeroProvider.heroes.filter(hero =>
            (hero.name || '').toLowerCase().includes(q)
        );
    }

    static getHeroesByPublisher(publisher) {
        return HeroProvider.heroes.filter(hero => hero.publisher === publisher);
    }

    static getPublishers() {
        return [...new Set(HeroProvider.heroes.map(hero => hero.publisher).filter(Boolean))];
    }

    static loadFavorites() {
        try {
            const data = localStorage.getItem(HeroProvider.favoritesKey);
            return new Map(JSON.parse(data || '[]'));
        } catch (error) {
            console.error('Erreur chargement favoris:', error);
            return new Map();
        }
    }

    static saveFavorites() {
        try {
            const data = JSON.stringify(Array.from(HeroProvider.favorites.entries()));
            localStorage.setItem(HeroProvider.favoritesKey, data);
        } catch (error) {
            console.error('Erreur sauvegarde favoris:', error);
        }
    }

    static addFavorite(hero) {
        HeroProvider.favorites.set(hero.id, hero);
        HeroProvider.saveFavorites();
    }

    static removeFavorite(heroId) {
        HeroProvider.favorites.delete(heroId);
        HeroProvider.saveFavorites();
    }

    static isFavorite(heroId) {
        return HeroProvider.favorites.has(heroId);
    }

    static getFavoriteHeroes() {
        return Array.from(HeroProvider.favorites.values());
    }

    static toggleFavorite(hero) {
        if (HeroProvider.isFavorite(hero.id)) {
            HeroProvider.removeFavorite(hero.id);
            return false;
        } else {
            HeroProvider.addFavorite(hero);
            return true;
        }
    }

    static addRating(heroId, score, comment = '') {
        const hero = HeroProvider.getHeroById(heroId);
        if (!hero) return;

        const rating = {
            score: Math.max(1, Math.min(5, score)),
            comment,
            date: new Date().toISOString()
        };

        if (!hero.ratings) hero.ratings = [];
        hero.ratings.push(rating);
        HeroProvider.updateAverageRating(heroId);
        HeroProvider.saveRatings();
    }

    static getRatings(heroId) {
        const hero = HeroProvider.getHeroById(heroId);
        return hero ? (hero.ratings || []) : [];
    }

    static updateAverageRating(heroId) {
        const hero = HeroProvider.getHeroById(heroId);
        if (!hero || !hero.ratings || hero.ratings.length === 0) {
            if (hero) hero.averageRating = 0;
            return;
        }
        const average = hero.ratings.reduce((sum, r) => sum + r.score, 0) / hero.ratings.length;
        hero.averageRating = Math.round(average * 10) / 10;
    }

    static saveRatings() {
        try {
            const ratingsData = HeroProvider.heroes.map(h => ({
                id: h.id,
                ratings: h.ratings || [],
                averageRating: h.averageRating || 0
            }));
            localStorage.setItem(HeroProvider.ratingsKey, JSON.stringify(ratingsData));
        } catch (error) {
            console.error('Erreur sauvegarde notations:', error);
        }
    }

    static loadRatings() {
        try {
            const data = localStorage.getItem(HeroProvider.ratingsKey);
            if (!data) return;
            const ratingsData = JSON.parse(data);
            ratingsData.forEach(rd => {
                const hero = HeroProvider.getHeroById(rd.id);
                if (hero) {
                    hero.ratings = rd.ratings || [];
                    hero.averageRating = rd.averageRating || 0;
                }
            });
        } catch (error) {
            console.error('Erreur chargement notations:', error);
        }
    }

    static getFavoriteCount() {
        return HeroProvider.favorites.size;
    }

    static clearFavorites() {
        HeroProvider.favorites.clear();
        HeroProvider.saveFavorites();
    }
}


;// ./js/services/Utils.js
const Utils = {
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, char => map[char]);
    },

    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    },

    paginate(items, page = 1, pageSize = 10) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            items: items.slice(start, end),
            totalPages: Math.ceil(items.length / pageSize),
            currentPage: page,
            totalItems: items.length
        };
    },

    parseRequestURL() {
        const url = location.hash.slice(1).toLowerCase() || '/';
        const [, resource = null, id = null, verb = null] = url.split('/');
        return { resource, id, verb };
    }
};

/* harmony default export */ const services_Utils = (Utils);

;// ./js/loader.js

const SEQUENCES = [
    { label: 'INIT SYSTÈME',         msg: 'Initialisation des protocoles de sécurité...',  duration: 180 },
    { label: 'AUTH NIVEAU 5',         msg: 'Vérification des accréditations opérateur...',  duration: 160 },
    { label: 'ACCÈS BASE DE DONNÉES', msg: 'Connexion aux serveurs NEXUS — chiffrement AES-256...', duration: 200 },
    { label: 'CHARGEMENT AGENTS',     msg: 'Récupération des dossiers classifiés (1 247 entrées)...', duration: 240 },
    { label: 'DÉCHIFFREMENT',         msg: 'Déchiffrement des profils biométriques...', duration: 190 },
    { label: 'SYNCHRONISATION',       msg: 'Synchronisation index opérationnel...', duration: 160 },
    { label: 'CALIBRATION',           msg: 'Calibrage des capteurs — validation intégrité données...', duration: 140 },
    { label: 'SYSTÈME EN LIGNE',      msg: 'NEXUS opérationnel — accès autorisé.', duration: 80 },
];

const CSS = `
#nexus-boot {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: #04090e;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    font-family: 'Space Grotesk', 'Trebuchet MS', monospace;
}

#nexus-boot::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(0,0,0,0.12) 3px,
        rgba(0,0,0,0.12) 4px
    );
}

.nb-inner {
    position: relative;
    z-index: 2;
    width: min(520px, 88vw);
    display: flex;
    flex-direction: column;
    gap: 1.8rem;
}

.nb-brand {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.nb-title {
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: clamp(2.8rem, 7vw, 4rem);
    letter-spacing: 0.32em;
    color: #7ccc5a;
    line-height: 1;
    text-shadow: 0 0 28px rgba(124,204,90,0.45);
}

.nb-subtitle {
    font-size: 0.68rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #4a7a48;
}

.nb-hero-image {
    width: 180px;
    height: 240px;
    margin: 0 auto;
    border: 2px solid rgba(124,204,90,0.4);
    overflow: hidden;
    background: rgba(124,204,90,0.05);
    position: relative;
    box-shadow: 0 0 16px rgba(124,204,90,0.2), inset 0 0 16px rgba(124,204,90,0.1);
}

.nb-hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.9;
}

.nb-bar-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.nb-bar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.nb-seq-label {
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #7ccc5a;
    font-weight: 700;
}

.nb-pct {
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: #7ccc5a;
}

.nb-bar-wrap {
    width: 100%;
    height: 16px;
    background: rgba(124,204,90,0.07);
    border: 1px solid rgba(124,204,90,0.28);
    overflow: hidden;
    position: relative;
}

.nb-bar-fill {
    height: 100%;
    width: 0%;
    background: repeating-linear-gradient(
        60deg,
        #4a9632 0, #4a9632 9px,
        #3a7828 9px, #3a7828 18px
    );
    transition: width 0.08s linear;
    position: relative;
}

.nb-bar-fill::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 6px; height: 100%;
    background: #9de87a;
    opacity: 0.8;
    box-shadow: 0 0 8px #7ccc5a;
}

.nb-bar-segments {
    position: absolute;
    inset: 0;
    display: flex;
    pointer-events: none;
}

.nb-seg {
    flex: 1;
    border-right: 1px solid rgba(4,9,14,0.5);
}

.nb-log-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.nb-log {
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    color: #4a7a48;
    min-height: 4.5em;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 3px;
}

.nb-log-line {
    display: flex;
    gap: 6px;
    animation: nb-fadein 0.2s ease both;
}

.nb-log-prefix {
    color: rgba(124,204,90,0.4);
    flex-shrink: 0;
}

.nb-log-text {
    color: #5a8a58;
}

.nb-log-line.nb-ok .nb-log-text {
    color: #5adc9e;
}

.nb-cursor {
    display: inline-block;
    width: 7px; height: 0.85em;
    background: #7ccc5a;
    vertical-align: middle;
    margin-left: 2px;
    animation: nb-blink 0.7s step-end infinite;
}

.nb-status-row {
    display: flex;
    gap: 1.6rem;
    border-top: 1px solid rgba(124,204,90,0.15);
    padding-top: 0.9rem;
}

.nb-stat {
    font-size: 0.66rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3a6a38;
}

.nb-stat strong {
    color: #7ccc5a;
    font-weight: 700;
    display: block;
    font-size: 0.78rem;
    margin-top: 2px;
}

#nexus-boot.nb-done {
    animation: nb-fadeout 0.6s ease forwards;
}

@keyframes nb-fadein {
    from { opacity: 0; transform: translateX(-4px); }
    to   { opacity: 1; transform: translateX(0); }
}

@keyframes nb-blink {
    50% { opacity: 0; }
}

@keyframes nb-fadeout {
    0%   { opacity: 1; }
    100% { opacity: 0; pointer-events: none; }
}
`;

function buildLoader() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.id = 'nexus-boot';
    el.innerHTML = `
        <div class="nb-inner">
            <div class="nb-brand">
                <div class="nb-title">N.E.X.U.S.</div>
                <div class="nb-subtitle">Network of Enhanced eXpert Unified Systems</div>
            </div>

            <div class="nb-bar-section">
                <div class="nb-bar-header">
                    <span class="nb-seq-label" id="nb-seq-label">INIT SYSTÈME</span>
                    <span class="nb-pct" id="nb-pct">0%</span>
                </div>
                <div class="nb-bar-wrap">
                    <div class="nb-bar-fill" id="nb-fill"></div>
                    <div class="nb-bar-segments" id="nb-segs"></div>
                </div>
            </div>

            <div class="nb-log-section">
                <div class="nb-log" id="nb-log">
                    <div class="nb-log-line">
                        <span class="nb-log-prefix">&gt;</span>
                        <span class="nb-log-text">En attente de connexion...<span class="nb-cursor"></span></span>
                    </div>
                </div>
            </div>

            <div class="nb-status-row">
                <div class="nb-stat">Protocole<strong id="nb-proto">—</strong></div>
                <div class="nb-stat">Agents indexés<strong id="nb-agents">—</strong></div>
                <div class="nb-stat">Statut<strong id="nb-status">EN ATTENTE</strong></div>
            </div>
        </div>
    `;

    // Build bar segments
    const segsEl = el.querySelector('#nb-segs');
    SEQUENCES.forEach(() => {
        const s = document.createElement('div');
        s.className = 'nb-seg';
        segsEl.appendChild(s);
    });

    document.body.prepend(el);
    return el;
}

function addLog(text, ok = false) {
    const log = document.getElementById('nb-log');
    const cursor = log.querySelector('.nb-cursor');
    if (cursor) cursor.parentElement.remove();

    const line = document.createElement('div');
    line.className = 'nb-log-line' + (ok ? ' nb-ok' : '');
    line.innerHTML = `<span class="nb-log-prefix">&gt;</span><span class="nb-log-text">${text}<span class="nb-cursor"></span></span>`;
    log.appendChild(line);

    const lines = log.querySelectorAll('.nb-log-line');
    if (lines.length > 4) lines[0].remove();
}

function runSequence(el, seqIdx, globalPctStart, resolve) {
    if (seqIdx >= SEQUENCES.length) {
        resolve();
        return;
    }

    const seq = SEQUENCES[seqIdx];
    const globalPctEnd = Math.round(((seqIdx + 1) / SEQUENCES.length) * 100);
    const isLast = seqIdx === SEQUENCES.length - 1;

    document.getElementById('nb-seq-label').textContent = seq.label;
    addLog(seq.msg, isLast);

    if (seqIdx === 1) {
        document.getElementById('nb-proto').textContent = 'ALPHA-7';
    }
    if (seqIdx === 3) {
        document.getElementById('nb-agents').textContent = '1 247';
        document.getElementById('nb-status').textContent = 'CHARGEMENT';
        document.getElementById('nb-status').style.color = '#d4c24a';
    }
    if (isLast) {
        document.getElementById('nb-status').textContent = 'OPÉRATIONNEL';
        document.getElementById('nb-status').style.color = '#5adc9e';
    }

    let pct = globalPctStart;
    const steps = 30;
    const increment = (globalPctEnd - globalPctStart) / steps;
    const stepDelay = seq.duration / steps;

    let step = 0;
    const t = setInterval(() => {
        step++;
        pct = Math.min(globalPctStart + increment * step, globalPctEnd);
        document.getElementById('nb-fill').style.width = pct + '%';
        document.getElementById('nb-pct').textContent = Math.round(pct) + '%';

        if (step >= steps) {
            clearInterval(t);
            setTimeout(() => {
                runSequence(el, seqIdx + 1, globalPctEnd, resolve);
            }, 80);
        }
    }, stepDelay);
}

function runLoader() {
    return new Promise(resolve => {
        const el = buildLoader();
        runSequence(el, 0, 0, () => {
            setTimeout(() => {
                el.classList.add('nb-done');
                setTimeout(() => {
                    el.remove();
                    resolve();
                }, 650);
            }, 400);
        });
    });
}

function showLoader(sequences = SEQUENCES, title = 'N.E.X.U.S.', duration = 0, heroImage = null) {
    return new Promise(resolve => {
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        const el = document.createElement('div');
        el.id = 'nexus-boot';
        el.innerHTML = `
            <div class="nb-inner">
                <div class="nb-brand">
                    <div class="nb-title">${title}</div>
                    <div class="nb-subtitle">${heroImage ? 'Chargement profil...' : 'Chargement en cours...'}</div>
                </div>

                ${heroImage ? `
                    <div class="nb-hero-image">
                        <img src="${heroImage}" alt="Profil" />
                    </div>
                ` : ''}

                <div class="nb-bar-section">
                    <div class="nb-bar-header">
                        <span class="nb-seq-label" id="nb-seq-label">${sequences[0]?.label || 'CHARGEMENT'}</span>
                        <span class="nb-pct" id="nb-pct">0%</span>
                    </div>
                    <div class="nb-bar-wrap">
                        <div class="nb-bar-fill" id="nb-fill"></div>
                        <div class="nb-bar-segments" id="nb-segs"></div>
                    </div>
                </div>

                <div class="nb-log-section">
                    <div class="nb-log" id="nb-log">
                        <div class="nb-log-line">
                            <span class="nb-log-prefix">&gt;</span>
                            <span class="nb-log-text">En attente de connexion...<span class="nb-cursor"></span></span>
                        </div>
                    </div>
                </div>

                <div class="nb-status-row">
                    <div class="nb-stat">Protocole<strong id="nb-proto">—</strong></div>
                    <div class="nb-stat">Agents indexés<strong id="nb-agents">—</strong></div>
                    <div class="nb-stat">Statut<strong id="nb-status">EN ATTENTE</strong></div>
                </div>
            </div>
        `;

        const segsEl = el.querySelector('#nb-segs');
        sequences.forEach(() => {
            const s = document.createElement('div');
            s.className = 'nb-seg';
            segsEl.appendChild(s);
        });

        document.body.prepend(el);

        const nextStep = (seqIdx, globalPctStart) => {
            if (seqIdx >= sequences.length) {
                setTimeout(() => {
                    el.classList.add('nb-done');
                    setTimeout(() => {
                        el.remove();
                        style.remove();
                        resolve();
                    }, 650);
                }, 400);
                return;
            }

            const seq = sequences[seqIdx];
            const globalPctEnd = Math.round(((seqIdx + 1) / sequences.length) * 100);
            const isLast = seqIdx === sequences.length - 1;

            document.getElementById('nb-seq-label').textContent = seq.label;
            addLog(seq.msg, isLast);

            if (seqIdx === 1) {
                document.getElementById('nb-proto').textContent = 'ALPHA-7';
            }
            if (seqIdx === sequences.length - 1) {
                document.getElementById('nb-status').textContent = 'OPÉRATIONNEL';
                document.getElementById('nb-status').style.color = '#5adc9e';
            }

            let pct = globalPctStart;
            const steps = 30;
            const increment = (globalPctEnd - globalPctStart) / steps;
            const stepDelay = seq.duration / steps;

            let step = 0;
            const t = setInterval(() => {
                step++;
                pct = Math.min(globalPctStart + increment * step, globalPctEnd);
                document.getElementById('nb-fill').style.width = pct + '%';
                document.getElementById('nb-pct').textContent = Math.round(pct) + '%';

                if (step >= steps) {
                    clearInterval(t);
                    setTimeout(() => {
                        nextStep(seqIdx + 1, globalPctEnd);
                    }, 80);
                }
            }, stepDelay);
        };

        nextStep(0, 0);
    });
}

document.documentElement.style.overflow = 'hidden';

runLoader().then(() => {
    document.documentElement.style.overflow = '';
});
;// ./js/views/pages/Home.js



class Home {
    async render() {
        const heroes = HeroProvider.getAllHeroes();
        const heroCount = heroes.length;
        const favoriteCount = HeroProvider.getFavoriteCount();
        const threatLevel = this.calculateThreatLevel(heroes);
        const lastUpdated = new Date().toLocaleTimeString('fr-FR');

        return `
            <section class="home-section">
                <!-- SYSTÈME DE LOGS TERMINAL -->
                <div class="home-hero terminal-screen">
                    <div class="sys-status">
                        <span>[ SYS.OP : ONLINE ]</span>
                        <span>ACCRÉDITATION : NIVEAU 7</span>
                        <span>RÉSEAU : SÉCURISÉ</span>
                        <span>TIMESTAMP : ${lastUpdated}</span>
                    </div>

                    <h2>
                        <span class="typing-text">ACCÈS AUTORISÉ : N.E.X.U.S.</span><span class="cursor"></span>
                    </h2>
                    <p class="tagline">système global d'identification des menaces métahumaines</p>

                    <div class="terminal-logs">
                        <p>> Initialisation du protocole de sécurité... <span class="text-ok">[OK]</span></p>
                        <p>> Décryptage des dossiers classifiés... <span class="text-ok">[OK]</span></p>
                        <p>> Chargement de la base de données... <span class="text-ok">[${heroCount} ENTRÉES]</span></p>
                        <p>> Connexion au réseau satellite tactique... <span class="text-ok">[ÉTABLIE]</span></p>
                        <p>> Analyse des niveaux de menace... <span class="text-ok">[${threatLevel}]</span></p>
                        <p class="blink-text">> En attente de commande opérateur_</p>
                    </div>

                    <div class="home-actions">
                        <a href="#/heroes" class="btn btn-primary">[ INITIALISER LA RECHERCHE ]</a>
                        <a href="#/favorites" class="btn btn-secondary">[ ACCÉDER AUX ARCHIVES ]</a>
                    </div>
                </div>

                <!-- PANNEAU DE STATISTIQUES -->
                <div class="stats-panel">
                    <div class="stat-card primary-stat">
                        <div class="stat-header">SUJETS RÉFÉRENCÉS</div>
                        <div class="stat-number">${heroCount.toLocaleString('fr-FR')}</div>
                        <div class="stat-subtext">entités métahumaines</div>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width: ${Math.min(heroCount / 100, 100)}%"></div>
                        </div>
                    </div>

                    <div class="stat-card threat-stat">
                        <div class="stat-header">NIVEAU DE MENACE</div>
                        <div class="stat-number threat-display">${threatLevel}</div>
                        <div class="stat-subtext">menace globale</div>
                        <div class="threat-indicator ${this.getThreatClass(threatLevel)}"></div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">FAVORIS ARCHIVÉS</div>
                        <div class="stat-number">${favoriteCount}</div>
                        <div class="stat-subtext">sujets marqués</div>
                        <div class="stat-bar">
                            <div class="stat-bar-fill accent-warning" style="width: ${Math.min((favoriteCount / heroCount) * 100, 100)}%"></div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">OPÉRATIONS ACTIVES</div>
                        <div class="stat-number">${Math.floor(heroCount / 10)}</div>
                        <div class="stat-subtext">missions en cours</div>
                        <div class="stat-indicator active-ops"></div>
                    </div>
                </div>

            </section>
        `;
    }

    calculateThreatLevel(heroes) {
        const avgPower = heroes.reduce((sum, h) => sum + (h.powerstats?.overall || 0), 0) / heroes.length;
        if (avgPower >= 75) return 'DEFCON 1 (CRITIQUE)';
        if (avgPower >= 60) return 'DEFCON 2 (ÉLEVÉ)';
        if (avgPower >= 45) return 'DEFCON 3 (MODÉRÉ)';
        return 'DEFCON 4 (STABLE)';
    }

    getThreatClass(threatLevel) {
        if (threatLevel.includes('DEFCON 1')) return 'threat-critical';
        if (threatLevel.includes('DEFCON 2')) return 'threat-high';
        if (threatLevel.includes('DEFCON 3')) return 'threat-moderate';
        return 'threat-low';
    }
}

/* harmony default export */ const pages_Home = (Home);

;// ./js/views/pages/HeroesList.js



class HeroesList {
    constructor(page = 1) {
        this.page = parseInt(page) || 1;
        this.pageSize = 9;
        this.heroes = HeroProvider.getAllHeroes();
        this.filteredHeroes = this.heroes;
        this.currentPublisher = null;
    }

    async render() {
        const totalPages = Math.ceil(this.filteredHeroes.length / this.pageSize);
        if (this.page > totalPages && totalPages > 0) {
            this.page = totalPages;
        }

        const pagination = services_Utils.paginate(this.filteredHeroes, this.page, this.pageSize);
        const publishers = HeroProvider.getPublishers();

        if (this.filteredHeroes.length === 0) {
            const html = `
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
                        Aucun super-héro trouvé
                    </div>
                </section>
            `;
            setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                appElement.innerHTML = html;

                const publisherFilter = appElement.querySelector('#publisher-filter');
                if (publisherFilter) {
                    publisherFilter.addEventListener('change', (e) => {
                        this.currentPublisher = e.target.value;
                        this.filteredHeroes = this.currentPublisher 
                            ? HeroProvider.getHeroesByPublisher(this.currentPublisher)
                            : this.heroes;
                        this.page = 1;
                        this.reRender();
                    });
                }

                this.attachFavoriteListeners();
                this.initLazyLoading();
            }, 0);

            return html;
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
            const isFav = HeroProvider.isFavorite(hero.id);
            const avgRating = hero.averageRating || 0;
            
            html += `
                <article class="hero-card" data-hero-id="${hero.id}">
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
        setTimeout(() => {
            const appElement = document.getElementById('app');
            if (!appElement) return;
            appElement.innerHTML = html;

            const publisherFilter = appElement.querySelector('#publisher-filter');
            if (publisherFilter) {
                publisherFilter.addEventListener('change', (e) => {
                    this.currentPublisher = e.target.value;
                    this.filteredHeroes = this.currentPublisher 
                        ? HeroProvider.getHeroesByPublisher(this.currentPublisher)
                        : this.heroes;
                    this.page = 1;
                    this.reRender();
                });
            }

            this.attachFavoriteListeners();
            this.initLazyLoading();
        }, 0);

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

    attachFavoriteListeners() {
        const appElement = document.getElementById('app');
        appElement.querySelectorAll('.favorite-btn').forEach(btn => {
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

    async reRender() {
        await this.render();
    }
}

/* harmony default export */ const pages_HeroesList = (HeroesList);

;// ./js/views/pages/HeroDetail.js



class HeroDetail {
    constructor(heroId) {
        this.heroId = parseInt(heroId);
        this.hero = HeroProvider.getHeroById(this.heroId);
    }

    async render() {
        if (!this.hero) {
            const html = `
                <div class="message error">
                    Super-héro non trouvé
                </div>
            `;
            setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                appElement.innerHTML = html;
            }, 0);
            return html;
        }

        const isFav = HeroProvider.isFavorite(this.hero.id);
        const ratings = HeroProvider.getRatings(this.hero.id) || [];
        const avgRating = this.hero.averageRating || 0;
        const stats = this.hero.stats || {};
        const biography = this.hero.biography || {};
        const appearance = this.hero.appearance || {};
        const work = this.hero.work || {};
        const connections = this.hero.connections || {};

        const html = `
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

                        <div class="hero-info-sections">
                            ${this.renderBiographySection(biography)}
                            ${this.renderAppearanceSection(appearance)}
                            ${this.renderWorkSection(work)}
                            ${this.renderConnectionsSection(connections)}
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

        setTimeout(() => {
            const appElement = document.getElementById('app');
            if (!appElement) return;
            appElement.innerHTML = html;

            const favBtn = appElement.querySelector('.favorite-btn');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isFav = HeroProvider.toggleFavorite(this.hero);
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
                    if (selectedRatingDisplay) {
                        selectedRatingDisplay.textContent = `${selectedRating}/5 sélectionné`;
                    }
                    starBtns.forEach((b, idx) => {
                        b.classList.toggle('active', idx < selectedRating);
                    });
                });

                btn.addEventListener('mouseenter', () => {
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

                    const commentElement = appElement.querySelector('#rating-comment');
                    const comment = commentElement ? commentElement.value : '';
                    HeroProvider.addRating(this.hero.id, selectedRating, comment);
                    
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
        }, 0);

        return html;
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

    renderBiographySection(biography) {
        return `
            <div class="info-section biography-section">
                <h2>Biographie</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Nom complet:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.fullName)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Alter-ego:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.alterEgos)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Première apparition:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.firstAppearance)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Lieu de naissance:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.placeOfBirth)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Éditeur:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.publisher)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Alignement:</span>
                        <span class="info-value">${services_Utils.escapeHtml(biography.alignment)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderAppearanceSection(appearance) {
        return `
            <div class="info-section appearance-section">
                <h2>Apparence</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Genre:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.gender)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Race:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.race)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Couleur des yeux:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.eyeColor)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Couleur des cheveux:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.hairColor)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Hauteur:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.height)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Poids:</span>
                        <span class="info-value">${services_Utils.escapeHtml(appearance.weight)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderWorkSection(work) {
        return `
            <div class="info-section work-section">
                <h2>Occupation</h2>
                <div class="info-grid">
                    <div class="info-item full-width">
                        <span class="info-label">Occupation:</span>
                        <span class="info-value">${services_Utils.escapeHtml(work.occupation)}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="info-label">Base:</span>
                        <span class="info-value">${services_Utils.escapeHtml(work.base)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderConnectionsSection(connections) {
        return `
            <div class="info-section connections-section">
                <h2>Connexions</h2>
                <div class="info-grid">
                    <div class="info-item full-width">
                        <span class="info-label">Groupe d'affiliation:</span>
                        <span class="info-value">${services_Utils.escapeHtml(connections.groupAffiliation)}</span>
                    </div>
                    <div class="info-item full-width">
                        <span class="info-label">Proches:</span>
                        <span class="info-value">${services_Utils.escapeHtml(connections.relatives)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    
}

/* harmony default export */ const pages_HeroDetail = (HeroDetail);

;// ./js/views/pages/Favorites.js




class Favorites {
    async render() {
        const favorites = HeroProvider.getFavoriteHeroes();

        if (favorites.length === 0) {
            const html = `
                <section class="favorites-section">
                    <h2>Mes Favoris</h2>
                    <div class="message info">
                        Vous n'avez pas encore de favoris.
                        <p><a href="#/heroes" class="link">Découvrez les super-héros</a></p>
                    </div>
                </section>
            `;
            setTimeout(() => {
                const appElement = document.getElementById('app');
                if (!appElement) return;
                appElement.innerHTML = html;
                this.attachFavoriteListeners();
            }, 0);
            return html;
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
                <article class="hero-card" data-hero-id="${hero.id}">
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

        setTimeout(() => {
            const appElement = document.getElementById('app');
            if (!appElement) return;
            appElement.innerHTML = html;
            this.attachFavoriteListeners();
        }, 0);

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

    attachFavoriteListeners() {
        const appElement = document.getElementById('app');
        appElement.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const heroId = parseInt(btn.dataset.heroId);
                const hero = HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    HeroProvider.toggleFavorite(hero);
                    window.location.hash = '#/favorites';
                }
            });
        });
    }
}

/* harmony default export */ const pages_Favorites = (Favorites);

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













const routes = {
    '/': pages_Home,
    '/home': pages_Home,
    '/heroes': pages_HeroesList,
    '/heroes/:id': pages_HeroesList,
    '/hero/:id': pages_HeroDetail,
    '/favorites': pages_Favorites
};



let appElement = null;
let searchInput = null;
let mainNav = null;
let currentPage = null;
let dataLoaded = false;

function initDomReferences() {
    if (appElement) return;
    appElement = document.getElementById('app');
    searchInput = document.getElementById('search-input');
    mainNav = document.getElementById('main-nav');
}


function attachCardNavigation() {
    if (!appElement) return;
    appElement.addEventListener('click', async (e) => {
 
        if (e.target.closest('.favorite-btn')) return;

        const card = e.target.closest('.hero-card');
        if (!card) return;

        const heroId = card.dataset.heroId || card.getAttribute('data-hero-id');
        if (!heroId) return;


        const hero = HeroProvider.getHeroById(heroId);
        const heroImage = hero?.image || null;

  
        const profileSequences = [
            { label: 'ACCÈS PROFIL',          msg: "Récupération du dossier de l'agent classifié...",  duration: 140 },
            { label: 'BIOMÉTRIE',            msg: 'Scan biométrique et analyse ADN...',                duration: 130 },
            { label: 'POUVOIRS DÉTECTÉS',    msg: 'Analyse des capacités métahumaines...',            duration: 150 },
            { label: 'HISTORIQUE',           msg: 'Consultation des archives opérationnelles...',      duration: 120 },
            { label: 'SYNCHRONISATION',      msg: 'Synchronisation données tactiques...',              duration: 110 },
            { label: 'PROFIL CHARGÉ',        msg: 'Profil complet disponible - ACCÈS AUTORISÉ.',      duration: 95 },
        ];

        await showLoader(profileSequences, 'PROFIL AGENT', 0, heroImage);

    
        const transitionScreen = document.createElement('div');
        transitionScreen.id = 'transition-screen-loader';
        transitionScreen.style.cssText = `
            position: fixed;
            inset: 0;
            background: #04090e;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(transitionScreen);

   
        window.location.hash = `#/hero/${heroId}`;
        
       
        setTimeout(router, 50);
    });
}

async function ensureDataLoaded() {
    if (dataLoaded) return;

    console.log(` ${config.app.name} v${config.app.version}`);

    const heroes = await HeroProvider.loadHeroes();
    HeroProvider.loadRatings();
    dataLoaded = true;

    console.log(` ${heroes.length} super-héros chargés`);
}


function app_navigate(path) {
    if (!path.startsWith('/')) path = '/' + path;
    window.location.hash = `#${path}`;
}

function updateNavigation() {
    const hash = window.location.hash.substring(1) || '/';
    if (!mainNav) return;

    mainNav.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href').substring(1);

        if ((hash === '' || hash === '/') && href === '') {
            link.classList.add('active');
        } else if (hash.startsWith(href) && href !== '') {
            link.classList.add('active');
        }
    });
}

function setupNavigation() {
    if (!mainNav) return;

    mainNav.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-link')) {
            e.preventDefault();
            const href = e.target.getAttribute('href').substring(1);
            app_navigate(href);
        }
    });
}



function performSearch(query) {
    const results = HeroProvider.searchHeroes(query);

    if (!results || results.length === 0) {
        if (appElement) {
            appElement.innerHTML = `
                <section class="search-results">
                    <div class="message info">
                        📭 Aucun super-héro trouvé pour "${services_Utils.escapeHtml(query)}"
                    </div>
                </section>
            `;
        }
        return;
    }

    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    if (!appElement) return;

    let html = `
        <section class="search-results">
            <div class="search-header">
                <h2>Résultats pour "${services_Utils.escapeHtml(query)}"</h2>
                <p>${results.length} super-héro${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
            </div>
            <div class="heroes-grid">
    `;

    results.forEach(hero => {
        const isFav = HeroProvider.isFavorite(hero.id);
        const avgRating = hero.averageRating || 0;

        html += `
            <article class="hero-card" data-hero-id="${hero.id}">
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
    appElement.innerHTML = html;

    attachSearchListeners();
}

function attachSearchListeners() {
    if (!appElement) return;

    appElement.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const heroId = parseInt(btn.dataset.heroId, 10);
            const hero = HeroProvider.getHeroById(heroId);

            if (hero) {
                HeroProvider.toggleFavorite(hero);
                btn.classList.toggle('active');
            }
        });
    });
}

function setupSearch() {
    if (!searchInput) return;

    const debouncedSearch = services_Utils.debounce((query) => {
        performSearch(query);
    }, config.ui.debounceSearchDelay);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length === 0) {
            app_navigate('/heroes');
            return;
        }
        debouncedSearch(query);
    });
}


async function router() {
    initDomReferences();
    await ensureDataLoaded();

    if (!appElement) return;

    const request = services_Utils.parseRequestURL();


    let routeKey;
    if (!request.resource) {
        routeKey = '/';
    } else if (request.resource === 'hero' && request.id) {
        routeKey = '/hero/:id';
    } else {
        routeKey = `/${request.resource}`;
    }

    const PageClass = routes[routeKey] || pages_Error404;

    let pageInstance;
    if (PageClass === pages_HeroesList) {
        const pageNum = request.id || 1;
        pageInstance = new pages_HeroesList(pageNum);
    } else if (PageClass === pages_HeroDetail) {
        const heroId = request.id;
        pageInstance = new pages_HeroDetail(heroId);
    } else {
        pageInstance = new PageClass();
    }

    updateNavigation();
    if (searchInput) {
        searchInput.value = '';
    }

    currentPage = pageInstance;
    appElement.innerHTML = await pageInstance.render();


    const transitionScreen = document.getElementById('transition-screen-loader');
    if (transitionScreen) {
        transitionScreen.remove();
    }
}



window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    initDomReferences();
    setupNavigation();
    setupSearch();
    router();
});


window.addEventListener('load', () => {
    initDomReferences();
    attachCardNavigation();
});

/******/ })()
;
//# sourceMappingURL=main.js.map