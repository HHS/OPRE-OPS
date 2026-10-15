import { describe, it, expect, beforeEach } from "vitest";
import suite from "./RequestAwardApproval.suite";

// Mirrors how RequestAwardApproval.hooks.js drives the suite: runValidate() calls
// suite.run({ [fieldName]: value }, fieldName) for single-field validation, and the
// submit handler calls suite.run(allData) with no field name to gate the request.
const runField = (fieldName, value) => suite.run({ [fieldName]: value }, fieldName);

describe("RequestAwardApproval.suite", () => {
    beforeEach(() => {
        // only(fieldName) leaves untargeted tests holding their previous state, so
        // each case has to start from a clean suite.
        suite.reset();
    });

    describe("OPS-5892 required fields", () => {
        it.each([
            ["agreementTitle", "Agreement Title is required"],
            ["modificationNumber", "Modification # is required"],
            ["purchaseOrderNumber", "Purchase Order # is required"],
            ["taskOrderNumber", "Task Order # is required"]
        ])("flags a missing %s as required", (fieldName, message) => {
            const res = runField(fieldName, "");
            expect(res.hasErrors(fieldName)).toBe(true);
            expect(res.getErrors(fieldName)).toContain(message);
        });

        it.each(["agreementTitle", "modificationNumber", "purchaseOrderNumber", "taskOrderNumber"])(
            "passes when %s is populated",
            (fieldName) => {
                const res = runField(fieldName, "Some Value");
                expect(res.hasErrors(fieldName)).toBe(false);
            }
        );
    });

    // Cap sizes differ on purpose: agreementTitle mirrors the agreement editor's name field
    // (200), while the PO/TO numbers mirror their String(100) columns.
    describe("length caps", () => {
        it.each([
            ["agreementTitle", 200, "Agreement Title must be 200 characters or less"],
            ["purchaseOrderNumber", 100, "Purchase Order # must be 100 characters or less"],
            ["taskOrderNumber", 100, "Task Order # must be 100 characters or less"]
        ])("flags %s longer than %i characters", (fieldName, cap, message) => {
            const res = runField(fieldName, "a".repeat(cap + 1));
            expect(res.hasErrors(fieldName)).toBe(true);
            expect(res.getErrors(fieldName)).toContain(message);
        });

        it.each([
            ["agreementTitle", 200],
            ["purchaseOrderNumber", 100],
            ["taskOrderNumber", 100]
        ])("allows %s of exactly %i characters", (fieldName, cap) => {
            const res = runField(fieldName, "a".repeat(cap));
            expect(res.hasErrors(fieldName)).toBe(false);
        });

        it("does not cap agreementTitle at the PO/TO limit of 100", () => {
            // Guards against someone "harmonising" the caps and silently tightening the title.
            const res = runField("agreementTitle", "a".repeat(150));
            expect(res.hasErrors("agreementTitle")).toBe(false);
        });

        it.each([
            ["agreementTitle", "Agreement Title must be 200 characters or less"],
            ["purchaseOrderNumber", "Purchase Order # must be 100 characters or less"],
            ["taskOrderNumber", "Task Order # must be 100 characters or less"]
        ])("reports only the required error for an empty %s, not the length error", (fieldName, lengthMessage) => {
            // A blank field surfaces one message, not two. Note this holds even without the
            // suite's `if (!data.field) return;` early return, since shorterThanOrEquals(100)
            // passes for "" / null / undefined anyway — that guard is belt-and-braces.
            const res = runField(fieldName, "");
            expect(res.getErrors(fieldName)).not.toContain(lengthMessage);
        });
    });

    describe("full-form run (submit gate)", () => {
        it("produces every OPS-5892 error key when the form is empty", () => {
            const res = suite.run({
                agreementTitle: "",
                modificationNumber: "",
                purchaseOrderNumber: "",
                taskOrderNumber: ""
            });

            expect(res.hasErrors("agreementTitle")).toBe(true);
            expect(res.hasErrors("modificationNumber")).toBe(true);
            expect(res.hasErrors("purchaseOrderNumber")).toBe(true);
            expect(res.hasErrors("taskOrderNumber")).toBe(true);
            expect(res.hasErrors()).toBe(true);
        });

        it("clears the OPS-5892 keys once all four fields are populated", () => {
            const res = suite.run({
                vendor: 1,
                agreementTitle: "Final Signed Award Title",
                modificationNumber: "Base",
                purchaseOrderNumber: "PO-123",
                taskOrderNumber: "TO-456",
                contractNumber: "GS-123-456",
                awardAmount: "1500000",
                awardDate: "09/30/2024"
            });

            expect(res.hasErrors("agreementTitle")).toBe(false);
            expect(res.hasErrors("modificationNumber")).toBe(false);
            expect(res.hasErrors("purchaseOrderNumber")).toBe(false);
            expect(res.hasErrors("taskOrderNumber")).toBe(false);
            expect(res.hasErrors()).toBe(false);
        });
    });
});
