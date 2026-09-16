import { describe, it, expect } from "vitest";
import {
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
});
