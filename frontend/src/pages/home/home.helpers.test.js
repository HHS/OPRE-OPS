import { describe, it, expect } from "vitest";
import { getGreeting } from "./home.helpers";

describe("getGreeting", () => {
    it("greets the user by first name", () => {
        expect(getGreeting("John")).toBe("Welcome back John! Here’s the latest");
    });

    it("falls back to a generic greeting when the first name is missing", () => {
        expect(getGreeting(undefined)).toBe("Welcome to OPS! Here’s the latest");
    });

    it("falls back to a generic greeting when the first name is empty", () => {
        expect(getGreeting("")).toBe("Welcome to OPS! Here’s the latest");
    });
});
