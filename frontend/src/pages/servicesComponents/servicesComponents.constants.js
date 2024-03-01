export const SERVICE_REQ_TYPES = {
    NON_SEVERABLE: "NON_SEVERABLE",
    SEVERABLE: "SEVERABLE"
};

export const NON_SEVERABLE_OPTIONS = ["SC1", "SC2", "SC3", "SC4", "SC5", "SC6"];

export const SEVERABLE_OPTIONS = [
    "Base Period 1",
    "Option Period 2",
    "Option Period 3",
    "Option Period 4",
    "Option Period 5",
    "Option Period 6"
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
    popStartMonth: "",
    popStartDay: "",
    popStartYear: "",
    popEndMonth: "",
    popEndDay: "",
    popEndYear: "",
    description: "",
    mode: "add"
};
