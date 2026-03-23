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

export default CONFIG;
