import { create, test, enforce } from "vest";

const DATE_FORMAT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

/**
 * Validates if a date string is in MM/DD/YYYY format
 */
const isValidDateFormat = (dateString) => {
    return DATE_FORMAT_REGEX.test(dateString);
};

/**
 * Parses a date string and validates it's a real calendar date
 */
const parseDateString = (dateString) => {
    if (!dateString || !isValidDateFormat(dateString)) return null;
    const [month, day, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    // Verify the parsed date matches the input (catches invalid calendar dates like 02/31/2024)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
};

const suite = create((data = {}) => {
    // Obligated Date is required before approving for Award — it must never be assumed
    // to be the current date, as it is generally first documented in another system.
    test("obligatedDate", "Obligated Date is required", () => {
        enforce(data.obligatedDate).isNotEmpty();
    });

    test("obligatedDate", "Date must be MM/DD/YYYY", () => {
        if (!data.obligatedDate) return; // Skip if empty (let required validation handle)
        enforce(data.obligatedDate).matches(DATE_FORMAT_REGEX);
    });

    test("obligatedDate", "Date must be a valid calendar date", () => {
        if (!data.obligatedDate) return; // Skip if empty (let required validation handle)
        const parsedDate = parseDateString(data.obligatedDate);
        enforce(parsedDate).isNotNull();
    });
});

export default suite;
