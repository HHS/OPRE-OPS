import {
    calculateTotal,
    getProcurementShopSubTotal,
    getAgreementType,
    getPartnerType,
    getFundingMethod,
    isFieldVisible,
    isNotDevelopedYet
} from "./agreement.helpers";
import { BLI_STATUS } from "./budgetLines.helpers";
import { AGREEMENT_TYPES } from "../components/ServicesComponents/ServicesComponents.constants";
import { AgreementType, AgreementFields } from "../pages/agreements/agreements.constants";
import { NO_DATA } from "../constants";

describe("getProcurementShopSubTotal", () => {
    /** @type {import("../types/AgreementTypes").Agreement} */
    let agreement;
    /** @type {import("../types/BudgetLineTypes").BudgetLine[]} */
    let budgetLines;

    beforeEach(() => {
        agreement = {
            procurement_shop: {
                fee_percentage: 10
            },
            budget_line_items: [
                { amount: 100, status: BLI_STATUS.DRAFT },
                { amount: 200, status: BLI_STATUS.PLANNED }
            ]
        };
        budgetLines = [
            { amount: 50, status: BLI_STATUS.DRAFT },
            { amount: 150, status: BLI_STATUS.PLANNED }
        ];
    });

    it("returns 0 if procurement_shop is not present", () => {
        agreement.procurement_shop = null;
        const result = getProcurementShopSubTotal(agreement);
        expect(result).toBe(0);
    });

    it("excludes DRAFT budget lines before approval", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines, false);
        // Only the PLANNED budget line (150 * 10 / 100) = 150 * 0.10 = 15
        expect(result).toBe(15);
    });

    it("includes all budget lines after approval", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines, true);
        // Both DRAFT and PLANNED budget lines ((50 + 150) * 10 / 100) = 200 * 0.10 = 20
        expect(result).toBe(20);
    });

    it("handles empty or undefined amounts", () => {
        budgetLines = [
            { amount: undefined, status: BLI_STATUS.DRAFT },
            { amount: 100, status: BLI_STATUS.PLANNED }
        ];
        const result = getProcurementShopSubTotal(agreement, budgetLines, true);
        // Should treat undefined amount as 0: (0 + 100) * 10 / 100 = 100 * 0.10 = 10
        expect(result).toBe(10);
    });

    it("calculates total based on agreement.budget_line_items if budgetLines not provided", () => {
        const result = getProcurementShopSubTotal(agreement, [], true);
        // Both DRAFT and PLANNED budget lines from agreement ((100 + 200) * 10 / 100) = 300 * 0.10 = 30
        expect(result).toBe(30);
    });
});

describe("getAgreementType", () => {
    it("returns the correct agreement type label", () => {
        const result = getAgreementType(AgreementType.CONTRACT);
        expect(result).toBe("Contract");
    });

    it("returns 'Partner (IAA, AA, IDDA, IPA)' for AA when showAllPartners is false", () => {
        const result = getAgreementType(AGREEMENT_TYPES.AA, false);
        expect(result).toBe("Partner (IAA, AA, IDDA, IPA)");
    });

    it("returns 'Partner (IAA, AA, IDDA, IPA)' for IAA when showAllPartners is false", () => {
        const result = getAgreementType(AGREEMENT_TYPES.IAA, false);
        expect(result).toBe("Partner (IAA, AA, IDDA, IPA)");
    });

    it("returns the standard label for AA when showAllPartners is true", () => {
        const result = getAgreementType(AGREEMENT_TYPES.AA, true);
        expect(result).toBe("Partner - AA");
    });

    it("returns NO_DATA when agreementType is null", () => {
        const result = getAgreementType(null);
        expect(result).toBe(NO_DATA);
    });

    it("returns NO_DATA when agreementType is undefined", () => {
        const result = getAgreementType(undefined);
        expect(result).toBe(NO_DATA);
    });
});

describe("getPartnerType", () => {
    it("returns the abbreviation by default", () => {
        const result = getPartnerType(AGREEMENT_TYPES.AA);
        expect(result).toBe("Partner - AA");
    });

    it("returns 'Assisted Acquisition (AA)' for AA when abbr is false", () => {
        const result = getPartnerType(AGREEMENT_TYPES.AA, false);
        expect(result).toBe("Assisted Acquisition (AA)");
    });

    it("returns 'Inter-Agency Agreements (IAA)' for IAA when abbr is false", () => {
        const result = getPartnerType(AGREEMENT_TYPES.IAA, false);
        expect(result).toBe("Inter-Agency Agreements (IAA)");
    });

    it("returns NO_DATA when agreementType is null", () => {
        const result = getPartnerType(null);
        expect(result).toBe(NO_DATA);
    });

    it("returns NO_DATA when agreementType is undefined", () => {
        const result = getPartnerType(undefined);
        expect(result).toBe(NO_DATA);
    });
});

