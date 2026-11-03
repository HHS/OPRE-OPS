/**
 * @typedef {Object} CorDivision
 * @property {number} id
 * @property {string} name
 * @property {string} abbreviation
 */

/**
 * @typedef {Object} Cor
 * @property {number} id
 * @property {string} name
 * @property {number | null} division_id
 * @property {string | null} [division_abbreviation] - Added on the frontend so tags can show the division.
 */

/**
 * @typedef {Object} DivisionStaffingOption
 * @property {string} id - Prefixed ("division-1", "cor-21") so division and user ids can't collide.
 * @property {string} title - The option text.
 * @property {number} order - Keeps each division's CORs right after it.
 * @property {"division" | "cor"} kind
 * @property {CorDivision | Cor} item - The division or COR the option stands for.
 */

/**
 * @param {CorDivision} division
 * @returns {string} e.g. "DCFD - Division of Child and Family Development"
 */
export const getDivisionOptionLabel = (division) => `${division.abbreviation} - ${division.name}`;

/**
 * @param {Cor} cor
 * @returns {string} e.g. "DCFD - Hank Smith", or just the name for a COR with no division.
 */
export const getCorOptionLabel = (cor) =>
    cor.division_abbreviation ? `${cor.division_abbreviation} - ${cor.name}` : cor.name;

const divisionOptionId = (id) => `division-${id}`;
const corOptionId = (id) => `cor-${id}`;

/**
 * Builds the "Division & Staffing" options: each division (by abbreviation), followed by its CORs
 * (by name), then the CORs with no division, ungrouped (by name).
 * @param {CorDivision[]} corDivisions - `cor_divisions` from the filter options.
 * @param {Cor[]} cors - `cors` from the filter options.
 * @returns {DivisionStaffingOption[]}
 */
export const buildDivisionStaffingOptions = (corDivisions = [], cors = []) => {
    const divisionsById = new Map(corDivisions.map((division) => [division.id, division]));
    const byName = (a, b) => a.name.localeCompare(b.name);
    const options = [];

    const addCor = (cor, division) => {
        const corWithAbbreviation = { ...cor, division_abbreviation: division?.abbreviation ?? null };
        options.push({
            id: corOptionId(cor.id),
            title: getCorOptionLabel(corWithAbbreviation),
            order: options.length,
            kind: "cor",
            item: corWithAbbreviation
        });
    };

    [...corDivisions]
        .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))
        .forEach((division) => {
            options.push({
                id: divisionOptionId(division.id),
                title: getDivisionOptionLabel(division),
                order: options.length,
                kind: "division",
                item: division
            });
            cors.filter((cor) => cor.division_id === division.id)
                .sort(byName)
                .forEach((cor) => addCor(cor, division));
        });

    // A COR whose division isn't offered (normally: no division at all) is listed without a group.
    cors.filter((cor) => !divisionsById.has(cor.division_id))
        .sort(byName)
        .forEach((cor) => addCor(cor, null));

    return options;
};

/**
 * The ComboBox's selection for the current divisions and CORs; only `id` is used to match options.
 * @param {CorDivision[]} selectedDivisions
 * @param {Cor[]} selectedCors
 * @returns {{id: string}[]}
 */
export const toSelectedOptions = (selectedDivisions = [], selectedCors = []) => [
    ...selectedDivisions.map((division) => ({ id: divisionOptionId(division.id) })),
    ...selectedCors.map((cor) => ({ id: corOptionId(cor.id) }))
];

/**
 * Splits the ComboBox's chosen options back into divisions and CORs. A cleared box reports `null`.
 * @param {DivisionStaffingOption[] | null} options
 * @returns {{divisions: CorDivision[], cors: Cor[]}}
 */
export const splitSelectedOptions = (options) => {
    const chosen = options ?? [];
    return {
        divisions: chosen.filter((option) => option.kind === "division").map((option) => option.item),
        cors: chosen.filter((option) => option.kind === "cor").map((option) => option.item)
    };
};
