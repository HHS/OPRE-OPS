import { getCanList } from "./getCanList";
import store from "../../../store";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../../../helpers/test";

test("successfully gets the CAN list from the backend and directly puts it into state", async () => {
    const mockBackendResponse = [
        {
            id: 1,
            number: "G99HRF2",
            otherStuff: "Moof",
        },
        {
            id: 2,
            number: "G99IA14",
            otherStuff: "DogCow",
        },
        {
            id: 3,
            number: "G99PHS9",
            otherStuff: "Clarus",
        },
    ];
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetCanList = getCanList();

    await dispatchUsecase(actualGetCanList);

    const canList = store.getState().canList.cans;
    expect(canList).toEqual(mockBackendResponse);
});
