const constants = {
    notFilledInText: "--",
    fiscalYears: (() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const currentFiscalYear = currentMonth >= 9 ? currentYear + 1 : currentYear;
        const years = [];
        for (let i = currentFiscalYear - 5; i <= currentFiscalYear + 5; i++) {
            years.push(i);
        }
        return years;
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
