import { getCanFiscalYearByCan } from "./getCanFiscalYear";
import store from "../../../../store";
import TestApplicationContext from "../../../../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../../../../helpers/test";

test("successfully gets the CFY from the backend by can_id and fiscal_year and directly puts it into state", async () => {
    const mockCfyId = 3;
    const mockBackendResponse = {
        id: mockCfyId,
        fiscal_year: 2022,
        otherStuff: "DogCow",
        total_fiscal_year_funding: 10,
        amount_available: 5,
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [mockBackendResponse];
    });

    const actualGetCfy = getCanFiscalYearByCan(mockCfyId, 2022);

    await dispatchUsecase(actualGetCfy);

    const canFiscalYear = store.getState().canFiscalYearDetail.canFiscalYearObj;
    expect(canFiscalYear).toEqual(mockBackendResponse);

    const pendingFunds = store.getState().canFiscalYearDetail.pendingFunds;
    expect(pendingFunds).toEqual(mockBackendResponse.total_fiscal_year_funding - mockBackendResponse.amount_available);
});

test("don't get the CAN fiscal year and set the pending funds to the nothing string", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [];
    });

    const actualGetCfy = getCanFiscalYearByCan(1, 2022);

    await dispatchUsecase(actualGetCfy);

    const canFiscalYear = store.getState().canFiscalYearDetail.canFiscalYearObj;
    expect(canFiscalYear).toBeUndefined();

    const pendingFunds = store.getState().canFiscalYearDetail.pendingFunds;
    expect(pendingFunds).toEqual("--");
});
