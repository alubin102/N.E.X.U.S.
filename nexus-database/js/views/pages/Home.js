/**
 * Page d'accueil
 */
import HeroProvider from '../../services/HeroProvider.js';

class Home {
    async render() {
        const heroCount = HeroProvider.getAllHeroes().length;
        const favoriteCount = HeroProvider.getFavoriteCount();

        return `
            <section class="home-section">
                <div class="home-hero">
                    <h2>Bienvenue sur N.E.X.U.S.</h2>
                    <p>
                        Explorez ${heroCount} super-héro${heroCount > 1 ? 's' : ''} et gérez
                        ${favoriteCount} favori${favoriteCount > 1 ? 's' : ''}.
                    </p>
                    <div class="home-actions">
                        <a href="#/heroes" class="btn btn-primary">Voir les super-héros</a>
                        <a href="#/favorites" class="btn btn-secondary">Mes favoris</a>
                    </div>
                </div>
            </section>
        `;
    }
}

export default Home;
