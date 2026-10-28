import { describe, expect, it } from "vitest";
import { getModBudgetLineDisabledReason, MOD_BLI_DISABLED_REASONS } from "./StartModification.helpers";

const today = new Date().toISOString().slice(0, 10);
const plannedThisFY = { status: "PLANNED", date_needed: today, in_review: false };

describe("getModBudgetLineDisabledReason", () => {
    it("allows a Planned budget line in the current fiscal year", () => {
        expect(getModBudgetLineDisabledReason(plannedThisFY)).toBeNull();
    });

    it.each([
        ["Draft", { status: "DRAFT" }, MOD_BLI_DISABLED_REASONS.NOT_PLANNED],
        ["Executing", { status: "IN_EXECUTION" }, MOD_BLI_DISABLED_REASONS.CANNOT_CHANGE],
        ["Obligated", { status: "OBLIGATED" }, MOD_BLI_DISABLED_REASONS.CANNOT_CHANGE],
        ["In Review", { in_review: true }, MOD_BLI_DISABLED_REASONS.IN_REVIEW],
        ["future FY", { date_needed: "2044-07-01" }, MOD_BLI_DISABLED_REASONS.NOT_CURRENT_FY]
    ])("disables a %s budget line", (_label, overrides, reason) => {
        expect(getModBudgetLineDisabledReason({ ...plannedThisFY, ...overrides })).toBe(reason);
    });
});
