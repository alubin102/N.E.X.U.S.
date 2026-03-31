const Utils = {
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, char => map[char]);
    },

    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    },

    paginate(items, page = 1, pageSize = 10) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return {
            items: items.slice(start, end),
            totalPages: Math.ceil(items.length / pageSize),
            currentPage: page,
            totalItems: items.length
        };
    },

    parseRequestURL() {
        const url = location.hash.slice(1) || '/';
        const [path, queryString] = url.split('?');
        const [, resource = null, id = null, verb = null] = path.toLowerCase().split('/');
        
        const queryParams = {};
        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                if (key) {
                    queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
                }
            });
        }
        
        return { resource, id, verb, queryParams };
    }
};

export default Utils;
