const getCents = (amount) => {
    // amount is a float currency value - returns the cents as an integer
    const amount_str = amount.toString();
    return amount_str.substring(amount_str.indexOf(".") + 1, amount_str.indexOf(".") + 3);
};

export { getCents };
