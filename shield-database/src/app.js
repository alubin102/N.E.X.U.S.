
class App {
    constructor() {
        this.appElement = document.getElementById('app');
        this.init();
    }

    async init() {
        console.log("Système N.E.X.U.S. activé...");
        this.renderHome();
        
    }

    renderHome() {
        this.appElement.innerHTML = `
            <section>
                <h2>Bienvenue sur N.E.X.U.S.</h2>
                <p>Accès aux dossiers en cours...</p>
            </section>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});