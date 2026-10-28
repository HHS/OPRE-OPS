import { describe, expect, it } from "vitest";
import { futureDateErrorClass } from "./BLIRow.helpers";

describe("futureDateErrorClass", () => {
    it("marks a past date in review mode by default (ALLOW_PAST_OBLIGATE_BY_DATES off)", () => {
        expect(futureDateErrorClass("6/21/2020", true)).toBe("table-item-error");
    });

    it("does not mark a past date in review mode when ALLOW_PAST_OBLIGATE_BY_DATES is on", () => {
        expect(futureDateErrorClass("6/21/2020", true, true)).toBe("");
    });
});
