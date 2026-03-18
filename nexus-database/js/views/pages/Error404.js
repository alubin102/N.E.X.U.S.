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

export default Error404;
