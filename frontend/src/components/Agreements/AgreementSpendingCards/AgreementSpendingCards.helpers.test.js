import { describe, it, expect } from "vitest";
import { transformToChartData } from "./AgreementSpendingCards.helpers";

describe("transformToChartData", () => {
    const mockAgreementTypes = [
        { type: "CONTRACT", label: "Contracts", total: 20000000, percent: 43, new: 10000000, continuing: 10000000 },
        { type: "PARTNER", label: "Partner", total: 15000000, percent: 33, new: 8000000, continuing: 7000000 },
        { type: "GRANT", label: "Grants", total: 8000000, percent: 17, new: 5000000, continuing: 3000000 },
        {
            type: "DIRECT_OBLIGATION",
            label: "Direct Oblig.",
            total: 3000000,
            percent: 7,
            new: 2000000,
            continuing: 1000000
        }
    ];
    const totalSpending = 46000000;

    it("transforms agreement types into chart data with New and Continuing segments", () => {
        const result = transformToChartData(mockAgreementTypes, totalSpending);

        expect(result).toHaveLength(8);
        expect(result[0].id).toBe("CONTRACT");
        expect(result[0].label).toBe("Contracts (New)");
        expect(result[0].value).toBe(10000000);
        expect(result[0].color).toBe("var(--data-viz-agreement-contract)");
        expect(result[1].id).toBe("CONTRACT_CONTINUING");
        expect(result[1].label).toBe("Contracts (Continuing)");
        expect(result[1].value).toBe(10000000);
        expect(result[1].color).toBe("var(--data-viz-agreement-contract-continuing)");
    });

    it("filters out types with zero value", () => {
        const typesWithZero = [
            ...mockAgreementTypes.slice(0, 2),
            { type: "GRANT", label: "Grants", total: 0, percent: 0, new: 0, continuing: 0 },
            mockAgreementTypes[3]
        ];

        const result = transformToChartData(typesWithZero, 38000000);
        expect(result).toHaveLength(6);
        expect(result.find((d) => d.id === "GRANT")).toBeUndefined();
        expect(result.find((d) => d.id === "GRANT_CONTINUING")).toBeUndefined();
    });

    it("returns empty array for null input", () => {
        expect(transformToChartData(null, 1000)).toEqual([]);
    });

    it("returns empty array for zero total spending", () => {
        expect(transformToChartData(mockAgreementTypes, 0)).toEqual([]);
    });

    it("returns empty array for empty agreement types", () => {
        expect(transformToChartData([], 1000)).toEqual([]);
    });

    it("maintains correct order from AGREEMENT_TYPE_ORDER", () => {
        const result = transformToChartData(mockAgreementTypes, totalSpending);
        expect(result[0].id).toBe("CONTRACT");
        expect(result[1].id).toBe("CONTRACT_CONTINUING");
        expect(result[2].id).toBe("PARTNER");
        expect(result[3].id).toBe("PARTNER_CONTINUING");
        expect(result[4].id).toBe("GRANT");
        expect(result[5].id).toBe("GRANT_CONTINUING");
        expect(result[6].id).toBe("DIRECT_OBLIGATION");
        expect(result[7].id).toBe("DIRECT_OBLIGATION_CONTINUING");
    });

    it("each segment has a percent field", () => {
        const result = transformToChartData(mockAgreementTypes, totalSpending);
        result.forEach((segment) => {
            expect(segment).toHaveProperty("percent");
        });
    });

    it("dominant segment shows 99 (not 100 or '>99') when non-zero peers exist", () => {
        const dominantTypes = [
            { type: "CONTRACT", new: 996, continuing: 0 },
            { type: "GRANT", new: 4, continuing: 0 }
        ];
        const result = transformToChartData(dominantTypes, 1000);
        const contract = result.find((d) => d.id === "CONTRACT");
        const grant = result.find((d) => d.id === "GRANT");
        expect(contract.percent).toBe(99);
        expect(grant.percent).toBe("<1");
    });

    it("3-way equal split: largest remainder assigns the extra point to the biggest segment", () => {
        const equalTypes = [
            { type: "CONTRACT", new: 333, continuing: 0 },
            { type: "GRANT", new: 333, continuing: 0 },
            { type: "DIRECT_OBLIGATION", new: 334, continuing: 0 }
        ];
        const result = transformToChartData(equalTypes, 1000);

        expect(result.map((segment) => segment.percent)).toEqual([33, 33, 34]);
    });

    it("sub-1% non-zero segment shows '<1' instead of 0", () => {
        const tinyTypes = [
            { type: "CONTRACT", new: 996, continuing: 0 },
            { type: "GRANT", new: 4, continuing: 0 }
        ];
        const result = transformToChartData(tinyTypes, 1000);
        const grant = result.find((d) => d.id === "GRANT");
        expect(grant.percent).toBe("<1");
    });

    it("single segment gets 100% (no non-zero peers — correct)", () => {
        const singleType = [{ type: "CONTRACT", new: 1000, continuing: 0 }];
        const result = transformToChartData(singleType, 1000);
        expect(result[0].percent).toBe(100);
    });
});
