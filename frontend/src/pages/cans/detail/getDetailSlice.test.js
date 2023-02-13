import store from "../../../store";
import constants from "../../../constants";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import { setCan, setCanFiscalYear, setPendingFunds, setSelectedFiscalYear } from "./canDetailSlice";

test("initial state", () => {
    const state = store.getState().canDetail;
    expect(state.can).toEqual({});
    expect(state.canFiscalYearObj).toEqual({});
    expect(state.pendingFunds).toEqual(constants.notFilledInText);
    expect(state.selectedFiscalYear).toEqual({ value: getCurrentFiscalYear(new Date()) });
});

test("should be able to setCan", async () => {
    const result = await store.dispatch(setCan({ id: 1 }));
    const can = result.payload;

    expect(result.type).toBe("canDetail/setCan");
    expect(can.id).toEqual(1);

    const state = store.getState().canDetail;
    expect(state.can).toEqual({ id: 1 });
});

test("should be able to setCanFiscalYear", async () => {
    const result = await store.dispatch(setCanFiscalYear({ id: 1 }));
    const can = result.payload;

    expect(result.type).toBe("canDetail/setCanFiscalYear");
    expect(can.id).toEqual(1);

    const state = store.getState().canDetail;
    expect(state.canFiscalYearObj).toEqual({ id: 1 });
});

test("should be able to setPendingFunds", async () => {
    const result = await store.dispatch(setPendingFunds(1000000.0));
    const funds = result.payload;

    expect(result.type).toBe("canDetail/setPendingFunds");
    expect(funds).toBe(1000000.0);

    const state = store.getState().canDetail;
    expect(state.pendingFunds).toBe(1000000.0);
});

test("should be able to setSelectedFiscalYear", async () => {
    const result = await store.dispatch(setSelectedFiscalYear({ value: 2019 }));
    const year = result.payload;

    expect(result.type).toBe("canDetail/setSelectedFiscalYear");
    expect(year).toEqual({ value: 2019 });

    const state = store.getState().canDetail;
    expect(state.selectedFiscalYear).toEqual({ value: 2019 });
});
