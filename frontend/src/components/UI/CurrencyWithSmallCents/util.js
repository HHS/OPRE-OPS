const getCents = (amount) => {
    const getCentsSubstring = (s) => {
        return s.substring(s.indexOf(".") + 1, s.indexOf(".") + 3);
    };

    // amount is a float currency value - returns the cents as an integer
    const amount_str = amount.toString();
    return amount_str.includes(".")
        ? parseInt(getCentsSubstring(amount_str)) < 10
            ? (parseInt(getCentsSubstring(amount_str)) * 10).toString()
            : getCentsSubstring(amount_str)
        : 0;
};

export { getCents };
