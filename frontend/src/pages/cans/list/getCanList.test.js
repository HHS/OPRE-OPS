import { getCanList } from "./getCanList";
import store from "../../../store";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

test("successfully gets the can list from the backend", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return ["one", "two"];
    });

    const actualGetCanList = getCanList();
    const dispatch = store.dispatch;
    const getState = store.getState;

    await actualGetCanList(dispatch, getState);

    const canList = getState().canList.cans;
    console.log(canList);
    expect(canList.length).not.toEqual(0);
});
