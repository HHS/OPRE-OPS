import { beforeEach, describe, expect, it } from "vitest";
import suite from "./datePickerSuite";

const POP_ERROR = "Date must fall within the agreement's period of performance";

// Returns YYYY-MM-DD n days from today (for scStartDate / scEndDate props).
const isoFromToday = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Returns MM/DD/YYYY n days from today (for needByDate props).
const screenFromToday = (n) => {
    const iso = isoFromToday(n);
    const [year, month, day] = iso.split("-");
    return `${month}/${day}/${year}`;
};

// Convert a YYYY-MM-DD boundary to the MM/DD/YYYY format the suite receives.
const isoToScreen = (iso) => {
    const [year, month, day] = iso.split("-");
    return `${month}/${day}/${year}`;
};

// SC window: opens 30 days out, closes 120 days out. Both endpoints are future
// dates so any date within the window also satisfies the "must be in the future"
// check inside the suite.
const SC_START = isoFromToday(30);
const SC_END = isoFromToday(120);

beforeEach(() => {
    suite.reset();
});

describe("datePickerSuite — no-op when date is empty", () => {
    it("returns no errors when needByDate is null", () => {
        suite.run({ needByDate: null, scStartDate: SC_START, scEndDate: SC_END }, false);
        expect(suite.hasErrors()).toBe(false);
    });

    it("returns no errors when needByDate is an empty string", () => {
        suite.run({ needByDate: "", scStartDate: SC_START, scEndDate: SC_END }, false);
        expect(suite.hasErrors()).toBe(false);
    });
});

describe("datePickerSuite — PoP boundary violations", () => {
    it("errors when the date is before scStartDate", () => {
        // 15 days from now is before SC_START (30 days out)
        const result = suite.run({ needByDate: screenFromToday(15), scStartDate: SC_START, scEndDate: SC_END }, false);
        expect(result.getErrors("needByDate")).toContain(POP_ERROR);
    });

    it("errors when the date is after scEndDate", () => {
        // 130 days from now is after SC_END (120 days out)
        const result = suite.run({ needByDate: screenFromToday(130), scStartDate: SC_START, scEndDate: SC_END }, false);
        expect(result.getErrors("needByDate")).toContain(POP_ERROR);
    });
});

describe("datePickerSuite — PoP boundary inclusive edges", () => {
    it("does not error when the date equals scStartDate exactly", () => {
        const result = suite.run(
            { needByDate: isoToScreen(SC_START), scStartDate: SC_START, scEndDate: SC_END },
            false
        );
        expect(result.getErrors("needByDate")).not.toContain(POP_ERROR);
    });

    it("does not error when the date equals scEndDate exactly", () => {
        const result = suite.run({ needByDate: isoToScreen(SC_END), scStartDate: SC_START, scEndDate: SC_END }, false);
        expect(result.getErrors("needByDate")).not.toContain(POP_ERROR);
    });
});

describe("datePickerSuite — valid dates inside the window", () => {
    it("does not error when the date falls inside the window", () => {
        // 60 days from now is comfortably between SC_START (30) and SC_END (120)
        const result = suite.run({ needByDate: screenFromToday(60), scStartDate: SC_START, scEndDate: SC_END }, false);
        expect(result.getErrors("needByDate")).not.toContain(POP_ERROR);
    });
});

describe("datePickerSuite — partial SC window (one boundary absent)", () => {
    it("errors when date is before scStartDate and scEndDate is null", () => {
        const result = suite.run({ needByDate: screenFromToday(15), scStartDate: SC_START, scEndDate: null }, false);
        expect(result.getErrors("needByDate")).toContain(POP_ERROR);
    });

    it("errors when date is after scEndDate and scStartDate is null", () => {
        const result = suite.run({ needByDate: screenFromToday(130), scStartDate: null, scEndDate: SC_END }, false);
        expect(result.getErrors("needByDate")).toContain(POP_ERROR);
    });
});

describe("datePickerSuite — no SC window present", () => {
    it("does not fire the PoP rule when both SC dates are null", () => {
        // Date is in the future so the other rules pass; PoP rule must be silent.
        const result = suite.run({ needByDate: screenFromToday(60), scStartDate: null, scEndDate: null }, false);
        expect(result.getErrors("needByDate")).not.toContain(POP_ERROR);
    });
});

