const constants = {
    notFilledInText: "--",
    fiscalYears: (() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const currentFiscalYear = currentMonth >= 9 ? currentYear + 1 : currentYear;
        const years = [2044, 2043];
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
        { name: "BUDGET_TEAM", label: "Budget Team" }
    ]
};

export const NO_DATA = "TBD";

export default constants;
