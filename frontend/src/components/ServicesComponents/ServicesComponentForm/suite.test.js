import { beforeEach, describe, expect, it } from "vitest";
import suite from "./suite";

describe("ServicesComponentForm Validation Suite", () => {
    beforeEach(() => {
        suite.reset();
    });

    describe("servicesComponentSelect required field", () => {
        it("passes when a SC number is selected", () => {
            const result = suite.run({ servicesComponentSelect: 1 });
            expect(result.getErrors("servicesComponentSelect")).toHaveLength(0);
        });

        it("fails when servicesComponentSelect is 0 (nothing selected)", () => {
            const result = suite.run({ servicesComponentSelect: 0 });
            expect(result.getErrors("servicesComponentSelect")).toContain("This is required information");
        });
    });
});
