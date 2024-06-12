import { patchAgreement } from "./patchAgreements";
import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { vi } from "vitest";

describe("patchAgreement function", () => {
    const agreementId = 1;
    const mockAgreement = {
        description: "PATCH Description",
        notes: "PATCH Notes"
    };

    const mockApiResponse = { id: 1, message: "Agreement Updated" };

    afterEach(() => {
        vi.resetAllMocks();
    });

    test("returns the API response data", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            return mockApiResponse;
        });

        const response = await patchAgreement(agreementId, mockAgreement);
        expect(response).toStrictEqual(mockApiResponse);
    });

    // simple test for coverage, need to revisit how APIs work with errors
    test("returns nothing with 500", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            throw { response: { status: 500, data: "Internal Server Error" } };
        });
        const response = await patchAgreement(agreementId, mockAgreement);
        expect(response).toStrictEqual(undefined);
    });

    // simple test for coverage, need to revisit how APIs work with errors
    test("returns nothing with response-less error", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            throw { request: "whatever" };
        });
        const response = await patchAgreement(agreementId, mockAgreement);
        expect(response).toStrictEqual(undefined);
    });

    // simple test for coverage, need to revisit how APIs work with errors
    test("returns nothing with bad error", async () => {
        TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
            throw new Error("ERROR");
        });
        const response = await patchAgreement(agreementId, mockAgreement);
        expect(response).toStrictEqual(undefined);
    });
});
