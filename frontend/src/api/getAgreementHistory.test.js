import { getAgreementHistoryByIdAndPage } from "./getAgreementHistory";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

test("returns wrapped response with data, count, limit, and offset", async () => {
    const mockBackendResponse = {
        data: [
            {
                id: 1,
                history_title: "Agreement Created",
                history_message: "Agreement created by Test User.",
                timestamp: "2025-01-01T00:00:00.000000Z"
            }
        ],
        count: 1,
        limit: 20,
        offset: 0
    };
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return mockBackendResponse;
    });

    const result = await getAgreementHistoryByIdAndPage(1, 1);
    expect(result).toStrictEqual({
        data: mockBackendResponse.data,
        count: 1,
        limit: 20,
        offset: 0
    });
});

test("calls the correct endpoint with limit and offset derived from page", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return { data: [], count: 0, limit: 20, offset: 20 };
    });

    await getAgreementHistoryByIdAndPage(42, 2);
    expect(TestApplicationContext.helpers().callBackend).toHaveBeenCalledWith(
        "/api/v1/agreements/42/history/?limit=20&offset=20",
        "get"
    );
});

test("returns empty data array when no history exists", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => {
        return { data: [], count: 0, limit: 20, offset: 0 };
    });

    const result = await getAgreementHistoryByIdAndPage(99, 1);
    expect(result.data).toStrictEqual([]);
    expect(result.count).toBe(0);
});
