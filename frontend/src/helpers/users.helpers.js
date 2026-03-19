/**
 * Detects whether a string is entirely uppercase (ignoring whitespace and punctuation).
 * Returns false for null/undefined/empty or strings that already have lowercase letters.
 * @param {string | null | undefined} str
 * @returns {boolean}
 */
const isAllCaps = (str) => {
    if (!str || typeof str !== "string") return false;
    const letters = str.replace(/[^a-zA-Z]/g, "");
    return letters.length > 0 && letters === letters.toUpperCase();
};

/**
 * The set of name suffixes that should remain uppercased when we title-case a name.
 * e.g. "JOHN SMITH JR" -> "John Smith JR"
 */
const UPPERCASE_SUFFIXES = new Set(["JR", "SR", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]);

/**
 * Title-cases a single word segment, respecting hyphen and apostrophe boundaries.
 * e.g. "O'NEIL" -> "O'Neil", "ANNE-MARIE" -> "Anne-Marie"
 * @param {string} word
 * @returns {string}
 */
const titleCaseWord = (word) => {
    if (UPPERCASE_SUFFIXES.has(word)) return word;

    // Handle hyphenated words: split, title-case each, rejoin
    if (word.includes("-")) {
        return word
            .split("-")
            .map((part) => titleCaseWord(part))
            .join("-");
    }

    // Handle apostrophe words: split, title-case each, rejoin
    if (word.includes("'")) {
        return word
            .split("'")
            .map((part) => titleCaseWord(part))
            .join("'");
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

/**
 * Formats a user's display name for the UI.
 *
 * - If the name is entirely uppercase (as AMS provides), title-case it for display.
 * - If it already contains lowercase letters (e.g. "DeAngelis", "McCall"), leave it unchanged.
 * - Common suffixes (JR, SR, II, III, IV, etc.) are kept uppercase.
 * - Apostrophes and hyphens are handled so O'Neil and Anne-Marie format correctly.
 * - Returns the original value for null/undefined/empty/non-string inputs.
 *
 * @param {string | null | undefined} name - The raw name value from the backend/AMS.
 * @returns {string | null | undefined} The display-ready name, or the original value if it is null/undefined/empty/non-string.
 *
 * @example
 * formatUserName("JOHN SMITH")      // "John Smith"
 * formatUserName("O'NEIL")          // "O'Neil"
 * formatUserName("ANNE-MARIE")      // "Anne-Marie"
 * formatUserName("JOHN SMITH JR")   // "John Smith JR"
 * formatUserName("DeAngelis")       // "DeAngelis"  (unchanged)
 * formatUserName("McCall")          // "McCall"     (unchanged)
 * formatUserName(null)              // null
 */
export const formatUserName = (name) => {
    if (!name || typeof name !== "string") return name;
    if (!isAllCaps(name)) return name;

    return name
        .trim()
        .split(/\s+/)
        .map((word) => titleCaseWord(word))
        .join(" ");
};

/**
 * Derives a display-ready full name from a user object.
 * Applies formatUserName to full_name if present, otherwise falls back to first_name, then email.
 *
 * @param {{ full_name?: string | null, first_name?: string | null, email?: string | null }} user
 * @returns {string | null | undefined}
 */
export const getUserDisplayName = (user) => {
    if (!user) return null;
    if (user.full_name) return formatUserName(user.full_name);
    if (user.first_name) return formatUserName(user.first_name);
    return user.email ?? null;
};

/**
 * Adds a `display_name` field to a user object derived from their name fields.
 * The raw `full_name` is preserved unchanged; `display_name` is the formatted value
 * safe to render directly in the UI.
 *
 * This is the single canonical normalizer used at all API boundaries (RTK Query
 * transformResponse and legacy getUser helpers) to avoid duplication and drift.
 *
 * If the backend already provides a `display_name`, it is respected and only passed
 * through `formatUserName` to apply title-casing if it is all-caps. This ensures
 * any future backend-side display name logic is not discarded by the frontend.
 *
 * @param {Object} user
 * @returns {Object}
 */
export const normalizeUser = (user) => {
    if (!user || typeof user !== "object") return user;
    if (user.display_name) {
        // Backend provided a display_name — still apply title-case if it is all-caps.
        return { ...user, display_name: formatUserName(user.display_name) };
    }
    return {
        ...user,
        display_name: getUserDisplayName(user)
    };
};
