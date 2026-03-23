import HeroProvider from '../../services/HeroProvider.js';
import Utils from '../../services/Utils.js';

class HeroDetail {
    constructor(heroId) {
        this.heroId = parseInt(heroId);
        this.hero = HeroProvider.getHeroById(this.heroId);
    }

    render() {
        if (!this.hero) {
            return `
                <div class="message error">
                    ⚠️ Super-héro non trouvé
                </div>
            `;
        }

        const isFav = HeroProvider.isFavorite(this.hero.id);
        const ratings = HeroProvider.getRatings(this.hero.id) || [];
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
                        <h1>${Utils.escapeHtml(this.hero.name)}</h1>
                        <p class="hero-alias">Alias: ${Utils.escapeHtml(this.hero.alias)}</p>
                        <p class="hero-publisher">Éditeur: ${Utils.escapeHtml(this.hero.publisher)}</p>
                        
                        <div class="hero-description">
                            ${Utils.escapeHtml(this.hero.description)}
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
                                                <p class="rating-comment">${Utils.escapeHtml(rating.comment)}</p>
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
    }

    
}

export default HeroDetail;
