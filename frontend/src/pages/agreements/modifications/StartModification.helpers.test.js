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

    it("disables a budget line in a services component awaiting approval of its addition", () => {
        const servicesComponents = [
            { id: 1, awaiting_add_approval: false },
            { id: 2, awaiting_add_approval: true }
        ];

        expect(getModBudgetLineDisabledReason({ ...plannedThisFY, services_component_id: 2 }, servicesComponents)).toBe(
            MOD_BLI_DISABLED_REASONS.SC_AWAITING_APPROVAL
        );
        expect(
            getModBudgetLineDisabledReason({ ...plannedThisFY, services_component_id: 1 }, servicesComponents)
        ).toBeNull();
    });
});
