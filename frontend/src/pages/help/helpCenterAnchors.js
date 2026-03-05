/**
 * Convert a heading into a stable, URL-friendly anchor slug.
 * @param {string} heading
 * @returns {string}
 */
export const toAnchorSlug = (heading) => {
    if (!heading || typeof heading !== "string") {
        return "";
    }

    return heading
        .toLowerCase()
        .trim()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
};

/**
 * Build deterministic, unique anchor ids for help center items.
 * @param {Array<{heading: string}>} items
 * @returns {string[]}
 */
export const buildAnchorIds = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    const slugCounts = new Map();

    return items.map((item, index) => {
        const baseSlug = toAnchorSlug(item?.heading) || `section-${index + 1}`;
        const count = (slugCounts.get(baseSlug) || 0) + 1;
        slugCounts.set(baseSlug, count);

        return count === 1 ? baseSlug : `${baseSlug}-${count}`;
    });
};

/**
 * Safely decode a location hash into an anchor id.
 * @param {string} hash
 * @returns {string}
 */
export const getAnchorIdFromHash = (hash) => {
    const hashWithoutPound = String(hash || "").replace("#", "");

    if (!hashWithoutPound) {
        return "";
    }

    try {
        return decodeURIComponent(hashWithoutPound);
    } catch {
        return hashWithoutPound;
    }
};
