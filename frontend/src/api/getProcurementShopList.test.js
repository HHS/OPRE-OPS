// Unit tests for getProcurmentShopList API call
import { getProcurementShopList } from "./getProcurementShopList";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

describe("getProcurementShopList", () => {
    test("should return a list of procurement shops", async () => {
        const mockProcurementShopList = [
            {
                id: 1,
                name: "Procurement Shop 1",
            },
            {
                id: 2,
                name: "Procurement Shop 2",
            },
        ];
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return mockProcurementShopList;
        });
        const actualProcurementShopList = await getProcurementShopList();
        expect(actualProcurementShopList).toStrictEqual(mockProcurementShopList);
    });
});
