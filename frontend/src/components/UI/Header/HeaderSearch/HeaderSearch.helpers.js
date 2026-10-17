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