describe("getFundingMethod", () => {
    it("returns 'Advanced Funding' for AA agreement type", () => {
        const result = getFundingMethod(AgreementType.AA);
        expect(result).toBe("Advanced Funding");
    });

    it("returns NO_DATA for non-AA agreement types", () => {
        const result = getFundingMethod(AgreementType.CONTRACT);
        expect(result).toBe(NO_DATA);
    });

    it("returns NO_DATA for undefined agreement type", () => {
        const result = getFundingMethod(undefined);
        expect(result).toBe(NO_DATA);
    });
});

describe("isFieldVisible", () => {
    it("returns true for fields visible in CONTRACT agreements", () => {
        expect(isFieldVisible(AgreementType.CONTRACT, AgreementFields.DescriptionAndNotes)).toBe(true);
        expect(isFieldVisible(AgreementType.CONTRACT, AgreementFields.ContractType)).toBe(true);
        expect(isFieldVisible(AgreementType.CONTRACT, AgreementFields.Vendor)).toBe(true);
    });

    it("returns false for fields not visible in CONTRACT agreements", () => {
        expect(isFieldVisible(AgreementType.CONTRACT, AgreementFields.PartnerType)).toBe(false);
        expect(isFieldVisible(AgreementType.CONTRACT, AgreementFields.FundingMethod)).toBe(false);
        expect(isFieldVisible(AgreementType.CONTRACT, AgreementFields.RequestingAgency)).toBe(false);
    });

    it("returns true for AA-specific fields in AA agreements", () => {
        expect(isFieldVisible(AgreementType.AA, AgreementFields.PartnerType)).toBe(true);
        expect(isFieldVisible(AgreementType.AA, AgreementFields.FundingMethod)).toBe(true);
        expect(isFieldVisible(AgreementType.AA, AgreementFields.RequestingAgency)).toBe(true);
        expect(isFieldVisible(AgreementType.AA, AgreementFields.ServicingAgency)).toBe(true);
        expect(isFieldVisible(AgreementType.AA, AgreementFields.Methodologies)).toBe(true);
        expect(isFieldVisible(AgreementType.AA, AgreementFields.SpecialTopic)).toBe(true);
    });

    it("returns true for common fields in AA agreements", () => {
        expect(isFieldVisible(AgreementType.AA, AgreementFields.DescriptionAndNotes)).toBe(true);
        expect(isFieldVisible(AgreementType.AA, AgreementFields.ContractType)).toBe(true);
        expect(isFieldVisible(AgreementType.AA, AgreementFields.Vendor)).toBe(true);
    });

    it("returns false for unsupported agreement types", () => {
        expect(isFieldVisible(AgreementType.GRANT, AgreementFields.DescriptionAndNotes)).toBe(false);
        expect(isFieldVisible(AgreementType.IAA, AgreementFields.ContractType)).toBe(false);
    });

    it("returns false for unknown fields", () => {
        expect(isFieldVisible(AgreementType.CONTRACT, "UNKNOWN_FIELD")).toBe(false);
    });
});

