import suite from "./suite";
import { USER_ROLES } from "../../Users/User.constants";

describe("BudgetLinesForm Validation Suite", () => {
    const validData = {
        servicesComponentId: 1,
        selectedCan: { id: 1, number: "G123456" },
        enteredAmount: 1000,
        needByDate: "12/31/2025"
    };

    const invalidData = {
        servicesComponentId: null,
        selectedCan: null,
        enteredAmount: null,
        needByDate: ""
    };

    describe("Regular User Validations", () => {
        it("should pass validation with valid data for regular users", () => {
            const result = suite(validData, []);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("allServicesComponentSelect")).toHaveLength(0);
            expect(result.getErrors("selectedCan")).toHaveLength(0);
            expect(result.getErrors("enteredAmount")).toHaveLength(0);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should fail validation with invalid data for regular users", () => {
            const result = suite(invalidData, []);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("allServicesComponentSelect")).toContain("This is required information");
            expect(result.getErrors("selectedCan")).toContain("This is required information");
            expect(result.getErrors("enteredAmount")).toContain("This is required information");
            expect(result.getErrors("needByDate")).toContain("This is required information");
        });

        it("should validate amount is greater than 0", () => {
            const dataWithZeroAmount = { ...validData, enteredAmount: 0 };
            const result = suite(dataWithZeroAmount, []);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("enteredAmount")).toContain("Amount must be greater than 0");
        });

        it("should validate date format", () => {
            const dataWithInvalidDate = { ...validData, needByDate: "invalid-date" };
            const result = suite(dataWithInvalidDate, []);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be MM/DD/YYYY");
        });

        it("should validate date is in the future", () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const pastDate = `${String(yesterday.getMonth() + 1).padStart(2, "0")}/${String(yesterday.getDate()).padStart(2, "0")}/${yesterday.getFullYear()}`;

            const dataWithPastDate = { ...validData, needByDate: pastDate };
            const result = suite(dataWithPastDate, []);

            expect(result.hasErrors()).toBe(true);
            expect(result.getErrors("needByDate")).toContain("Date must be in the future");
        });
    });

    describe("SUPER_USER Validations", () => {
        it("should skip all validations for SUPER_USER with invalid data", () => {
            const result = suite(invalidData, [{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }]);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("allServicesComponentSelect")).toHaveLength(0);
            expect(result.getErrors("selectedCan")).toHaveLength(0);
            expect(result.getErrors("enteredAmount")).toHaveLength(0);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });

        it("should skip all validations for SUPER_USER with completely empty data", () => {
            const emptyData = {
                servicesComponentId: undefined,
                selectedCan: undefined,
                enteredAmount: undefined,
                needByDate: undefined
            };
            const result = suite(emptyData, [{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }]);

            expect(result.hasErrors()).toBe(false);
        });

        it("should skip validations for SUPER_USER even with negative amounts", () => {
            const dataWithNegativeAmount = { ...validData, enteredAmount: -1000 };
            const result = suite(dataWithNegativeAmount, [{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }]);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("enteredAmount")).toHaveLength(0);
        });

        it("should skip validations for SUPER_USER even with past dates", () => {
            const dataWithPastDate = { ...validData, needByDate: "01/01/2020" };
            const result = suite(dataWithPastDate, [{ id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true }]);

            expect(result.hasErrors()).toBe(false);
            expect(result.getErrors("needByDate")).toHaveLength(0);
        });
    });

    describe("Mixed User Roles", () => {
        it("should skip validations when SUPER_USER is present with other roles", () => {
            const userRoles = [
                { id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false },
                { id: 7, name: USER_ROLES.SUPER_USER, is_superuser: true },
                { id: 4, name: USER_ROLES.BUDGET_TEAM, is_superuser: false }
            ];
            const result = suite(invalidData, userRoles);

            expect(result.hasErrors()).toBe(false);
        });

        it("should validate normally when SUPER_USER is not present with other roles", () => {
            const userRoles = [
                { id: 3, name: USER_ROLES.VIEWER_EDITOR, is_superuser: false },
                { id: 4, name: USER_ROLES.BUDGET_TEAM, is_superuser: false }
            ];
            const result = suite(invalidData, userRoles);

            expect(result.hasErrors()).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("should handle undefined userRoles parameter", () => {
            const result = suite(validData, undefined);

            expect(result.hasErrors()).toBe(false);
        });

        it("should handle null userRoles parameter", () => {
            const result = suite(validData, null);

            expect(result.hasErrors()).toBe(false);
        });

        it("should handle empty userRoles array", () => {
            const result = suite(validData, []);

            expect(result.hasErrors()).toBe(false);
        });

        it("should validate normally with invalid data and empty roles", () => {
            const result = suite(invalidData, []);

            expect(result.hasErrors()).toBe(true);
        });
    });
});
