import { getCanFiscalYear, getCanFiscalYearByCan } from "./getCanFiscalYear";
import store from "../../../store";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../../../helpers/test";

test("successfully gets the CFY from the backend and directly puts it into state", async () => {
    const mockCfyId = 3;
    const mockBackendResponse = {
        id: mockCfyId,
        fiscal_year: 2022,
        otherStuff: "DogCow",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetCfy = getCanFiscalYear(mockCfyId);

    await dispatchUsecase(actualGetCfy);

    const cfy = store.getState().canFiscalYearDetail.canFiscalYear;
    expect(cfy).toEqual(mockBackendResponse);
});

test("successfully gets the CFY from the backend by can_id and fiscal_year and directly puts it into state", async () => {
    const mockCfyId = 3;
    const mockBackendResponse = {
        id: mockCfyId,
        fiscal_year: 2022,
        otherStuff: "DogCow",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetCfy = getCanFiscalYearByCan(mockCfyId, 2022);

    await dispatchUsecase(actualGetCfy);

    const cfy = store.getState().canFiscalYearDetail.canFiscalYear;
    expect(cfy).toEqual(mockBackendResponse);
});
