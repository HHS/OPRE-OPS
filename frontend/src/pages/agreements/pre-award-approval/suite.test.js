import { describe, it, expect } from "vitest";
import suite from "./suite";

describe("Request Pre-Award Approval validation suite", () => {
    it("should create suite successfully", () => {
        expect(suite).toBeDefined();
        expect(typeof suite.reset).toBe("function");
        expect(typeof suite.get).toBe("function");
        expect(typeof suite.run).toBe("function");
    });

    it("should not have errors for empty data", () => {
        const result = suite.run({});
        expect(result.hasErrors()).toBe(false);
    });

    it("should not have errors with notes", () => {
        const result = suite.run({ notes: "Test notes" });
        expect(result.hasErrors()).toBe(false);
    });
});
