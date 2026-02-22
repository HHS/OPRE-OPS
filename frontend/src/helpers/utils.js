import { NO_DATA } from "../constants";
import { BLI_STATUS } from "./budgetLines.helpers";

export const getCurrentFiscalYear = (today = new Date()) => {
    const currentMonth = today.getMonth();

    let fiscalYear;
    currentMonth < 9
        ? (fiscalYear = today.getFullYear().toString())
        : (fiscalYear = (today.getFullYear() + 1).toString());

    return fiscalYear;
};

/**
 * This function calculate a percent based on a numerator and denominator.
 * @param {number} numerator - The numerator. This parameter is required.
 * @param {number} denominator - The denominator. This parameter is required.
 * @returns {number} The calculated percent.
 */
export const calculatePercent = (numerator, denominator) => {
    if (!numerator || !denominator) return 0;
    if (typeof numerator !== "number" || typeof denominator !== "number") {
        numerator = +numerator;
        denominator = +denominator;
        console.warn("calculatePercent: numerator and denominator must be numbers");
    }

    if (denominator === 0 || numerator === 0) return 0;

    return Math.round((numerator / denominator) * 100);
};
/**
 * This function formats a date into a string in the format MM/DD/YYYY.
 * @param {Date} date - The date to format. This parameter is required.
 * @returns {string} The formatted date string.
 */
export const formatDate = (date) => {
    const options = { timeZone: "UTC" };

    return date.toLocaleDateString("en-US", options);
};

/**
 * Formats a date string into a date string in the format MM/DD/YYYY.
 * @param {string | null} dateNeeded - The date string to format. This parameter is required.
 * @returns {string} The formatted date string or undefined if input is invalid.
 */
export const formatDateNeeded = (dateNeeded, isObe = false) => {
    let formatted_date_needed = NO_DATA;

    if (isObe) {
        return "None";
    }

    if (dateNeeded !== "--" && dateNeeded !== null) {
        let date_needed = new Date(dateNeeded);
        formatted_date_needed = formatDate(date_needed);
    }
    return formatted_date_needed;
};

/**
 * Formats a date string into a date string in the format MMM DD, YYYY ie May 19, 2023.
 * @param {string} date - The date string to format. This parameter is required.
 * @returns {string} The formatted date string.
 * @example formatDateToMonthDayYear("2023-05-19")
 */
export const formatDateToMonthDayYear = (date) => {
    return new Date(date).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
};

// List of BLI statuses which are considered Draft, this used to include UNDER_REVIEW which no longer exists
export const draftBudgetLineStatuses = ["DRAFT"];

/**
 * Object containing display text for various codes.
 * @typedef {Object} CodesToDisplayText
 * @property {Object.<string, string>} agreement - Display text for agreement types.
 * @property {Object.<string, string>} agreementType - Display text for agreement types.
 * @property {Object.<string, string>} partnerAgreementTypes - Display text for partner agreement types.
 * @property {Object.<string, string>} agreementReason - Display text for agreement reasons.
 * @property {Object.<string, string>} budgetLineStatus - Display text for budget line types.
 * @property {Object.<string, string>} validation - Display text for validation errors.
 * @property {Object.<string, string>} classNameLabels - Display text for class names.
 * @property {Object.<string, string>} baseClassNameLabels - Display text for base class names.
 * @property {Object.<string, string>} agreementPropertyLabels - Display text for agreement property names.
 * @property {Object.<string, string>} budgetLineItemPropertyLabels - Display text for budget line item property names.
 * @property {Object.<string, string>} contractType - Display text for contract types.
 * @property {Object.<string, string>} serviceRequirementType - Display text for service requirement types.
 * @property {Object.<string, string>} changeToTypes - Display text for change to types.
 * @property {Object.<string, string>} methodOfTransfer - Display text for change to statuses.
 * @property {Object.<string, string>} project - Display text for project types.
 * @property {Object.<string, string>} projectOfficer - Display text for project types.
 *
 */

