export const getInternalPath = (href) => {
    if (!href) {
        return null;
    }

    if (href.startsWith("/")) {
        return href;
    }

    try {
        const url = new URL(href, window.location.origin);

        if (url.origin === window.location.origin) {
            return `${url.pathname}${url.search}${url.hash}`;
        }
    } catch {
        return null;
    }

    return null;
};
