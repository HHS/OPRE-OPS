import { getPortfolioList } from "./getPortfolioList";
import store from "../../../store";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../../../helpers/test";

test("successfully gets the portfolio list from the backend and directly puts it into state", async () => {
    const mockBackendResponse = [
        {
            id: 1,
            name: "Children",
            status: "Not-Started",
            description: "Portfolio on children",
            otherStuff: "Moof",
        },
        {
            id: 2,
            name: "Families",
            status: "In-Process",
            description: "Portfolio on families",
            otherStuff: "DogCow",
        },
        {
            id: 3,
            name: "Other stuff",
            status: "Sandbox",
            description: "The best portfolio",
            otherStuff: "Clarus",
        },
    ];
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetPortfolioList = getPortfolioList();

    await dispatchUsecase(actualGetPortfolioList);

    const portfolioList = store.getState().portfolioList.portfolios;
    expect(portfolioList).toEqual(mockBackendResponse);
});