/**
 * Object containing display text for various codes.
 * @type {CodesToDisplayText}
 */
export const codesToDisplayText = {
    agreementType: {
        CONTRACT: "Contract",
        GRANT: "Grant",
        DIRECT_OBLIGATION: "Direct Obligation",
        "DIRECT OBLIGATION": "Direct Obligation",
        AA: "Partner - AA",
        IAA: "Partner - IAA",
        MISCELLANEOUS: "Misc"
    },
    partnerAgreementTypes: {
        CONTRACT: "Contract",
        GRANT: "Grant",
        DIRECT_OBLIGATION: "Direct Obligation",
        AA: "Assisted Acquisition (AA)",
        IAA: "Inter-Agency Agreement (IAA)",
        MISCELLANEOUS: "Misc"
    },
    agreementReason: {
        NEW_REQ: "New Requirement",
        RECOMPETE: "Recompete",
        LOGICAL_FOLLOW_ON: "Logical Follow On"
    },
    budgetLineStatus: {
        DRAFT: "Draft",
        PLANNED: "Planned",
        IN_EXECUTION: "Executing",
        OBLIGATED: "Obligated"
    },
    validation: {
        name: "Name",
        type: "Type",
        description: "Description",
        psc: "Product Service Code",
        naics: "NAICS Code",
        "program-support-code": "Program Support Code",
        "procurement-shop": "Procurement Shop",
        reason: "Reason for Creating the Agreement",
        vendor: "Vendor",
        "project-officer": "Project Officer",
        cor: "COR",
        "team-member": "Team Members",
        "budget-line-items": "Budget Line Items",
        "contract-type": "Contract Type",
        "team-members": "Team Members"
    },
    classNameLabels: {
        ContractAgreement: "Contract Agreement",
        ContractBudgetLineItem: "Budget Line"
    },
    baseClassNameLabels: {
        ContractAgreement: "Agreement",
        ContractBudgetLineItem: "Budget Line"
    },
    agreementPropertyLabels: {
        agreement_reason: "Reason for Creating the Agreement",
        agreement_type: "Agreement Type",
        description: "Agreement Description",
        vendor: "Vendor",
        name: "Agreement Title",
        notes: "Agreement Notes",
        number: "Number",
        procurement_shop: "Procurement Shop",
        product_service_code: "Product Service Code",
        project_officer: "Project Officer",
        alternate_project_officer: "Alternate Project Officer",
        cor_id: "COR",
        alternate_cor_id: "Alternate COR",
        project: "Project",
        team_members: "Team Members",
        team_members_item: "Team Member",
        contract_number: "Contract Number",
        delivered_status: "Delivered Status",
        contract_type: "Contract Type",
        support_contacts: "Support Contacts",
        support_contacts_item: "Support Contact"
    },
    budgetLineItemPropertyLabels: {
        amount: "Amount",
        can: "CAN",
        comments: "Notes",
        date_needed: "Obligate Date",
        line_description: "Description",
        proc_shop_fee_percentage: "Shop Fee",
        status: "Status",
        services_component: "Services Component"
    },
    contractType: {
        FIRM_FIXED_PRICE: "Firm Fixed Price (FFP)",
        TIME_AND_MATERIALS: "Time & Materials (T&M)",
        COST_PLUS_FIXED_FEE: "Cost Plus Fixed Fee (CPFF)",
        COST_PLUS_AWARD_FEE: "Cost Plus Award Fee (CPAF)",
        HYBRID: "Hybrid (Any combination of the above)"
    },
    serviceRequirementType: {
        SEVERABLE: "Severable",
        NON_SEVERABLE: "Non-Severable"
    },
    changeToTypes: {
        amount: "Amount",
        can_id: "CAN",
        date_needed: "Obligate By Date",
        status: "Status"
    },
    methodOfTransfer: {
        DIRECT: "Direct",
        COST_SHARE: "Cost Share",
        IAA: "IAA",
        IDDA: "IDDA",
        OTHER: "Other"
    },
    project: {
        ADMINISTRATIVE_AND_SUPPORT: "Admin & Support",
        RESEARCH: "Research"
    },
    projectOfficer: {
        AA: "COR",
        CONTRACT: "COR",
        GRANT: "Project Officer",
        DIRECT_OBLIGATION: "Project Officer",
        IAA: "COR",
        MISCELLANEOUS: "Project Officer"
    },
    agreement: {
        "AgreementType.CONTRACT": "Contract",
        "AgreementType.GRANT": "Grant",
        "AgreementType.DIRECT_OBLIGATION": "Direct Obligation",
        "AgreementType.IAA": "IAA",
        "AgreementType.MISCELLANEOUS": "Misc"
    }
};

