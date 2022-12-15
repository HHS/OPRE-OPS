import { getPortfolioCansAndSetState } from "./getPortfolioCans";
import store from "../store";
import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../helpers/test";

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

    const actualGetCan = getPortfolioCansAndSetState(mockCanId);

    await dispatchUsecase(actualGetCan);

    const can = store.getState().portfolioDetail.portfolioCans;
    expect(can).toEqual(mockBackendResponse);
});
