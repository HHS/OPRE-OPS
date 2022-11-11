import TestApplicationContext from "../../applicationContext/TestApplicationContext";
import { getPortfolioAndSetState, getPortfolioFundingAndSetState } from "./util";
import { dispatchUsecase } from "../../helpers/test";
import store from "../../store";

test("successfully gets the Portfolio from the backend and directly puts it into state", async () => {
    const mockPortfolioId = "2";
    const mockBackendResponse = {
        id: mockPortfolioId,
        name: "OPS-Portfolio-1",
        otherStuff: "DogCow",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetPortfolio = getPortfolioAndSetState(mockPortfolioId);
    await dispatchUsecase(actualGetPortfolio);
    const portfolio = store.getState().portfolioFundingSummary.portfolio;
    expect(portfolio).toEqual(mockBackendResponse);
});

test("successfully gets the Portfolio budget details directly puts it into state", async () => {
    const mockPortfolioId = "2";
    const mockBackendResponse = {
        total_funding: {
            amount: 1000000.12,
            percent: "Total",
        },
        planned_funding: {
            amount: 200.23,
            percent: "10",
        },
        obligated_funding: {
            amount: 1.1,
            percent: "3",
        },
        in_execution_funding: {
            amount: 30000000000,
            percent: "99",
        },
        available_funding: {
            amount: 0,
            percent: "0",
        },
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const portfolioBudget = getPortfolioFundingAndSetState(mockPortfolioId);
    await dispatchUsecase(portfolioBudget);
    const portfolioFunding = store.getState().portfolioFundingSummary.portfolioFunding;
    expect(portfolioFunding).toEqual(mockBackendResponse);
});