/**
 * A list of codes that are used in both the front end and back end to sort tabular data.
 */
export const tableSortCodes = {
    budgetLineCodes: {
        BL_ID_NUMBER: "ID_NUMBER",
        AGREEMENT_NAME: "AGREEMENT_NAME",
        AGREEMENT_TYPE: "AGREEMENT_TYPE",
        SERVICES_COMPONENT: "SERVICE_COMPONENT",
        OBLIGATE_BY: "OBLIGATE_BY",
        CAN_NUMBER: "CAN_NUMBER",
        PORTFOLIO: "PORTFOLIO",
        TOTAL: "TOTAL",
        STATUS: "STATUS",
        AMOUNT: "AMOUNT",
        FEES: "FEES",
        PERCENT_OF_CAN: "PERCENT_OF_CAN",
        PERCENT_OF_BUDGET: "PERCENT_OF_BUDGET"
    },
    agreementCodes: {
        AGREEMENT: "AGREEMENT",
        TYPE: "TYPE",
        START: "START",
        END: "END",
        TOTAL: "TOTAL",
        FY_OBLIGATED: "FY_OBLIGATED"
    },
    canFundingReceivedCodes: {
        FUNDING_ID: "FUNDING_ID",
        FISCAL_YEAR: "FISCAL_YEAR",
        FUNDING_RECEIVED: "FUNDING_RECEIVED",
        BUDGET_PERCENT: "BUDGET_PERCENT"
    },
    canCodes: {
        CAN_NAME: "CAN_NAME",
        PORTFOLIO: "PORTFOLIO",
        ACTIVE_PERIOD: "ACTIVE_PERIOD",
        OBLIGATE_BY: "OBLIGATE_BY",
        FY_BUDGET: "FY_BUDGET",
        FUNDING_RECEIVED: "FUNDING_RECEIVED",
        AVAILABLE_BUDGET: "AVAILABLE_BUDGET"
    },
    portfolioCodes: {
        PORTFOLIO_NAME: "PORTFOLIO_NAME",
        DIVISION: "DIVISION",
        FY_BUDGET: "FY_BUDGET",
        FY_SPENDING: "FY_SPENDING",
        FY_AVAILABLE: "FY_AVAILABLE",
        STATIC_ORDER: "STATIC_ORDER"
    }
};

/**
 * Converts a code value into a display text value based on a predefined mapping.
 * @param {("agreementType" | "partnerAgreementTypes" | "agreementReason" | "budgetLineStatus" | "validation" | "classNameLabels" | "baseClassNameLabels"| "agreementPropertyLabels" | "budgetLineItemPropertyLabels" | "changeToTypes" | "methodOfTransfer" | 'project' | 'projectOfficer' | "contractType" | "serviceRequirementType")} listName - The name of the list to retrieve the mapping from the codesToDisplayText object. This parameter is required.
 * @param {string} code - The code value to convert. This parameter is required.
 * @returns {string} The display text value for the code, or the original code value if no mapping is found.
 * @throws {Error} If either the listName or code parameter is not provided.
 * @example convertCodeForDisplay("agreementReason", reason)
 * @example convertCodeForDisplay("budgetLineStatus", budgetLineStatus)
 * @example convertCodeForDisplay("validation", "name")
 */
