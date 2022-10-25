export const getCurrentFiscalYear = (today) => {
    const currentMonth = today.getMonth();

    let fiscalYear;
    currentMonth < 9
        ? (fiscalYear = today.getFullYear().toString())
        : (fiscalYear = (today.getFullYear() + 1).toString());

    return fiscalYear;
};

export const getCents = (amount) => {
    // amount is a float currency value - returns the cents as an integer
    return (amount - parseInt(amount)) * 100;
};
