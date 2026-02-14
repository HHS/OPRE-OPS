const constants = {
    notFilledInText: "--",
    fiscalYears: (() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const currentFiscalYear = currentMonth >= 9 ? currentYear + 1 : currentYear;

        const years = process.env.NODE_ENV !== "production" || window.Cypress ? [2045, 2044, 2043] : [];
        for (let i = currentFiscalYear + 5; i >= currentFiscalYear - 5; i--) {
            if (!years.includes(i)) {
                years.push(i);
            }
        }
        return years.sort((a, b) => b - a);
    })(),
    barChartColors: [
        { color: "var(--feedback-success-dark)" },
        { color: "var(--feedback-success)" },
        { color: "var(--feedback-success-light)" }
    ],
    blisByFYChartColors: [
        { color: "var(--data-viz-bl-by-fy-1)" },
        { color: "var(--data-viz-bl-by-fy-2)" },
        { color: "var(--data-viz-bl-by-fy-3)" },
        { color: "var(--data-viz-bl-by-fy-4)" },
        { color: "var(--data-viz-bl-by-fy-5)" }
    ],
    budgetsByFYChartColors: [
        { color: "var(--can-budget-by-fy-graph-1)" },
        { color: "var(--can-budget-by-fy-graph-2)" },
        { color: "var(--can-budget-by-fy-graph-3)" },
        { color: "var(--can-budget-by-fy-graph-4)" },
        { color: "var(--can-budget-by-fy-graph-5)" }
    ],
    roles: [
        { name: "SYSTEM_OWNER", label: "System Owner" },
        { name: "VIEWER_EDITOR", label: "Viewer/Editor" },
        { name: "REVIEWER_APPROVER", label: "Reviewer/Approver" },
        { name: "USER_ADMIN", label: "User Admin" },
        { name: "BUDGET_TEAM", label: "Budget Team" },
        { name: "PROCUREMENT_TEAM", label: "Procurement Team" },
        { name: "SUPER_USER", label: "Temp Year End Role" }
    ]
};

export const NO_DATA = "TBD";
export const LAST_DATA_UPDATE = "2026-01-20";
//NOTE: import.meta.env.PROD ? 25 : 10 is not supported in all environments yet
export const ITEMS_PER_PAGE = process.env.NODE_ENV === "production" ? 25 : 10;
export const SUPPORT_URL = "https://opre-orbit.zendesk.com/";
export const DEFAULT_PORTFOLIO_BUDGET_RANGE = [0, 100_000_000];
// FEATURE FLAGS
export const IS_AWARDED_TAB_READY = false;
export const IS_DOCUMENTS_TAB_READY = false;
export const IS_PROCUREMENT_TRACKER_READY_MAP = {
    STEP_1: true,
    STEP_2: process.env.NODE_ENV !== "production",
    STEP_3: process.env.NODE_ENV !== "production",
    STEP_4: process.env.NODE_ENV !== "production",
    STEP_5: process.env.NODE_ENV !== "production",
    STEP_6: process.env.NODE_ENV !== "production"
};

export default constants;