export const convertCodeForDisplay = (listName, code) => {
    if (!codesToDisplayText[listName]) {
        throw new Error("Invalid list name");
    }

    // Retrieve the mapping for the list name
    const codeMap = codesToDisplayText[listName];

    // Return the display text for the code, or the original code value if no mapping is found
    return codeMap[code] ? codeMap[code] : code;
};

/**
 * Converts a date to a relative time string (e.g., "2 hours ago", "about a minute ago")
 * @param {(Date|string)} dateParam - The date to convert. Can be a Date object or an ISO string
 * @returns {string|null} A human-readable string representing relative time,
 *                        formatted date string for dates older than 24 hours,
 *                        or null if no date provided
 * @example
 * timeAgo("2023-05-20T15:00:00") // returns "about a minute ago"
 * timeAgo(new Date()) // returns "now"
 */
export const timeAgo = (dateParam) => {
    if (!dateParam) {
        return null;
    }
    // if there's no timezone info, assume it UTC and missing the "Z"
    if (typeof dateParam === "string" || dateParam instanceof String) {
        if (!dateParam.endsWith("Z") && !dateParam.includes("+")) {
            dateParam = dateParam + "Z";
        }
    }

    const date = typeof dateParam === "object" ? dateParam : new Date(dateParam);
    const today = new Date();
    const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);

    if (seconds < 5) {
        return "now";
    } else if (seconds < 60) {
        return `${seconds} seconds ago`;
    } else if (seconds < 90) {
        return "about a minute ago";
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours === 1) {
        return `${hours} hour ago`;
    } else if (hours < 24) {
        return `${hours} hours ago`;
    }

    return new Date(date).toLocaleString("en-US", {
        dateStyle: "long"
    });
};

/**
 * Find the fiscal year for a date, which is the same as it's year unless it's after
 * September 30th then it rolls over into the next FY.
 * @param {string} date - a date as string such as "2023-02-15" or a Date
 * @returns {number|string} the fiscal year
 */
export const fiscalYearFromDate = (date) => {
    if (date === "--" || date === null) return NO_DATA;
    if (!date) return NO_DATA;
    let dt = new Date(date);
    const month = dt.getUTCMonth();
    const year = dt.getUTCFullYear();
    return month > 8 ? year + 1 : year;
};

/**
 * This function takes an amount and fee and returns the total fee amount.
 * @param {number} amount - The amount to calculate the fee for.
 * @param {number} fee - The fee to calculate the fee for.
 * @returns {number} The total fee amount.
 * @example totalBudgetLineFeeAmount(100, 0.1)
 */
export const totalBudgetLineFeeAmount = (amount, fee) => {
    if (amount === 0) return 0;

    return Number((amount * fee).toFixed(2));
};

export const renderField = (className, fieldName, value) => {
    if (value == null) return value;
    switch (className) {
        // so far, this doesn't depend on className and the same field names are the same types for every class
        default:
            switch (fieldName) {
                case "date_needed":
                    return formatDateNeeded(value);
                case "amount":
                    return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(value);
                case "agreement_reason":
                    return convertCodeForDisplay("agreementReason", value);
                case "agreement_type":
                    return convertCodeForDisplay("agreementType", value);
                case "status":
                    return convertCodeForDisplay("budgetLineStatus", value);
                default:
                    return value;
            }
    }
};
/**
 * @param {string} status - The status to convert to a class name.
 * @param {string} styleType - The style type to apply. This parameter is optional.
 * @returns {string} The class name for the status.
 */
