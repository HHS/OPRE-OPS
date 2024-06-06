import { getCanFiscalYearByCan } from "./getCanFiscalYear";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

test("successfully gets the CFY from the backend by can_id and fiscal_year", async () => {
    const mockCfyId = 3;
    const mockBackendResponse = {
        id: mockCfyId,
        fiscal_year: 2022,
        otherStuff: "DogCow",
        total_funding: 10,
        amount_available: 5
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return [mockBackendResponse];
    });

    const actualGetCfy = await getCanFiscalYearByCan(mockCfyId, 2022);
    expect(actualGetCfy).toStrictEqual([mockBackendResponse]);
});
