import { groupByDivision } from "./PortfolioList.helpers";

const mockPortfolios = [
    {
        id: 1,
        name: "Portfolio A",
        abbreviation: "PA",
        division_id: 1,
        division: {
            id: 1,
            name: "Division 1",
            abbreviation: "D1",
            division_director_id: 1,
            deputy_division_director_id: 2
        }
    },
    {
        id: 2,
        name: "Portfolio B",
        abbreviation: "PB",
        division_id: 1,
        division: {
            id: 1,
            name: "Division 1",
            abbreviation: "D1",
            division_director_id: 1,
            deputy_division_director_id: 2
        }
    },
    {
        id: 3,
        name: "Portfolio C",
        abbreviation: "PC",
        division_id: 2,
        division: {
            id: 2,
            name: "Division 2",
            abbreviation: "D2",
            division_director_id: 3,
            deputy_division_director_id: 4
        }
    }
];

describe("groupByDivision", () => {
    it("should group portfolios by division name", () => {
        const result = groupByDivision(mockPortfolios);

        expect(result["Division 1"]).toHaveLength(2);
        expect(result["Division 2"]).toHaveLength(1);
        expect(result["Division 1"][0].name).toBe("Portfolio A");
        expect(result["Division 1"][1].name).toBe("Portfolio B");
        expect(result["Division 2"][0].name).toBe("Portfolio C");
    });

    it("should return empty object when portfolios is null", () => {
        const result = groupByDivision(null);
        expect(result).toEqual({});
    });

    it("should return empty object when portfolios is undefined", () => {
        const result = groupByDivision(undefined);
        expect(result).toEqual({});
    });

    it("should handle empty array", () => {
        const result = groupByDivision([]);
        expect(result).toEqual({});
    });

    it("should skip portfolios without division name", () => {
        const portfoliosWithMissingDivision = [
            mockPortfolios[0],
            {
                ...mockPortfolios[1],
                division: {
                    id: 1,
                    abbreviation: "D1",
                    division_director_id: 1,
                    deputy_division_director_id: 2
                }
            },
            mockPortfolios[2]
        ];

        const result = groupByDivision(portfoliosWithMissingDivision);

        expect(Object.keys(result)).toEqual(["Division 1", "Division 2"]);
        expect(result["Division 1"]).toHaveLength(1);
        expect(result["Division 2"]).toHaveLength(1);
    });
});
