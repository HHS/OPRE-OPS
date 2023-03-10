import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { getPortfolioCansFundingDetails } from "./getCanFundingSummary";

test("successfully gets the can funding details from the backend", async () => {
    const mockCANId = "2";
    const mockBackendResponse = {
        can: {},
        received_funding: 1,
        expected_funding: 2,
        total_funding: 3,
        carry_forward_funding: 4,
        planned_funding: 5,
        obligated_funding: 6,
        in_execution_funding: 7,
        available_funding: 8,
        expiration_date: "01/01/2023",
    };

    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetPortfolio = await getPortfolioCansFundingDetails({ id: mockCANId, fiscalYear: 2023 });

    expect(actualGetPortfolio).toEqual(mockBackendResponse);
});

test("malformed request - no fiscalYear", async () => {
    const mockCANId = "2";
    const mockBackendResponse = {};

    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetPortfolio = await getPortfolioCansFundingDetails({ id: mockCANId });

    expect(actualGetPortfolio).toEqual(mockBackendResponse);
});
