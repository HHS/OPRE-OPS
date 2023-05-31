export const getCurrentFiscalYear = (today) => {
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

const codesToDisplayText = {
    AgreementType: {
        CONTRACT: "Contract",
        GRANT: "Grant",
        DIRECT_ALLOCATION: "Direct Allocation",
        IAA: "IAA",
        MISCELLANEOUS: "Misc",
    },
    AgreementReason: {
        NEW_REQ: "New Req",
        RECOMPETE: "Recompete",
        LOGICAL_FOLLOW_ON: "Local Follow On",
    },
};

export const convertCodeForDisplay = (list_name, code) => {
    const code_map = codesToDisplayText[list_name];
    if (code_map) {
        const display_text = code_map[code];
        if (display_text) return display_text;
    }
    return code;
};

export const loggedInName = (activeUser) => {
    let loggedInUser = "Unknown User";
    if (activeUser) {
        loggedInUser = activeUser.full_name ? activeUser.full_name : activeUser.email;
    }
    return loggedInUser;
};
