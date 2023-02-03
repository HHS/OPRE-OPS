const getCents = (amount) => {
    const getCentsSubstring = (s) => {
        if (s.includes(".")) {
            return s.substring(s.indexOf(".") + 1, s.indexOf(".") + 3).padEnd(2, "0");
        } else {
            return "00";
        }
    };

    if (amount === 0) return "00";

    if (!amount.toString().includes(".")) return "00";

    const amount_str = parseFloat(amount).toString();

    return getCentsSubstring(amount_str);
};

export { getCents };
