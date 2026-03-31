
import HeroProvider from '../../services/HeroProvider.js';

class Home {
    async render() {
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
                        <p>> Connexion au réseau satellite tactique... <span class="text-ok">[ÉTABLIE]</span></p>
                        <p class="blink-text">> En attente de commande opérateur_</p>
                    </div>

                    <div class="home-actions">
                        <a href="#/heroes" class="btn btn-primary">[ INITIALISER LA RECHERCHE ]</a>
                        <a href="#/favorites" class="btn btn-secondary">[ ACCÉDER AUX ARCHIVES ]</a>
                    </div>
                </div>

            </section>
        `;
    }
}

export default Home;
