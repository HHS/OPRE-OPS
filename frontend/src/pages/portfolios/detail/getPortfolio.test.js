import { getPortfolioAndSetState } from "./getPortfolio";
import store from "../../../store";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../../../helpers/test";

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

    const portfolio = store.getState().portfolioDetail.portfolio;
    expect(portfolio).toEqual(mockBackendResponse);
});
