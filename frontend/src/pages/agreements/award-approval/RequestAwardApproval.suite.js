import { create, test, enforce, only } from "vest";

/**
 * Validates if a date string is in MM/DD/YYYY format
 */
const isValidDateFormat = (dateString) => {
    return /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(dateString);
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

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    // Vendor validation - numeric ID must be > 0
    test("vendor", "Vendor is required", () => {
        enforce(data.vendor).isNotNullish().greaterThan(0);
    });

    // Award Information validations
    test("contractNumber", "Contract # is required", () => {
        enforce(data.contractNumber).isNotEmpty();
    });

    test("awardAmount", "Award Amount is required", () => {
        enforce(data.awardAmount).isNotEmpty();
    });

    test("awardAmount", "Award Amount must be greater than $0", () => {
        if (!data.awardAmount) return; // Skip if empty (let required validation handle)
        const numericAmount = parseFloat(data.awardAmount);
        enforce(numericAmount).greaterThan(0);
    });

    test("awardDate", "Award Date is required", () => {
        enforce(data.awardDate).isNotEmpty();
    });

    test("awardDate", "Date must be MM/DD/YYYY", () => {
        if (!data.awardDate) return; // Skip if empty (let required validation handle)
        enforce(data.awardDate).matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });

    test("awardDate", "Date must be a valid calendar date", () => {
        if (!data.awardDate) return; // Skip if empty (let required validation handle)
        const parsedDate = parseDateString(data.awardDate);
        enforce(parsedDate).isNotNull();
    });
});

export default suite;
