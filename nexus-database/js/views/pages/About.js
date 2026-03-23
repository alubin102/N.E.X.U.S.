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

export default About;
