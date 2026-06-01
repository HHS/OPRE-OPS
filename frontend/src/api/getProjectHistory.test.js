import { getProjectHistoryByIdAndPage } from "./getProjectHistory";
import TestApplicationContext from "../applicationContext/TestApplicationContext";

beforeEach(() => {
    TestApplicationContext.helpers().callBackend.mockReset();
});

test("returns wrapped envelope unwrapped to {items, count, limit, offset}", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => ({
        data: [{ id: 1, history_title: "x", history_message: "y", timestamp: "2026-01-01T00:00:00Z" }],
        count: 1,
        limit: 20,
        offset: 0
    }));

    const result = await getProjectHistoryByIdAndPage(1000, 1);
    expect(result.items).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
});

test("requests page 1 with limit=20 and offset=0", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => ({
        data: [],
        count: 0,
        limit: 20,
        offset: 0
    }));
    await getProjectHistoryByIdAndPage(1000, 1);
    expect(TestApplicationContext.helpers().callBackend).toHaveBeenCalledWith(
        "/api/v1/projects/1000/history/?limit=20&offset=0",
        "get"
    );
});

test("requests page 2 with offset=20", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => ({
        data: [],
        count: 0,
        limit: 20,
        offset: 20
    }));
    await getProjectHistoryByIdAndPage(1000, 2);
    expect(TestApplicationContext.helpers().callBackend).toHaveBeenCalledWith(
        "/api/v1/projects/1000/history/?limit=20&offset=20",
        "get"
    );
});

test("falls back to safe defaults when response is empty", async () => {
    TestApplicationContext.helpers().callBackend.mockImplementation(async () => null);
    const result = await getProjectHistoryByIdAndPage(1000, 1);
    expect(result.items).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
});
