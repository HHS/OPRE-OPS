import { getCanFiscalYearByCan } from "./getCanFiscalYear";
import store from "../store";
import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { dispatchUsecase } from "../helpers/test";
import constants from "../constants";

test("successfully gets the CFY from the backend by can_id and fiscal_year", async () => {
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

    const actualGetCfy = await getCanFiscalYearByCan(mockCfyId, 2022);
    expect(actualGetCfy).toStrictEqual([mockBackendResponse]);
});
