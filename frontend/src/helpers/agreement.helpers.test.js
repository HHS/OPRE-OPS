import {
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
                { amount: 200, status: "APPROVED" }
            ]
        };
        budgetLines = [
            { amount: 50, status: BLI_STATUS.DRAFT },
            { amount: 150, status: "APPROVED" }
        ];
    });

    it("returns 0 if procurement_shop is not present", () => {
        agreement.procurement_shop = null;
        const result = getProcurementShopSubTotal(agreement);
        expect(result).toBe(0);
    });

    it("excludes DRAFT budget lines before approval", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines, false);
        // Only the APPROVED budget line (150 * 10)
        expect(result).toBe(1500);
    });

    it("includes all budget lines after approval", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines, true);
        // Both DRAFT and APPROVED budget lines ((50 + 150) * 10)
        expect(result).toBe(2000);
    });

    it("handles empty or undefined amounts", () => {
        budgetLines = [
            { amount: undefined, status: BLI_STATUS.DRAFT },
            { amount: 100, status: "APPROVED" }
        ];
        const result = getProcurementShopSubTotal(agreement, budgetLines, true);
        // Should treat undefined amount as 0
        expect(result).toBe(1000);
    });

    it("calculates total based on agreement.budget_line_items if budgetLines not provided", () => {
        const result = getProcurementShopSubTotal(agreement, [], true);
        // Both DRAFT and APPROVED budget lines from agreement ((100 + 200) * 10)
        expect(result).toBe(3000);
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
});
