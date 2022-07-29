import { getCanList } from "./getCanList";
import store from "../../../store";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

test("successfully gets the can list from the backend and directly puts it into state", async () => {
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
    const dispatch = store.dispatch;
    const getState = store.getState;

    await actualGetCanList(dispatch, getState);

    const canList = getState().canList.cans;
    expect(canList).toEqual(mockBackendResponse);
});
