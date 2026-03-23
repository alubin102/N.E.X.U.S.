/**
 * Page d'accueil
 */
import HeroProvider from '../../services/HeroProvider.js';

class Home {
    render() {
        const heroCount = HeroProvider.getAllHeroes().length;
        const favoriteCount = HeroProvider.getFavoriteCount();
        
        return `
            <section class="home-section">
                <div class="home-hero">
                    <h2>Bienvenue sur N.E.X.U.S.</h2>
                </div>
                    
                
            
        `;
    }
}

export default Home;
