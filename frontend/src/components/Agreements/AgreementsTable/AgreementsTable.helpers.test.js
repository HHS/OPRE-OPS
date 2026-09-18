import { describe, it, expect } from "vitest";
import {
    getAgreementLockedMessage,
    getAgreementName,
    getAgreementStartDate,
    getAgreementEndDate,
    getProcurementShopDisplay
} from "./AgreementsTable.helpers";

describe("AgreementsTable helpers", () => {
    describe("getAgreementName", () => {
        it("prefers the nickname when present", () => {
            const agreement = { nick_name: "HS", name: "Head Start Contract" };
            expect(getAgreementName(agreement)).toBe("HS");
        });

        it("prefers the server-computed display_name over a local nick_name computation", () => {
            const agreement = { display_name: "AACFRC", nick_name: "AACFRC", name: "Full Title" };
            expect(getAgreementName(agreement)).toBe("AACFRC");
        });

        it("falls back to name when there is no nickname", () => {
            const agreement = { nick_name: null, name: "Head Start Contract" };
            expect(getAgreementName(agreement)).toBe("Head Start Contract");
        });

        it("falls back to name when nick_name is whitespace-only", () => {
            const agreement = { nick_name: "   ", name: "Head Start Contract" };
            expect(getAgreementName(agreement)).toBe("Head Start Contract");
        });

        it("throws when agreement is not an object", () => {
            expect(() => getAgreementName("not-an-object")).toThrowError(/Agreement must be an object/i);
        });
    });

    describe("getAgreementStartDate", () => {
        it("returns formatted date when sc_start_date exists", () => {
            const agreement = { sc_start_date: "2025-01-15" };
            expect(getAgreementStartDate(agreement)).toBe("1/15/2025");
        });

        it("returns TBD when sc_start_date is null", () => {
            const agreement = { sc_start_date: null };
            expect(getAgreementStartDate(agreement)).toBe("TBD");
        });

        it("returns TBD when sc_start_date is undefined", () => {
            const agreement = {};
            expect(getAgreementStartDate(agreement)).toBe("TBD");
        });
    });

    describe("getAgreementEndDate", () => {
        it("returns formatted date when sc_end_date exists", () => {
            const agreement = { sc_end_date: "2025-12-31" };
            expect(getAgreementEndDate(agreement)).toBe("12/31/2025");
        });

        it("returns TBD when sc_end_date is null", () => {
            const agreement = { sc_end_date: null };
            expect(getAgreementEndDate(agreement)).toBe("TBD");
        });

        it("returns TBD when sc_end_date is undefined", () => {
            const agreement = {};
            expect(getAgreementEndDate(agreement)).toBe("TBD");
        });
    });

    describe("getProcurementShopDisplay", () => {
        it("returns formatted display when procurement_shop exists", () => {
            const agreement = {
                procurement_shop: { abbr: "GCS", fee_percentage: 5.0 }
            };
            expect(getProcurementShopDisplay(agreement)).toBe("GCS - Fee Rate: 5%");
        });

        it("returns TBD when procurement_shop is null", () => {
            const agreement = { procurement_shop: null };
            expect(getProcurementShopDisplay(agreement)).toBe("TBD");
        });

        it("returns TBD when procurement_shop has no abbr", () => {
            const agreement = { procurement_shop: { fee_percentage: 5.0 } };
            expect(getProcurementShopDisplay(agreement)).toBe("TBD");
        });

        it("returns TBD when no procurement_shop", () => {
            const agreement = {};
            expect(getProcurementShopDisplay(agreement)).toBe("TBD");
        });
    });

    describe("getAgreementLockedMessage", () => {
        it("returns the not-team-member message when the user cannot edit the agreement", () => {
            const agreement = { agreement_type: "CONTRACT", _meta: { isEditable: false } };
            expect(getAgreementLockedMessage(agreement, false, false)).toBe(
                "Only team members on this agreement can edit or delete"
            );
        });

        it("returns the not-developed message for a non-super team member on a not-developed type", () => {
            const agreement = { agreement_type: "IAA", _meta: { isEditable: true } };
            expect(getAgreementLockedMessage(agreement, false, true)).toBe(
                "This agreement cannot be edited because it is not developed yet, \nplease contact the Budget Team."
            );
        });

        // Regression test: the not-developed reason must win even when the backend also supplies
        // a delete-specific lockedMessage, since the Edit and Delete icons share this one tooltip.
        it("prefers the not-developed message over a backend lockedMessage for a non-super team member", () => {
            const agreement = {
                agreement_type: "IAA",
                _meta: {
                    isEditable: true,
                    lockedMessage: "Cannot delete an agreement with budget lines that are not in Draft status"
                }
            };
            expect(getAgreementLockedMessage(agreement, false, true)).toBe(
                "This agreement cannot be edited because it is not developed yet, \nplease contact the Budget Team."
            );
        });

        it("does not apply the not-developed message to a super user", () => {
            const agreement = { agreement_type: "IAA", _meta: { isEditable: true } };
            expect(getAgreementLockedMessage(agreement, true, true)).toBe("");
        });

        it("defers to the backend lockedMessage for a developed-type team member", () => {
            const agreement = {
                agreement_type: "CONTRACT",
                _meta: {
                    isEditable: true,
                    lockedMessage: "Cannot delete an agreement with budget lines that are not in Draft status"
                }
            };
            expect(getAgreementLockedMessage(agreement, false, false)).toBe(
                "Cannot delete an agreement with budget lines that are not in Draft status"
            );
        });

        it("defers to the backend lockedMessage for a super user (e.g. an awarded agreement)", () => {
            const agreement = {
                agreement_type: "CONTRACT",
                _meta: { isEditable: true, lockedMessage: "Cannot delete an awarded agreement" }
            };
            expect(getAgreementLockedMessage(agreement, true, false)).toBe("Cannot delete an awarded agreement");
        });

        it("falls back to the default disabled message for a non-super team member with no backend message", () => {
            const agreement = { agreement_type: "CONTRACT", _meta: { isEditable: true } };
            expect(getAgreementLockedMessage(agreement, false, false)).toBe("Disabled");
        });

        it("falls back to an empty string for a super user with no backend message", () => {
            const agreement = { agreement_type: "CONTRACT", _meta: { isEditable: true } };
            expect(getAgreementLockedMessage(agreement, true, false)).toBe("");
        });
    });
});
