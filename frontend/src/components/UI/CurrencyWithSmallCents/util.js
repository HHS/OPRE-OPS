const getCents = (amount) => {
    const getCentsSubstring = (s) => {
        return s.substring(s.indexOf(".") + 1, s.indexOf(".") + 3);
    };

    if (amount === 0) return "00";

    // amount is a float currency value - returns the cents as an string
    const amount_str = parseFloat(amount).toString();

    return amount_str.includes(".")
        ? parseInt(getCentsSubstring(amount_str)) < 10
            ? (parseInt(getCentsSubstring(amount_str)) * 10).toString()
            : getCentsSubstring(amount_str)
        : "00";
};

export { getCents };
