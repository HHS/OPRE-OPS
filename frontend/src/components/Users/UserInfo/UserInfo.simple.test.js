import { vi, describe, test, expect } from "vitest";

// Mock the API hooks
vi.mock("../../../api/opsAPI.js");
vi.mock("../../../api/opsAuthAPI.js");

describe("UserInfo Mock Test", () => {
    test("should be able to import mocked modules", async () => {
        const opsAPI = await import("../../../api/opsAPI.js");
        const opsAuthAPI = await import("../../../api/opsAuthAPI.js");

        expect(opsAPI).toBeDefined();
        expect(opsAuthAPI).toBeDefined();
    });
});
