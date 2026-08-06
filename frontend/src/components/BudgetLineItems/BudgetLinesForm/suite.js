import { create, test, enforce, group, mode, Modes } from "vest";

const DATE_FORMAT_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

const suite = create((data, isSuperUser = false, isGrant = false) => {
    mode(Modes.ALL); // Set execution mode to ALL

    group("needByDate", () => {
        // Type validation always applies, even to super users — but only once a value is
        // actually entered. An empty field is a "required" concern, not a type-format one.
        if (data.needByDate) {
            test("needByDate", "Date must be MM/DD/YYYY", () => {
                enforce(data.needByDate).matches(DATE_FORMAT_REGEX);
            });
        }

        // skip remaining (business-rule) validations for this field if user is a super user
        if (isSuperUser) return;

        test("needByDate", "This is required information", () => {
            enforce(data.needByDate).isNotBlank();
        });
        test("needByDate", "Date must be in the future", () => {
            const dateStr = data.needByDate;
            // Only proceed if the date string is present and matches the expected format
            if (dateStr && DATE_FORMAT_REGEX.test(dateStr)) {
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

    // skip remaining (business-rule) validations if user is a super user
    if (isSuperUser) {
        return;
    }

    // Only register the select group that applies to the current agreement type.
    // Registering just one group means vest drops the other group's prior result on
    // each run, so the inactive select never leaves a stale "required" error that
    // would permanently disable the Add button (bidirectional skip). See plan §12.
    if (isGrant) {
        group("allGrantNumberSelect", () => {
            test("allGrantNumberSelect", "This is required information", () => {
                enforce(data.grantNumberNumber).isNotNullish().greaterThan(0);
            });
        });
    } else {
        group("allServicesComponentSelect", () => {
            test("allServicesComponentSelect", "This is required information", () => {
                enforce(data.servicesComponentNumber).isNumeric().greaterThan(0);
            });
        });
    }

    group("selectedCan", () => {
        test("selectedCan", "This is required information", () => {
            // Ensures selectedCan object itself is present
            enforce(data.selectedCan).isNotNull().isNotEmpty();
        });
        test("selectedCan", "A valid CAN must be selected", () => {
            // Ensures the id within selectedCan is valid
            enforce(data.selectedCan && data.selectedCan.id)
                .isNumeric()
                .greaterThan(0);
        });
    });

    group("enteredAmount", () => {
        test("enteredAmount", "This is required information", () => {
            enforce(data.enteredAmount).isNumeric();
        });
        test("enteredAmount", "Amount must be 0 or greater", () => {
            enforce(data.enteredAmount).greaterThanOrEquals(0);
        });
    });
});

export default suite;
