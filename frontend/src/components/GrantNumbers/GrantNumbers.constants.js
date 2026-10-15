const OPTION_AMOUNT = 25;

/**
 * @typedef {Object} Option
 * @property {string} label
 * @property {number} value
 */

/**
 * Array of grant number placeholder options
 * @type {Option[]}
 */
export const GRANT_NUMBER_OPTIONS = [];
for (let i = 1; i <= OPTION_AMOUNT; i++) {
    GRANT_NUMBER_OPTIONS.push({ label: `Grant ${i}`, value: i });
}

export const initialFormData = {
    id: 0,
    number: 0,
    popStartDate: "",
    popEndDate: "",
    description: "",
    mode: "add"
};
