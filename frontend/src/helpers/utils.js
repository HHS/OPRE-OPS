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
