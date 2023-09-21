export const getCurrentFiscalYear = (today = new Date()) => {
    const currentMonth = today.getMonth();

    let fiscalYear;
    currentMonth < 9
        ? (fiscalYear = today.getFullYear().toString())
        : (fiscalYear = (today.getFullYear() + 1).toString());

    return fiscalYear;
};

export const calculatePercent = (numerator, denominator) => {
    if (denominator === "0" || denominator === 0) return "0";

    return Math.round((numerator / denominator) * 100);
};

export const formatDate = (date) => {
    const options = { timeZone: "UTC" };

    return date.toLocaleDateString("en-US", options);
};

/**
 * Formats a date string into a date string in the format MM/DD/YYYY.
 * @param {string} dateNeeded - The date string to format. This parameter is required.
 * @returns {string} The formatted date string.
 */
export const formatDateNeeded = (dateNeeded) => {
    let formatted_date_needed;
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
    return new Date(date).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

/**
 * Object containing display text for various codes.
 * @typedef {Object} CodesToDisplayText
 * @property {Object.<string, string>} agreementType - Display text for agreement types.
 * @property {Object.<string, string>} agreementReason - Display text for agreement reasons.
 * @property {Object.<string, string>} budgetLineStatus - Display text for budget line types.
 * @property {Object.<string, string>} validation - Display text for validation errors.
 */

/**
 * Object containing display text for various codes.
 * @type {CodesToDisplayText}
 */
const codesToDisplayText = {
    agreementType: {
        CONTRACT: "Contract",
        GRANT: "Grant",
        DIRECT_ALLOCATION: "Direct Allocation",
        IAA: "IAA",
        MISCELLANEOUS: "Misc",
    },
    agreementReason: {
        NEW_REQ: "New Requirement",
        RECOMPETE: "Recompete",
        LOGICAL_FOLLOW_ON: "Logical Follow On",
    },
    budgetLineStatus: {
        DRAFT: "Draft",
        UNDER_REVIEW: "In Review",
        PLANNED: "Planned",
        IN_EXECUTION: "Executing",
        OBLIGATED: "Obligated",
    },
    validation: {
        name: "Name",
        type: "Type",
        description: "Description",
        psc: "Product Service Code",
        naics: "NAICS Code",
        "program-support-code": "Program Support Code",
        "procurement-shop": "Procurement Shop",
        reason: "Reason for creating the agreement",
        incumbent: "Incumbent",
        "project-officer": "Project Officer",
        "team-member": "Team Members",
        "budget-line-items": "Budget Line Items",
    },
    classNameLabels: {
        ContractAgreement: "Contract Agreement",
        BudgetLineItem: "Budget Line",
    },
    baseClassNameLabels: {
        ContractAgreement: "Agreement",
        BudgetLineItem: "Budget Line",
    },
    agreementPropertyLabels: {
        agreement_reason: "Reason for Agreement",
        agreement_type: "Agreement Type",
        description: "Agreement Description",
        incumbent: "Incumbent",
        name: "Agreement Title",
        notes: "Agreement Notes",
        number: "Number",
        procurement_shop: "Procurement Shop",
        product_service_code: "Product Service Code",
        project_officer: "Project Officer",
        research_project: "Research Project",
        team_members: "Team Members",
        team_members_item: "Team Member",
        contract_number: "Contract Number",
        vendor: "Vendor",
        delivered_status: "Delivered Status",
        contract_type: "Contract Type",
        support_contacts: "Support Contacts",
        support_contacts_item: "Support Contact",
    },
    budgetLineItemPropertyLabels: {
        amount: "Amount",
        can: "CAN",
        comments: "Notes",
        date_needed: "Need By Date",
        line_description: "Description",
        psc_fee_amount: "Shop Fee",
        status: "Status",
    },
};

/**
 * Converts a code value into a display text value based on a predefined mapping.
 * @param {("agreementType" | "agreementReason" | "budgetLineStatus" | "validation" | "classNameLabels" | "baseClassNameLabels"| "agreementPropertyLabels" | "budgetLineItemPropertyLabels")} listName - The name of the list to retrieve the mapping from the codesToDisplayText object. This parameter is required.
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

export const loggedInName = (activeUser) => {
    let loggedInUser = "Unknown User";
    if (activeUser) {
        loggedInUser = activeUser.full_name ? activeUser.full_name : activeUser.email;
    }
    return loggedInUser;
};

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
    const seconds = Math.round((today - date) / 1000);
    const minutes = Math.round(seconds / 60);

    if (seconds < 5) {
        return "now";
    } else if (seconds < 60) {
        return `${seconds} seconds ago`;
    } else if (seconds < 90) {
        return "about a minute ago";
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    }

    return formatDateToMonthDayYear(date);
};

export const formatLogTimeStamp = (dateParam) => {
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

    return new Date(date).toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
    });
};

/**
 * Find the fiscal year for a date, which is the same as it's year unless it's after
 * September 30th then it rolls over into the next FY.
 * @param {string} date - a date as string such as "2023-02-15" or a Date
 * @returns {number|null} the fiscal year
 */
export const fiscalYearFromDate = (date) => {
    if (date === "--" || date === null) return null;
    if (!date) return null;
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
    // fee is a percent, so divide by 100
    const calcFee = fee / 100;
    return amount * calcFee;
};

/**
 * This function takes an amount and fee and returns the total amount plus the fee.
 * @param {number} amount - The amount to calculate the total amount plus fee for.
 * @param {number} fee - The fee to calculate the total amount plus fee for.
 * @returns {number} The total amount plus fee.
 * @example totalBudgetLineAmountPlusFees(100, 0.1)
 */
export const totalBudgetLineAmountPlusFees = (amount, fee) => {
    if (amount === 0) return 0;
    return amount + fee;
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
                    return "$" + value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
