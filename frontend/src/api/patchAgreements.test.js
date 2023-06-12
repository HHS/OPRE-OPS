import { patchAgreement } from "./patchAgreements";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

describe("patchAgreement function", () => {
    const agreementId = 1
    const mockAgreement = {
        description: "PATCH Description",
        notes: "PATCH Notes",
    };

    const mockApiResponse = { id: 1, message: "Agreement Updated" };

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("returns the API response data", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return mockApiResponse;
        });

        const response = await patchAgreement(agreementId, mockAgreement);
        expect(response).toStrictEqual(mockApiResponse);
    });

});
