import { describe, it, expect } from "vitest";
import suite from "./suite";

describe("Request Pre-Award Approval validation suite", () => {
    it("should create suite successfully", () => {
        expect(suite).toBeDefined();
        expect(typeof suite.reset).toBe("function");
        expect(typeof suite.get).toBe("function");
    });

    it("should not have errors for empty data", () => {
        suite({});
        const result = suite.get();
        expect(result.hasErrors()).toBe(false);
    });

    it("should not have errors with notes", () => {
        suite({ notes: "Test notes" });
        const result = suite.get();
        expect(result.hasErrors()).toBe(false);
    });
});
