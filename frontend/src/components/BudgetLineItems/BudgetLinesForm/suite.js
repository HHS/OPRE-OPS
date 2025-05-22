import { create, test, enforce, group, mode, Modes } from "vest";

const suite = create((data) => {
    mode(Modes.ALL); // Set execution mode to ALL

    group("allServicesComponentSelect", () => {
        test("allServicesComponentSelect", "This is required information", () => {
            enforce(data.servicesComponentId).isNumeric().greaterThan(0);
        });
    });

    group("selectedCan", () => {
        test("selectedCan", "This is required information", () => {
            // Ensures selectedCan object itself is present
            enforce(data.selectedCan).isNotNull().isNotEmpty();
        });
        test("selectedCan", "A valid CAN must be selected", () => {
            // Ensures the id within selectedCan is valid
            enforce(data.selectedCan && data.selectedCan.id).isNumeric().greaterThan(0);
        });
    });

    group("enteredAmount", () => {
        test("enteredAmount", "This is required information", () => {
            enforce(data.enteredAmount).isNumeric();
        });
        test("enteredAmount", "Amount must be greater than 0", () => {
            enforce(data.enteredAmount).greaterThan(0);
        });
    });

    group("needByDate", () => {
        test("needByDate", "This is required information", () => {
            enforce(data.needByDate).isNotBlank();
        });
        test("needByDate", "Date must be MM/DD/YYYY", () => {
            enforce(data.needByDate || "").matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
        });
        test("needByDate", "Date must be in the future", () => {
            const dateStr = data.needByDate;
            // Only proceed if the date string is present and matches the expected format
            if (dateStr && /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(dateStr)) {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
                const enteredDate = new Date(dateStr);
                // Check if enteredDate is a valid date object
                if (!isNaN(enteredDate.getTime())) {
                    enforce(enteredDate.getTime()).greaterThan(today.getTime());
                } else {
                    // This case should ideally be caught by the regex, but as a fallback:
                    enforce(dateStr).setError("Invalid date provided.");
                }
            }
            // If dateStr is blank or not in the correct format, the other 'needByDate' tests will catch it.
            // This test primarily focuses on the 'future' aspect assuming a structurally valid date.
        });
    });
});

export default suite;