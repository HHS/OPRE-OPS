/**
 * @typedef {Object} AgreementSearchResult
 * @property {number} id
 * @property {string} name
 * @property {string|null} nick_name
 * @property {string} agreement_type
 * @property {string|null} odn
 */

export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 100;

/**
 * Make an untrusted (URL-supplied) query safe to send: the API rejects NUL and anything over
 * MAX_SEARCH_LENGTH (HTTP 400). Used by both the results page and the header box so they agree on the text.
 * @param {string|null|undefined} value - The raw q value.
 * @returns {string} The query without NUL characters, capped to MAX_SEARCH_LENGTH and trimmed.
 */
export const sanitizeSearchQuery = (value) => (value ?? "").replaceAll("\u0000", "").slice(0, MAX_SEARCH_LENGTH).trim();

/** Labels for the field a search matched on. */
const MATCH_LABELS = {
    odn: "ODN",
    name: "Title",
    nick_name: "Nickname"
};

const includesIgnoreCase = (value, needle) =>
    typeof value === "string" && value.length > 0 && value.toLowerCase().includes(needle);

/**
 * Work out which field of a search result matched the query, for the "Matched on" text.
 * Priority mirrors how users think of the search: ODN, then title, then nickname.
 * Falls back to the title when nothing matches client-side (e.g. accent/collation differences).
 * @param {AgreementSearchResult} result - A result from GET /agreements-search/.
 * @param {string} q - The search text.
 * @returns {{field: string, label: string, value: string}} The matched field.
 */
export const getMatchedField = (result, q) => {
    const needle = (q ?? "").trim().toLowerCase();
    for (const field of ["odn", "name", "nick_name"]) {
        if (needle && includesIgnoreCase(result?.[field], needle)) {
            return { field, label: MATCH_LABELS[field], value: result[field] };
        }
    }
    return { field: "name", label: MATCH_LABELS.name, value: result?.name ?? "" };
};

/**
 * Split text around the first case-insensitive occurrence of `q`, for rendering with <mark>.
 * Uses indexOf (never a RegExp built from user input). If lowercasing changes the string length
 * (e.g. "İ"), highlighting is skipped rather than mis-slicing the original text.
 * @param {string|null|undefined} text - The text to split.
 * @param {string} q - The search text.
 * @returns {[string, string, string]} [before, match, after]; match is "" when nothing matches.
 */
export const splitHighlight = (text, q) => {
    const value = text ?? "";
    const needle = (q ?? "").trim().toLowerCase();
    if (!needle || !value) {
        return [value, "", ""];
    }
    const lowered = value.toLowerCase();
    if (lowered.length !== value.length) {
        return [value, "", ""];
    }
    const index = lowered.indexOf(needle);
    if (index === -1) {
        return [value, "", ""];
    }
    return [value.slice(0, index), value.slice(index, index + needle.length), value.slice(index + needle.length)];
};

/** What the search matches on, as listed in the info tip next to the box. */
export const SEARCH_INFO_ITEMS = [
    "Contract #",
    "Grant #",
    "Purchase order (PO) #",
    "Task order #",
    "Agreement title or nickname"
];

/** Rows and total from a search response, tolerating a missing `data` or `count`. */
export const normalizeSearchResponse = (response) => {
    const results = response?.data ?? [];
    return { results, count: response?.count ?? results.length };
};