export const statusToClassName = (status, styleType = "text") => {
    // status color as foreground text
    if (styleType === "text") {
        switch (status) {
            case BLI_STATUS.DRAFT:
                return "text-brand-data-viz-bl-by-status-1";
            case BLI_STATUS.PLANNED:
                return "text-brand-data-viz-bl-by-status-2";
            case BLI_STATUS.EXECUTING:
                return "text-brand-data-viz-bl-by-status-3";
            case BLI_STATUS.OBLIGATED:
                return "text-brand-data-viz-bl-by-status-4";
            default:
                return "";
        }
    } else {
        // tag style with status color as the background and contrasting text
        switch (status) {
            case BLI_STATUS.DRAFT:
                return "bg-brand-brand-data-viz-bl-by-status-1";
            case BLI_STATUS.PLANNED:
                return "brand-data-viz-bl-by-status-2 text-white";
            case BLI_STATUS.EXECUTING:
                return "brand-data-viz-bl-by-status-3";
            case BLI_STATUS.OBLIGATED:
                return "brand-data-viz-bl-by-status-4 text-white";
            default:
                return "";
        }
    }
};

export const formatDateForApi = (date) => {
    if (date) {
        const [month, day, year] = date.split("/");
        return `${year}-${month}-${day}`;
    }
    return null;
};

export const formatDateForScreen = (date) => {
    if (date) {
        const [year, month, day] = date.split("-");
        return `${month}/${day}/${year}`;
    }
    return null;
};

export const getLocalISODate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

/**
 * This function takes a string and returns a slug case version of the string.
 * @param {string} str - The string to convert to slug case.
 * @returns {string} The slug case version of the string.
 */
export function toSlugCase(str) {
    if (!str) return "";
    if (typeof str !== "string") {
        console.warn("toSlugCase: str must be a string");
        return "";
    }
    return str.toLowerCase().replace(/\s/g, "-");
}

/**
 * This function takes a slug and returns a title case version of the string.
 * @param {string} slug - The slug to convert to title case.
 * @returns {string} The title case version of the slug.

 */
export function toTitleCaseFromSlug(slug) {
    if (!slug) return "";
    if (typeof slug !== "string") {
        console.warn("toSlugCase: str must be a string");
        return "";
    }
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * This function takes a slug and returns a lower case version of the string.
 * @param {string} slug - The slug to convert to lower case.
 * @returns {string} The lower case version of the slug.
 */
export function toLowerCaseFromSlug(slug) {
    if (!slug) return "";
    if (typeof slug !== "string") {
        console.warn("toSlugCase: str must be a string");
        return "";
    }
    return slug
        .split("-")
        .map((word) => word.charAt(0).toLowerCase() + word.slice(1))
        .join(" ");
}

/**
 * This function takes a string and returns a title case version of the string.
 * @param {string} string - The string to convert to title case.
 * @returns {string} The title case version of the string.
 */
export function fromUpperCaseToTitleCase(string) {
    if (!string) return "";
    if (typeof string !== "string") {
        console.warn("fromUpperCaseToTitleCase: string must be a string");
        return "";
    }
    return string
        .split(/[-_\s]/) // Split by hyphens, underscores, and spaces
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

/**
 *
 * @returns {string} Return the current timestamp in the format of YYYY-MM-DD_HH_MM_SS
 */
export function getCurrentLocalTimestamp() {
    /** @param {number} num */
    const padZero = (num) => String(num).padStart(2, "0");
    const now = new Date();
    const year = now.getFullYear();
    const month = padZero(now.getMonth() + 1);
    const day = padZero(now.getDate());
    const hours = padZero(now.getHours());
    const minutes = padZero(now.getMinutes());
    const seconds = padZero(now.getSeconds());
    const currentTimeStamp = `${year}-${month}-${day}-${hours}_${minutes}_${seconds}`;
    return currentTimeStamp;
}

/** * Converts a number to a currency string in USD format.
 * @param {number|null|undefined} value - The value to convert. If null, undefined, or an empty string, returns "$0".
 * @returns {string} The formatted currency string.
 * @example convertToCurrency(1234.56) // returns "$1,234.56"
 */

export function convertToCurrency(value) {
    if (value === null || value === undefined || value === 0) return "$0";

    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });
}
