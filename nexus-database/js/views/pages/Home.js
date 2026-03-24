/**
 * Page d'accueil - Terminal Opérationnel N.E.X.U.S.
 */
import HeroProvider from '../../services/HeroProvider.js';

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

export default Home;