describe("calculateTotal", () => {
    /** @type {import("../types/BudgetLineTypes").BudgetLine[]} */
    let budgetLines;

    beforeEach(() => {
        budgetLines = [
            { amount: 100, status: BLI_STATUS.DRAFT },
            { amount: 200, status: BLI_STATUS.PLANNED },
            { amount: 300, status: BLI_STATUS.EXECUTING }
        ];
    });

    it("calculates correct total with typical fee rate (4.8%)", () => {
        const result = calculateTotal(budgetLines, 4.8, false);
        // Only non-DRAFT: (200 + 300) * 0.048 = 24
        expect(result).toBe(24);
    });

    it("calculates correct total with higher fee rate (10%)", () => {
        const result = calculateTotal(budgetLines, 10, false);
        // Only non-DRAFT: (200 + 300) * 0.10 = 50
        expect(result).toBe(50);
    });

    it("calculates correct total with decimal fee rate (2.5%)", () => {
        const result = calculateTotal(budgetLines, 2.5, false);
        // Only non-DRAFT: (200 + 300) * 0.025 = 12.5
        expect(result).toBe(12.5);
    });

    it("excludes DRAFT budget lines when isAfterApproval is false", () => {
        const result = calculateTotal(budgetLines, 5, false);
        // Only non-DRAFT: (200 + 300) * 0.05 = 25
        expect(result).toBe(25);
    });

    it("includes all budget lines when isAfterApproval is true", () => {
        const result = calculateTotal(budgetLines, 5, true);
        // All lines: (100 + 200 + 300) * 0.05 = 30
        expect(result).toBe(30);
    });

    it("handles zero fee rate", () => {
        const result = calculateTotal(budgetLines, 0, false);
        expect(result).toBe(0);
    });

    it("handles undefined amounts as 0", () => {
        const budgetLinesWithUndefined = [
            { amount: undefined, status: BLI_STATUS.PLANNED },
            { amount: 100, status: BLI_STATUS.PLANNED }
        ];
        const result = calculateTotal(budgetLinesWithUndefined, 10, false);
        // Only the defined amount: 100 * 0.10 = 10
        expect(result).toBe(10);
    });

    it("handles null amounts as 0", () => {
        const budgetLinesWithNull = [
            { amount: null, status: BLI_STATUS.PLANNED },
            { amount: 100, status: BLI_STATUS.PLANNED }
        ];
        const result = calculateTotal(budgetLinesWithNull, 10, false);
        // Only the defined amount: 100 * 0.10 = 10
        expect(result).toBe(10);
    });

    it("returns 0 for empty budget lines array", () => {
        const result = calculateTotal([], 5, false);
        expect(result).toBe(0);
    });

    it("returns 0 for null budget lines", () => {
        const result = calculateTotal(null, 5, false);
        expect(result).toBe(0);
    });

    it("returns 0 for undefined budget lines", () => {
        const result = calculateTotal(undefined, 5, false);
        expect(result).toBe(0);
    });

    it("handles very small fee rates (0.1%)", () => {
        const result = calculateTotal([{ amount: 1000, status: BLI_STATUS.PLANNED }], 0.1, false);
        // 1000 * 0.001 = 1
        expect(result).toBe(1);
    });

    it("handles large amounts with typical fee rate", () => {
        const largeBudgetLines = [
            { amount: 1000000, status: BLI_STATUS.PLANNED },
            { amount: 2000000, status: BLI_STATUS.EXECUTING }
        ];
        const result = calculateTotal(largeBudgetLines, 4.8, false);
        // (1000000 + 2000000) * 0.048 = 144000
        expect(result).toBe(144000);
    });
});

describe("isNotDevelopedYet", () => {
    it("returns true for GRANT agreement type", () => {
        const result = isNotDevelopedYet(AgreementType.GRANT);
        expect(result).toBe(true);
    });

    it("returns true for DIRECT_OBLIGATION agreement type", () => {
        const result = isNotDevelopedYet(AgreementType.DIRECT_OBLIGATION);
        expect(result).toBe(true);
    });

    it("returns true for IAA agreement type", () => {
        const result = isNotDevelopedYet(AgreementType.IAA);
        expect(result).toBe(true);
    });

    it("returns false for AA agreement type", () => {
        const result = isNotDevelopedYet(AgreementType.AA);
        expect(result).toBe(false);
    });

    it("returns false for CONTRACT agreement type", () => {
        const result = isNotDevelopedYet(AgreementType.CONTRACT);
        expect(result).toBe(false);
    });

    it("returns false for MISCELLANEOUS agreement type", () => {
        const result = isNotDevelopedYet(AgreementType.MISCELLANEOUS);
        expect(result).toBe(false);
    });

    it("returns false for undefined agreement type", () => {
        const result = isNotDevelopedYet(undefined);
        expect(result).toBe(false);
    });

    it("returns false for null agreement type", () => {
        const result = isNotDevelopedYet(null);
        expect(result).toBe(false);
    });

    it("returns false for empty string agreement type", () => {
        const result = isNotDevelopedYet("");
        expect(result).toBe(false);
    });

    it("returns false for unknown agreement type", () => {
        const result = isNotDevelopedYet("UNKNOWN_TYPE");
        expect(result).toBe(false);
    });
});
