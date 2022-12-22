import { getCan } from "./getCan";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

test("successfully gets the CAN from the backend and directly puts it into state", async () => {
    const mockCanId = "G99IA14";
    const mockBackendResponse = {
        id: 2,
        number: mockCanId,
        otherStuff: "DogCow",
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const actualGetCan = await getCan(mockCanId);
    expect(actualGetCan).toBe(mockBackendResponse);
});
