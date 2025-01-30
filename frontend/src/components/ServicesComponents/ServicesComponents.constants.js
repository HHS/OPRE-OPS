export const AGREEMENT_TYPES = {
    CONTRACT: "CONTRACT",
    GRANT: "GRANT",
    DIRECT_OBLIGATION: "DIRECT_OBLIGATION",
    IAA: "IAA",
    IAA_AA: "IAA_AA",
    MISCELLANEOUS: "MISCELLANEOUS"
};

export const SERVICE_REQ_TYPES = {
    NON_SEVERABLE: "NON_SEVERABLE",
    SEVERABLE: "SEVERABLE"
};

export const NON_SEVERABLE_OPTIONS = [
    { label: "SC1", value: 1 },
    { label: "SC2", value: 2 },
    { label: "SC3", value: 3 },
    { label: "SC4", value: 4 },
    { label: "SC5", value: 5 },
    { label: "SC6", value: 6 }
];

export const SEVERABLE_OPTIONS = [
    { label: "Base Period 1", value: 1 },
    { label: "Option Period 2", value: 2 },
    { label: "Option Period 3", value: 3 },
    { label: "Option Period 4", value: 4 },
    { label: "Option Period 5", value: 5 },
    { label: "Option Period 6", value: 6 }
];

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
        label: "Labor Hour (LH)",
        value: "LABOR_HOUR"
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
    number: "",
    optional: "",
    popStartDate: "",
    popEndDate: "",
    description: "",
    mode: "add"
};
