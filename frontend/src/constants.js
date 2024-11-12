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
    ]
};

export default constants;
