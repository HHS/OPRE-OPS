import { describe, expect, it } from "vitest";
import {
    DEFAULT_MODIFICATION_NUMBER,
    getSeededAwardFields,
    hasAwardFieldChanges,
    MODIFICATION_NUMBER_OPTIONS
} from "./awardForm.helpers";

describe("MODIFICATION_NUMBER_OPTIONS", () => {
    // The backend validates modification_number with validate.OneOf(AWARD_MODIFICATION_NUMBERS).
    // If this list drifts from that one, valid dropdown selections start returning 400.
    it("matches the server-side vocabulary: Base plus P00001..P00020", () => {
        expect(MODIFICATION_NUMBER_OPTIONS).toEqual([
            "Base",
            ...Array.from({ length: 20 }, (_, i) => `P${String(i + 1).padStart(5, "0")}`)
        ]);
    });

    it("is a stable module-level constant so it is not rebuilt per render", () => {
        expect(Object.isFrozen(MODIFICATION_NUMBER_OPTIONS)).toBe(true);
    });
});

describe("getSeededAwardFields", () => {
    it("prefers step 6 values over the agreement name", () => {
        const seeded = getSeededAwardFields(
            {
                agreement_title: "Signed Award Title",
                modification_number: "P00003",
                purchase_order_number: "ODN-77",
                task_order_number: "TO-88"
            },
            { name: "Working Title" }
        );
        expect(seeded).toEqual({
            agreementTitle: "Signed Award Title",
            modificationNumber: "P00003",
            purchaseOrderNumber: "ODN-77",
            taskOrderNumber: "TO-88"
        });
    });

    it("falls back to the agreement name and defaults when step 6 has no values", () => {
        expect(getSeededAwardFields(undefined, { name: "Working Title" })).toEqual({
            agreementTitle: "Working Title",
            modificationNumber: DEFAULT_MODIFICATION_NUMBER,
            purchaseOrderNumber: "",
            taskOrderNumber: ""
        });
    });

    it("treats stored empty strings as not provided", () => {
        // A blank stored Modification # must never leave the <select> on a value it has no option for.
        const seeded = getSeededAwardFields(
            { agreement_title: "", modification_number: "", purchase_order_number: "", task_order_number: "" },
            { name: "Working Title" }
        );
        expect(seeded.agreementTitle).toBe("Working Title");
        expect(seeded.modificationNumber).toBe(DEFAULT_MODIFICATION_NUMBER);
    });

    it("returns empty strings when neither step 6 nor the agreement has loaded", () => {
        expect(getSeededAwardFields(undefined, undefined)).toEqual({
            agreementTitle: "",
            modificationNumber: DEFAULT_MODIFICATION_NUMBER,
            purchaseOrderNumber: "",
            taskOrderNumber: ""
        });
    });
});

describe("hasAwardFieldChanges", () => {
    const seeded = {
        agreementTitle: "Signed Award Title",
        modificationNumber: "P00003",
        purchaseOrderNumber: "ODN-77",
        taskOrderNumber: "TO-88"
    };

    it("is false for a pristine form", () => {
        expect(hasAwardFieldChanges({ ...seeded }, seeded)).toBe(false);
    });

    it("ignores whitespace-only differences, matching the trimmed values that get submitted", () => {
        expect(hasAwardFieldChanges({ ...seeded, agreementTitle: "  Signed Award Title  " }, seeded)).toBe(false);
        expect(hasAwardFieldChanges({ ...seeded, purchaseOrderNumber: "ODN-77 " }, seeded)).toBe(false);
        expect(hasAwardFieldChanges({ ...seeded, taskOrderNumber: " TO-88" }, seeded)).toBe(false);
    });

    it.each([
        ["agreementTitle", "A Different Title"],
        ["modificationNumber", "P00004"],
        ["purchaseOrderNumber", "ODN-99"],
        ["taskOrderNumber", "TO-99"]
    ])("is true when %s changes", (field, value) => {
        expect(hasAwardFieldChanges({ ...seeded, [field]: value }, seeded)).toBe(true);
    });
});
