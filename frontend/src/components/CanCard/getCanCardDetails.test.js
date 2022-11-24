import { getCan } from "./getCanCardDetails";
import store from "../../store";
import TestApplicationContext from "../../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../../helpers/test";

test("successfully gets the CAN from the backend and directly puts it into state", async () => {
    const mockCanId = "G99IA14";
    const mockBackendResponse = {
        id: 2,
        number: mockCanId,
        otherStuff: "DogCow",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetCan = getCan(mockCanId);

    await dispatchUsecase(actualGetCan);

    const can = store.getState().canDetail.can;
    expect(can).toEqual(mockBackendResponse);
});
