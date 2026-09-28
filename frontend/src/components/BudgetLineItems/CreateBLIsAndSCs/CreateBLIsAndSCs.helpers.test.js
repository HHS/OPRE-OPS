import { describe, expect, it } from "vitest";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import {
    buildSaveSuccessAlert,
    computeBudgetLinePageErrors,
    feesForCards,
    getEffectiveScDateRange,
    totalsForCards
} from "./CreateBLIsAndSCs.helpers";

describe("getEffectiveScDateRange", () => {
    it("returns null start/end when no services components have a PoP window", () => {
        expect(getEffectiveScDateRange([{ period_start: null, period_end: null }])).toEqual({
            start: null,
            end: null
        });
    });

    it("returns the earliest start and latest end across all services components", () => {
        const servicesComponents = [
            { period_start: "2026-03-01", period_end: "2026-06-30" },
            { period_start: "2026-01-01", period_end: "2026-05-31" },
            { period_start: "2026-02-01", period_end: "2026-12-31" }
        ];
        expect(getEffectiveScDateRange(servicesComponents)).toEqual({
            start: "2026-01-01",
            end: "2026-12-31"
        });
    });

    it("ignores services components with a missing period_start or period_end", () => {
        const servicesComponents = [
            { period_start: null, period_end: "2026-06-30" },
            { period_start: "2026-01-01", period_end: null }
        ];
        expect(getEffectiveScDateRange(servicesComponents)).toEqual({
            start: "2026-01-01",
            end: "2026-06-30"
        });
    });
});

describe("feesForCards / totalsForCards", () => {
    it("sums each budget line's fees, treating a missing fees field as 0", () => {
        const budgetLines = [{ fees: 100 }, { fees: 50 }, {}];
        expect(feesForCards(budgetLines)).toBe(150);
    });

    it("returns 0 for an empty array", () => {
        expect(feesForCards([])).toBe(0);
    });

    it("adds the sub total and the summed fees", () => {
        const budgetLines = [{ fees: 100 }, { fees: 25 }];
        expect(totalsForCards(1000, budgetLines)).toBe(1125);
    });
});

describe("computeBudgetLinePageErrors", () => {
    it("surfaces a consolidated message when a grant BLI has a page error", () => {
        const result = computeBudgetLinePageErrors({
            pageErrors: { "Budget line item (1)": ["This is required information"] },
            isGrant: true,
            groupedByGrantNumber: [{ grantNumberNumber: 1, budgetLines: [{ id: 1 }] }],
            groupedByServicesComponent: [],
            isReviewMode: false
        });
        expect(result).toEqual({
            budgetLinePageErrors: [["This is required information"]],
            budgetLinePageErrorsExist: true
        });
    });

    it("returns no errors when there are no Budget line item entries", () => {
        const result = computeBudgetLinePageErrors({
            pageErrors: { "Some other error": ["message"] },
            isGrant: true,
            groupedByGrantNumber: [],
            groupedByServicesComponent: [],
            isReviewMode: false
        });
        expect(result).toEqual({ budgetLinePageErrors: [], budgetLinePageErrorsExist: false });
    });

    it("in review mode, excludes errors from BLIs in the unassociated (grant number 0) bucket", () => {
        const result = computeBudgetLinePageErrors({
            pageErrors: { "Budget line item (1)": ["This is required information"] },
            isGrant: true,
            groupedByGrantNumber: [{ grantNumberNumber: 0, budgetLines: [{ id: 1 }] }],
            groupedByServicesComponent: [],
            isReviewMode: true
        });
        expect(result).toEqual({ budgetLinePageErrors: [], budgetLinePageErrorsExist: false });
    });

    it("outside review mode, still surfaces errors from the unassociated (grant number 0) bucket", () => {
        const result = computeBudgetLinePageErrors({
            pageErrors: { "Budget line item (1)": ["This is required information"] },
            isGrant: true,
            groupedByGrantNumber: [{ grantNumberNumber: 0, budgetLines: [{ id: 1 }] }],
            groupedByServicesComponent: [],
            isReviewMode: false
        });
        expect(result).toEqual({
            budgetLinePageErrors: [["This is required information"]],
            budgetLinePageErrorsExist: true
        });
    });
});

describe("buildSaveSuccessAlert", () => {
    const baseArgs = {
        tempBudgetLines: [],
        deletedBudgetLines: [],
        budgetLines: [],
        cans: [],
        selectedAgreement: { id: 1, display_name: "Test Agreement" },
        savedViaModal: false,
        blockerLocationPathname: undefined
    };

    // Regression coverage for a budget-team user: deletions gate on isSuperUser, financial
    // edits gate on canEditDirectly, and these can disagree for the same user (OPS-6254 review).
    it("does not route a financial-only edit to approval for a budget-team user (canEditDirectly, not a super user)", () => {
        const alert = buildSaveSuccessAlert({
            ...baseArgs,
            canEditDirectly: true,
            isSuperUser: false,
            isThereAnyBLIsFinancialSnapshotChanged: true
        });
        expect(alert.heading).toBe("Agreement Updated");
    });

    it("still routes a PLANNED-line deletion to approval for a budget-team user (canEditDirectly, not a super user)", () => {
        const deletedBudgetLine = { id: 501, status: BLI_STATUS.PLANNED };
        const alert = buildSaveSuccessAlert({
            ...baseArgs,
            deletedBudgetLines: [501],
            budgetLines: [deletedBudgetLine],
            canEditDirectly: true,
            isSuperUser: false,
            isThereAnyBLIsFinancialSnapshotChanged: false
        });
        expect(alert.heading).toBe("Changes Sent to Approval");
        expect(alert.message).toContain("BL 501 Deletion");
    });
});
