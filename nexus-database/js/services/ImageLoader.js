/**
 * Service de gestion du lazy loading des images
 * Utilise IntersectionObserver pour charger les images à la demande
 */

class ImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.01,
            placeholderColor: options.placeholderColor || '#f0f0f0',
            ...options
        };

        this.imageMap = new WeakMap();
        this.initObserver();
    }

    /**
     * Initialise l'IntersectionObserver
     */
    initObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        });
    }

    /**
     * Charge une image
     * @param {HTMLImageElement} img - L'élément image à charger
     */
    loadImage(img) {
        const src = img.dataset.src || img.getAttribute('data-src');
        const srcset = img.dataset.srcset || img.getAttribute('data-srcset');

        if (!src) {
            this.observer.unobserve(img);
            return;
        }

        // Ajouter une classe de chargement
        img.classList.add('lazy-loading');

        // Créer une image temporaire pour vérifier que la source existe
        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = src;
            if (srcset) {
                img.srcset = srcset;
            }
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            this.observer.unobserve(img);
            
            // Déclencher un événement personnalisé
            img.dispatchEvent(new Event('lazyloaded'));
        };

        tempImg.onerror = () => {
            // Si l'image ne peut pas être chargée, utiliser un placeholder
            this.setFallbackImage(img);
            this.observer.unobserve(img);
            
            // Déclencher un événement personnalisé d'erreur
            img.dispatchEvent(new Event('lazyloaderror'));
        };

        // Lancer le chargement
        tempImg.src = src;
    }

    /**
     * Définit une image par défaut en cas d'erreur
     * @param {HTMLImageElement} img
     */
    setFallbackImage(img) {
        const fallback = img.dataset.fallback || 
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"%3E%3Crect fill="%23f0f0f0" width="300" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
        
        img.src = fallback;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
    }

    /**
     * Enregistre une image pour le lazy loading
     * @param {HTMLImageElement} img
     */
    observe(img) {
        if (img.classList.contains('lazy-load') || img.dataset.src) {
            this.observer.observe(img);
        }
    }

    /**
     * Enregistre toutes les images avec la classe 'lazy-load'
     * @param {HTMLElement} container - Le conteneur où chercher les images (par défaut document)
     */
    observeAll(container = document) {
        const lazyImages = container.querySelectorAll('img[data-src], img.lazy-load');
        lazyImages.forEach(img => this.observe(img));
    }

    /**
     * Arrête d'observer une image
     * @param {HTMLImageElement} img
     */
    unobserve(img) {
        this.observer.unobserve(img);
    }

    /**
     * Arrête d'observer toutes les images
     */
    disconnect() {
        this.observer.disconnect();
    }

    /**
     * Recharge les images non chargées
     */
    reload() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.initObserver();
        this.observeAll();
    }
}

// Export comme singleton
const imageLoader = new ImageLoader();

export default imageLoader;
