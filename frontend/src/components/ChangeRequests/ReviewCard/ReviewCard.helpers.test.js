import { titleGenerator } from "../../../helpers/changeRequests.helpers";
import { urlGenerator } from "./ReviewCard.helpers";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants";

describe("ReviewCard.helpers", () => {
    describe("titleGenerator", () => {
        test("returns 'Budget Change' for PROCUREMENT_SHOP type", () => {
            expect(titleGenerator(CHANGE_REQUEST_TYPES.PROCUREMENT_SHOP)).toBe("Budget Change");
        });

        test("returns the change request type for BUDGET type", () => {
            expect(titleGenerator(CHANGE_REQUEST_TYPES.BUDGET)).toBe(CHANGE_REQUEST_TYPES.BUDGET);
        });

        test("returns the change request type for STATUS type", () => {
            expect(titleGenerator(CHANGE_REQUEST_TYPES.STATUS)).toBe(CHANGE_REQUEST_TYPES.STATUS);
        });

        test("returns the input value for unknown change request type", () => {
            const unknownType = "Unknown Type";
            expect(titleGenerator(unknownType)).toBe(unknownType);
        });

        test("handles undefined input", () => {
            expect(titleGenerator(undefined)).toBe(undefined);
        });

        test("handles null input", () => {
            expect(titleGenerator(null)).toBe(null);
        });
    });

    describe("urlGenerator", () => {
        const agreementId = 123;
        const bliToStatus = "PLANNED";

        test("generates correct URL for BUDGET change request type", () => {
            const expected = `/agreements/approve/${agreementId}?type=budget-change`;
            expect(urlGenerator(CHANGE_REQUEST_TYPES.BUDGET, agreementId, bliToStatus)).toBe(expected);
        });

        test("generates correct URL for PROCUREMENT_SHOP change request type", () => {
            const expected = `/agreements/approve/${agreementId}?type=procurement-shop-change`;
            expect(urlGenerator(CHANGE_REQUEST_TYPES.PROCUREMENT_SHOP, agreementId, bliToStatus)).toBe(expected);
        });

        test("generates correct URL for STATUS change request type", () => {
            const expected = `/agreements/approve/${agreementId}?type=status-change&to=planned`;
            expect(urlGenerator(CHANGE_REQUEST_TYPES.STATUS, agreementId, bliToStatus)).toBe(expected);
        });

        test("generates correct URL for unknown change request type", () => {
            const unknownType = "Unknown Type";
            const expected = `/agreements/approve/${agreementId}?type=unknown-type&to=planned`;
            expect(urlGenerator(unknownType, agreementId, bliToStatus)).toBe(expected);
        });

        test("handles different bliToStatus values", () => {
            const status = "EXECUTING";
            const expected = `/agreements/approve/${agreementId}?type=status-change&to=executing`;
            expect(urlGenerator(CHANGE_REQUEST_TYPES.STATUS, agreementId, status)).toBe(expected);
        });

        test("handles mixed case bliToStatus", () => {
            const status = "PlAnNeD";
            const expected = `/agreements/approve/${agreementId}?type=status-change&to=planned`;
            expect(urlGenerator(CHANGE_REQUEST_TYPES.STATUS, agreementId, status)).toBe(expected);
        });

        test("handles string agreementId", () => {
            const stringId = "456";
            const expected = `/agreements/approve/${stringId}?type=budget-change`;
            expect(urlGenerator(CHANGE_REQUEST_TYPES.BUDGET, stringId, bliToStatus)).toBe(expected);
        });
    });
});
