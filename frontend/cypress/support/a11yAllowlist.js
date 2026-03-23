const TEMPORARY_A11Y_ALLOWLIST = [];

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

const isSpecMatch = (specPattern, currentSpec) => {
    if (!currentSpec || !specPattern) {
        return false;
    }

    return currentSpec.endsWith(specPattern);
};

export const validateA11yAllowlist = () => {
    const today = new Date().toISOString().slice(0, 10);

    TEMPORARY_A11Y_ALLOWLIST.forEach((entry) => {
        const missingFields = ["id", "specPattern", "ruleId", "owner", "rationale", "expiresOn"].filter(
            (field) => !entry[field]
        );
        if (missingFields.length > 0) {
            throw new Error(
                `Invalid accessibility allowlist entry ${entry.id || "<unknown>"}; missing ${missingFields.join(", ")}`
            );
        }

        if (!dateOnlyRegex.test(entry.expiresOn)) {
            throw new Error(`Invalid expiresOn value for accessibility allowlist entry ${entry.id}: ${entry.expiresOn}`);
        }
        if (entry.expiresOn < today) {
            throw new Error(
                `Expired accessibility allowlist entry ${entry.id}; remove it or extend with justification.`
            );
        }
    });
};

export const isAllowedViolation = ({ specName, ruleId }) => {
    return TEMPORARY_A11Y_ALLOWLIST.some(
        (entry) => isSpecMatch(entry.specPattern, specName) && entry.ruleId === ruleId
    );
};

export const getAllowlistForSpec = (specName) =>
    TEMPORARY_A11Y_ALLOWLIST.filter((entry) => isSpecMatch(entry.specPattern, specName));
