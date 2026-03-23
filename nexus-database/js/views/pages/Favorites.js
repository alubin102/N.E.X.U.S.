/**
 * Page des super-héros favoris
 */
import HeroProvider from '../../services/HeroProvider.js';
import Utils from '../../services/Utils.js';

class Favorites {
    render() {
        const favorites = HeroProvider.getFavoriteHeroes();

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
                        <h3>${Utils.escapeHtml(hero.name)}</h3>
                        <p class="hero-alias">${Utils.escapeHtml(hero.alias)}</p>
                        <p class="hero-publisher">${Utils.escapeHtml(hero.publisher)}</p>
                        
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
                const hero = HeroProvider.getHeroById(heroId);
                
                if (hero) {
                    HeroProvider.toggleFavorite(hero);
                    window.location.hash = '#/favorites';
                }
            });
        });
    }
}

export default Favorites;
