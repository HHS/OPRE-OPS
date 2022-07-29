import { getCanList } from "./getCanList";
import store from "../../../store";

test("successfully gets the can list from the backend", async () => {
    const actualGetCanList = getCanList();
    const dispatch = store.dispatch;
    const getState = store.getState;

    await actualGetCanList(dispatch, getState);

    const canList = getState().canList.cans;
    console.log(canList);
    expect(canList.length).not.toEqual(0);
});
