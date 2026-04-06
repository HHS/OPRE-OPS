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

/**
 * Normalizes an array of user-like objects by attaching a formatted `display_name`.
 * @param {Array<Object> | null | undefined} users
 * @returns {*} The normalized array, or the original non-array input unchanged.
 */
export const normalizeUsers = (users) => {
    if (!Array.isArray(users)) return users;
    return users.map(normalizeUser);
};

/**
 * Normalizes an array of raw name strings for display.
 * @param {Array<string> | null | undefined} names
 * @returns {*} The normalized array, or the original non-array input unchanged.
 */
export const normalizeNameStrings = (names) => {
    if (!Array.isArray(names)) return names;
    return names.map((name) => formatUserName(name));
};

/**
 * Normalizes embedded agreement people fields used by the UI.
 * @param {Object | null | undefined} agreement
 * @returns {Object | null | undefined}
 */
export const normalizeAgreementUsers = (agreement) => {
    if (!agreement || typeof agreement !== "object") return agreement;
    return {
        ...agreement,
        team_members: normalizeUsers(agreement.team_members),
        team_leaders: normalizeNameStrings(agreement.team_leaders),
        division_directors: normalizeNameStrings(agreement.division_directors)
    };
};

/**
 * Normalizes embedded project people fields used by the UI.
 * @param {Object | null | undefined} project
 * @returns {Object | null | undefined}
 */
export const normalizeProjectUsers = (project) => {
    if (!project || typeof project !== "object") return project;
    return {
        ...project,
        team_leaders: normalizeUsers(project.team_leaders),
        team_members: normalizeUsers(project.team_members),
        division_directors: normalizeNameStrings(project.division_directors)
    };
};

/**
 * Normalizes embedded portfolio people fields used by the UI.
 * @param {Object | null | undefined} portfolio
 * @returns {Object | null | undefined}
 */
export const normalizePortfolioUsers = (portfolio) => {
    if (!portfolio || typeof portfolio !== "object") return portfolio;
    return {
        ...portfolio,
        team_leaders: normalizeUsers(portfolio.team_leaders)
    };
};

/**
 * Normalizes embedded CAN people fields used by the UI.
 * @param {Object | null | undefined} can
 * @returns {Object | null | undefined}
 */
export const normalizeCanUsers = (can) => {
    if (!can || typeof can !== "object") return can;
    return {
        ...can,
        portfolio: normalizePortfolioUsers(can.portfolio)
    };
};
