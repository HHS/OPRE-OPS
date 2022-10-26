export const getCents = (amount) => {
    // amount is a float currency value - returns the cents as an integer
    return (amount - parseInt(amount)) * 100;
};
