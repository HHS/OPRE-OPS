import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { getPortfolio, getPortfolioCans } from "./getPortfolio";

test("successfully gets the Portfolio from the backend", async () => {
    const mockPortfolioId = "2";
    const mockBackendResponse = {
        id: mockPortfolioId,
        name: "OPS-Portfolio-1",
        otherStuff: "DogCow",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetPortfolio = await getPortfolio(mockPortfolioId);

    expect(actualGetPortfolio).toEqual(mockBackendResponse);
});

test("successfully gets the Portfolio CAN from the backend and directly puts it into state", async () => {
    const mockCanId = "G99IA14";
    const mockBackendResponse = [
        {
            id: 2,
            number: mockCanId,
            otherStuff: "DogCow",
        },
    ];
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetCan = await getPortfolioCans(mockCanId);

    expect(actualGetCan).toEqual(mockBackendResponse);
});
