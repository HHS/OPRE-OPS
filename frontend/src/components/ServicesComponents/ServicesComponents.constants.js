const OPTION_AMOUNT = 25;

export const AGREEMENT_TYPES = {
    CONTRACT: "CONTRACT",
    GRANT: "GRANT",
    DIRECT_OBLIGATION: "DIRECT_OBLIGATION",
    IAA: "IAA",
    AA: "AA",
    MISCELLANEOUS: "MISCELLANEOUS"
};

export const SERVICE_REQ_TYPES = {
    NON_SEVERABLE: "NON_SEVERABLE",
    SEVERABLE: "SEVERABLE"
};
/**
 * @typedef {Object} Option
 * @property {string} label
 * @property {number} value
 */

/**
 * Array of non-severable period options
 * @type {Option[]}
 */
export const NON_SEVERABLE_OPTIONS = [];
for (let i = 1; i <= OPTION_AMOUNT; i++) {
    NON_SEVERABLE_OPTIONS.push({ label: `SC${i}`, value: i });
}

/**
 * Array of severable period options
 * @type {Option[]}
 */
export const SEVERABLE_OPTIONS = [];
for (let i = 1; i <= OPTION_AMOUNT; i++) {
    if (i === 1) {
        SEVERABLE_OPTIONS.push({ label: `Base Period ${i}`, value: i });
    } else {
        SEVERABLE_OPTIONS.push({ label: `Option Period ${i}`, value: i });
    }
}

export const SERVICE_REQ_TYPES_OPTIONS = [
    {
        label: "Severable",
        value: SERVICE_REQ_TYPES.SEVERABLE
    },
    {
        label: "Non-Severable",
        value: SERVICE_REQ_TYPES.NON_SEVERABLE
    }
];

export const CONTRACT_TYPE_OPTIONS = [
    {
        label: "Firm Fixed Price (FFP)",
        value: "FIRM_FIXED_PRICE"
    },
    {
        label: "Time & Materials (T&M)",
        value: "TIME_AND_MATERIALS"
    },
    {
        label: "Cost Plus Fixed Fee (CPFF)",
        value: "COST_PLUS_FIXED_FEE"
    },
    {
        label: "Cost Plus Award Fee (CPAF)",
        value: "COST_PLUS_AWARD_FEE"
    }
];

export const initialFormData = {
    id: 0,
    number: 0,
    optional: "",
    popStartDate: "",
    popEndDate: "",
    description: "",
    mode: "add"
};
