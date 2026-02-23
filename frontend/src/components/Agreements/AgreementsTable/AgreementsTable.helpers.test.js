import { describe, it, expect } from "vitest";
import { getAgreementStartDate, getAgreementEndDate, getProcurementShopDisplay } from "./AgreementsTable.helpers";

describe("AgreementsTable helpers", () => {
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
