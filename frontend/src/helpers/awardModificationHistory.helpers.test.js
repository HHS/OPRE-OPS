import { describe, expect, it } from "vitest";
import {
    displayCurrency,
    displayDate,
    displayText,
    displayVendorType,
    getAwardModificationFields,
    getAwardModificationSections
} from "./awardModificationHistory.helpers";
import { NO_DATA } from "../constants";

describe("awardModificationHistory helpers", () => {
    describe("displayText", () => {
        it("returns the value when present", () => {
            expect(displayText("Mod 1")).toBe("Mod 1");
        });
        it("returns NO_DATA for null/undefined", () => {
            expect(displayText(null)).toBe(NO_DATA);
            expect(displayText(undefined)).toBe(NO_DATA);
        });
        it("keeps an empty string distinct from null (renders NO_DATA only for nullish)", () => {
            expect(displayText("")).toBe("");
        });
    });

    describe("displayDate", () => {
        it("formats an ISO date", () => {
            expect(displayDate("2024-06-26")).toBe("June 26, 2024");
        });
        it("returns NO_DATA for null", () => {
            expect(displayDate(null)).toBe(NO_DATA);
        });
    });

    describe("displayCurrency", () => {
        it("formats a decimal string with two decimals", () => {
            expect(displayCurrency("1000000.00")).toBe("$1,000,000.00");
        });
        it("returns NO_DATA for null/undefined (not $0)", () => {
            expect(displayCurrency(null)).toBe(NO_DATA);
            expect(displayCurrency(undefined)).toBe(NO_DATA);
        });
    });

    describe("displayVendorType", () => {
        it("humanizes a vendor type enum name", () => {
            expect(displayVendorType("SMALL_BUSINESS")).toBe("Small Business");
        });
        it("returns NO_DATA when empty", () => {
            expect(displayVendorType(null)).toBe(NO_DATA);
        });
    });

    describe("getAwardModificationFields", () => {
        it("returns 12 fields in the mockup order", () => {
            const record = {
                award_date: "2024-06-26",
                award_amount: "1000000.00",
                contract_total: "5000000.00",
                contract_number: "C-1",
                modification_number: "Base",
                requisition_approval_date: "2024-06-20",
                requisition_number: "R-1",
                vendor_name: "Flexion Inc.",
                vendor_unique_entity_id: "123456789",
                vendor_type: "SMALL_BUSINESS",
                purchase_order_number: "PO-1",
                task_order_number: "TO-1"
            };
            const fields = getAwardModificationFields(record);
            expect(fields).toHaveLength(12);
            expect(fields.map((f) => f.label)).toEqual([
                "Award Date",
                "Award Amount",
                "Contract Total",
                "Contract #",
                "Modification #",
                "Requisition Approval Date",
                "Requisition #",
                "Vendor",
                "Unique Entity ID (SAM.gov ID)",
                "Vendor Type",
                "Purchase Order #",
                "Task Order #"
            ]);
            expect(fields[0].value).toBe("June 26, 2024");
            expect(fields[1].value).toBe("$1,000,000.00");
            expect(fields[9].value).toBe("Small Business");
        });

        it("groups every field into the four mockup sections across two columns", () => {
            const record = {
                award_date: "2024-06-26",
                award_amount: "1000000.00",
                contract_total: "5000000.00",
                contract_number: "C-1",
                modification_number: "Base",
                requisition_approval_date: "2024-06-20",
                requisition_number: "R-1",
                vendor_name: "Flexion Inc.",
                vendor_unique_entity_id: "123456789",
                vendor_type: "SMALL_BUSINESS",
                purchase_order_number: "PO-1",
                task_order_number: "TO-1"
            };
            const columns = getAwardModificationSections(record);
            expect(columns).toHaveLength(2);

            const groups = columns.flat();
            expect(groups.map((g) => g.title)).toEqual([
                "Award Information",
                "Vendor Information",
                "Contract Information",
                "Requisition Information"
            ]);

            // Every field lands in exactly one section, none dropped.
            const grouped = groups.flatMap((g) => g.fields);
            expect(grouped).toHaveLength(12);
            expect(new Set(grouped.map((f) => f.dataCy)).size).toBe(12);

            const requisition = groups.find((g) => g.title === "Requisition Information");
            expect(requisition.fields.map((f) => f.label)).toEqual(["Requisition #", "Requisition Approval Date"]);
        });

        it("applies NO_DATA to every missing field", () => {
            const record = {
                award_date: null,
                award_amount: null,
                contract_total: null,
                contract_number: null,
                modification_number: null,
                requisition_approval_date: null,
                requisition_number: null,
                vendor_name: null,
                vendor_unique_entity_id: null,
                vendor_type: null,
                purchase_order_number: null,
                task_order_number: null
            };
            const fields = getAwardModificationFields(record);
            expect(fields.every((f) => f.value === NO_DATA)).toBe(true);
        });
    });
});