describe("datePickerSuite — invalid date format", () => {
    it("fires the format error, not the PoP error, for a malformed date", () => {
        const result = suite.run({ needByDate: "not-a-date", scStartDate: SC_START, scEndDate: SC_END }, false);
        expect(result.getErrors("needByDate")).toContain("Date must be MM/DD/YYYY");
        expect(result.getErrors("needByDate")).not.toContain(POP_ERROR);
    });
});

describe("datePickerSuite — DRAFT budget line is exempt from the PoP rule", () => {
    it("does not error when the date is before scStartDate on a DRAFT budget line", () => {
        const result = suite.run(
            { needByDate: screenFromToday(15), scStartDate: SC_START, scEndDate: SC_END, isDraft: true },
            false
        );
        expect(result.getErrors("needByDate")).not.toContain(POP_ERROR);
    });

    it("does not error when the date is after scEndDate on a DRAFT budget line", () => {
        const result = suite.run(
            { needByDate: screenFromToday(130), scStartDate: SC_START, scEndDate: SC_END, isDraft: true },
            false
        );
        expect(result.getErrors("needByDate")).not.toContain(POP_ERROR);
    });

    it("still errors on a non-DRAFT budget line with the same out-of-window date", () => {
        const result = suite.run(
            { needByDate: screenFromToday(130), scStartDate: SC_START, scEndDate: SC_END, isDraft: false },
            false
        );
        expect(result.getErrors("needByDate")).toContain(POP_ERROR);
    });
});

describe("datePickerSuite — superuser bypass", () => {
    it("suppresses all errors including PoP when isSuperUser is true", () => {
        suite.run({ needByDate: screenFromToday(130), scStartDate: SC_START, scEndDate: SC_END }, true);
        expect(suite.hasErrors()).toBe(false);
    });
});

describe("datePickerSuite Validation", () => {
    const getFutureDate = () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 90);
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const day = String(futureDate.getDate()).padStart(2, "0");
        const year = futureDate.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const getPastDate = () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const month = String(pastDate.getMonth() + 1).padStart(2, "0");
        const day = String(pastDate.getDate()).padStart(2, "0");
        const year = pastDate.getFullYear();
        return `${month}/${day}/${year}`;
    };

    beforeEach(() => {
        suite.reset();
    });

    describe("Regular User Validations", () => {
        it("should pass validation with a future date", () => {
            const result = suite.run({ needByDate: getFutureDate() });

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should fail validation with a past date", () => {
            const result = suite.run({ needByDate: getPastDate() });

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be in the future");
        });

        it("should fail validation with an invalid date format", () => {
            const result = suite.run({ needByDate: "not-a-date" });

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be MM/DD/YYYY");
        });

        it("should skip validation when needByDate is null", () => {
            const result = suite.run({ needByDate: null });

            expect(result.hasErrors()).toBe(false);
        });

        it("should skip validation when needByDate is empty string", () => {
            const result = suite.run({ needByDate: "" });

            expect(result.hasErrors()).toBe(false);
        });
    });

    describe("SUPER_USER Validations", () => {
        it("should skip validation for SUPER_USER with a past date", () => {
            const result = suite.run({ needByDate: "01/01/2020" }, true);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should skip validation for SUPER_USER with an invalid date format", () => {
            const result = suite.run({ needByDate: "not-a-date" }, true);

            expect(result.hasErrors()).toBe(false);
        });

        it("should skip validation for SUPER_USER with a future date", () => {
            const result = suite.run({ needByDate: getFutureDate() }, true);

            expect(result.hasErrors()).toBe(false);
        });
    });

    describe("Edge Cases", () => {
        it("should default to non-super-user behavior when isSuperUser is undefined", () => {
            const result = suite.run({ needByDate: getPastDate() }, undefined);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be in the future");
        });

        it("should default to non-super-user behavior when isSuperUser is false", () => {
            const result = suite.run({ needByDate: getPastDate() }, false);

            expect(result.hasErrors()).toBe(true);
        });
    });
});
